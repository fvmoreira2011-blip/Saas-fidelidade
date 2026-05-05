# Deploy para Hostinger (Buypass Brasil)

Este documento explica como configurar o deploy automático para a Hostinger no domínio `app.buypassbrasil.com.br`.

## 1. Suporte a Rotas (Frontend)
Foi adicionado o arquivo `public/.htaccess`. Ele é essencial para que o React Router funcione corretamente em servidores Apache (Hostinger). Sem ele, ao atualizar a página fora da home, você receberia um erro 404.

## 2. Deploy Automático via GitHub Actions
Criei um workflow em `.github/workflows/hostinger-deploy.yml`. Para ativá-lo:

1. Suba seu código para um repositório no **GitHub**.
2. No repositório, vá em **Settings > Secrets and variables > Actions**.
3. Adicione os seguintes **Secrets**:
   - `FTP_SERVER`: O endereço FTP da Hostinger (ex: `ftp.buypassbrasil.com.br`).
   - `FTP_USERNAME`: Seu usuário de FTP.
   - `FTP_PASSWORD`: Sua senha de FTP.
   - `VITE_FIREBASE_API_KEY`: Sua API Key do Firebase.
   - `VITE_FIREBASE_AUTH_DOMAIN`: ...e todas as outras do Firebase (veja o arquivo `.env.example`).

Toda vez que você fizer um `push` para a branch `main`, o GitHub irá:
- Buildar o projeto (`npm run build`).
- Gerar a pasta `dist/`.
- Enviar via FTP para a pasta `/public_html/` da Hostinger.

## 3. Hostinger Git Build (Automático via Painel Hostinger)
Se você usa a ferramenta de "Git" dentro do painel da Hostinger para fazer o deploy:

1. **Configuração do Repositório:** Aponte para sua branch principal.
2. **Diretório Base (MUITO IMPORTANTE):** No painel da Hostinger, procure pela opção "Base Directory" ou "Pasta de Instalação". 
   - Por padrão, a Hostinger tenta servir a raiz do projeto.
   - **Mude para:** `dist`
   - Isso fará com que o site seja servido corretamente a partir da pasta gerada pelo build.
3. **Comando de Build:** Certifique-se de que o comando `npm run build` está configurado no painel da Hostinger.

## 4. Problemas Comuns (Erro de Implantação)
Se o log de build termina com "built in XXs" mas o site não carrega:
- **Index.html não encontrado:** Verifique se o diretório configurado no painel é `dist`. Se o painel não permitir mudar o diretório, você terá que mover os arquivos da pasta `dist` manualmente para a raiz da `public_html`.
- **Mod_security:** Arquivos muito grandes podem ser bloqueados. Eu configurei o "Chunk Splitting" no `vite.config.ts` para dividir os arquivos em pedaços menores, o que ajuda na estabilidade.
## 5. Notas sobre o Backend (Node.js)
Este projeto possui um servidor Express (`server.ts`) para receber webhooks.
- **Hospedagem Compartilhada:** Planos comuns da Hostinger não executam Node.js nativamente na `/public_html`. O frontend (React) funcionará 100%, mas o endpoint de webhook (`/api/erp/loyalty`) exige um plano **VPS** ou o uso do **Node.js Selector** no painel (se habilitado).
- **Apenas Frontend:** Se você usa apenas Firebase/Gemini no lado do cliente, o deploy da pasta `dist` na `public_html` é tudo o que você precisa!
