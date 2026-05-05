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

## 3. Notas sobre o Backend (Node.js)
Este projeto possui um servidor Express (`server.ts`) para receber webhooks de ERP. 
- **Hospedagem Compartilhada:** Se o seu plano na Hostinger for o compartilhado (mais comum), ele não executa Node.js nativamente na `/public_html`. O frontend funcionará perfeitamente, mas o endpoint `/api/erp/loyalty` não.
- **Solução:** Para usar o Webhook, você precisaria de um plano **VPS** ou configurar o **Node.js Selector** no painel da Hostinger (se disponível), apontando para o arquivo `server.ts`.

Se você usa apenas as funcionalidades do Firebase diretamente no frontend, o deploy na `/public_html` é suficiente!
