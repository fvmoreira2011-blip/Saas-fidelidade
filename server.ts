
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  Timestamp,
  increment,
  getDoc
} from 'firebase/firestore';
import firebaseConfigJson from './firebase-applet-config.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Firebase (Server-side using Client SDK)
  const firebaseApp = initializeApp(firebaseConfigJson);
  const db = getFirestore(firebaseApp, firebaseConfigJson.firestoreDatabaseId);

  // Helper to parse BRL currency "1.500,50" -> 1500.50
  const parseBRL = (value: string | number): number => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return 0;
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
  };

  // Helper to parse date "DD/MM/AAAA" -> ISO
  const parseDate = (dateStr: string): string => {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`;
    }
    return new Date().toISOString();
  };

  // ERP Webhook Endpoint
  app.post('/api/erp/loyalty', async (req, res) => {
    const { api_key, cliente, venda } = req.body;

    if (!api_key) {
      return res.status(401).json({ error: 'Falta api_key' });
    }

    try {
      // 1. Encontrar a configuração da empresa pela erpKey
      const configsRef = collection(db, 'configs');
      const q = query(configsRef, where('erpKey', '==', api_key));
      const configSnap = await getDocs(q);

      if (configSnap.empty) {
        return res.status(404).json({ error: 'Configuração não encontrada para esta api_key' });
      }

      const configDoc = configSnap.docs[0];
      const configData = configDoc.data();
      const companyId = configDoc.id;

      // 2. Extrair e Validar dados
      const nome = cliente?.nome_completo || cliente?.nome;
      const celular = cliente?.celular;
      const dataNasc = cliente?.data_nascimento || cliente?.aniversario;
      const valorBruto = parseBRL(venda?.valor_bruto || venda?.valor);

      if (!celular || !nome) {
        return res.status(400).json({ error: 'Dados do cliente incompletos (nome e celular são obrigatórios)' });
      }

      // 3. Buscar ou criar cliente
      // Usamos uma estrutura de subcoleção ou coleção global conforme o app
      // No blueprint, customers é uma coleção global. Vamos assumir que é por empresa ou global.
      // O App parece usar 'customers' global mas filtrado ou associado.
      // Vamos buscar por celular.
      const customersRef = collection(db, 'customers');
      const cq = query(customersRef, where('phone', '==', celular));
      const customerSnap = await getDocs(cq);

      let customerId;
      let currentPoints = 0;
      let currentCashback = 0;

      if (customerSnap.empty) {
        // Criar novo cliente
        const newCustomer = {
          name: nome,
          phone: celular,
          points: 0,
          cashbackBalance: 0,
          birthDate: dataNasc ? parseDate(dataNasc) : null,
          createdAt: new Date().toISOString(),
          lastPurchaseDate: new Date().toISOString(),
          companyId: companyId // Associar à empresa
        };
        const newDoc = await addDoc(customersRef, newCustomer);
        customerId = newDoc.id;
      } else {
        const custDoc = customerSnap.docs[0];
        customerId = custDoc.id;
        currentPoints = custDoc.data().points || 0;
        currentCashback = custDoc.data().cashbackBalance || 0;
      }

      // 4. Calcular Recompensas
      let pointsEarned = 0;
      let cashbackEarned = 0;

      if (configData.rewardMode === 'points') {
        pointsEarned = Math.floor(valorBruto * (configData.pointsPerReal || 1));
      } else if (configData.rewardMode === 'cashback') {
        const percentage = configData.cashbackConfig?.percentage || 0;
        cashbackEarned = (valorBruto * percentage) / 100;
      }

      // 5. Registrar Compra
      const purchasesRef = collection(db, 'purchases');
      await addDoc(purchasesRef, {
        customerId,
        customerName: nome,
        amount: valorBruto,
        pointsEarned,
        cashbackEarned,
        date: new Date().toISOString(),
        companyId,
        source: 'ERP'
      });

      // 6. Atualizar Cliente
      const customerRef = doc(db, 'customers', customerId);
      await updateDoc(customerRef, {
        points: increment(pointsEarned),
        cashbackBalance: increment(cashbackEarned),
        lastPurchaseDate: new Date().toISOString()
      });

      // 7. Criar Notificação
      const notificationsRef = collection(db, 'notifications');
      await addDoc(notificationsRef, {
        customerId,
        companyId,
        title: 'Pontuação Recebida!',
        message: `Você recebeu ${pointsEarned > 0 ? pointsEarned + ' pontos' : 'R$ ' + cashbackEarned.toFixed(2) + ' de cashback'} da sua compra de R$ ${valorBruto.toFixed(2)}.`,
        type: 'points',
        date: new Date().toISOString(),
        read: false
      });

      return res.status(200).json({ 
        success: true, 
        message: 'Pontuação processada com sucesso',
        data: {
          pointsEarned,
          cashbackEarned,
          newBalance: {
            points: currentPoints + pointsEarned,
            cashback: currentCashback + cashbackEarned
          }
        }
      });

    } catch (error: any) {
      console.error('ERP Webhook Error:', error);
      return res.status(500).json({ error: 'Erro interno no processamento', details: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.get('/consumer.html', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const template = await fs.readFile(path.resolve(__dirname, 'consumer.html'), 'utf-8');
        const html = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    app.get('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const template = await fs.readFile(path.resolve(__dirname, 'index.html'), 'utf-8');
        const html = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Explicitly handle consumer.html
    app.get('/consumer.html', (req, res) => {
      res.sendFile(path.join(distPath, 'consumer.html'));
    });

    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
