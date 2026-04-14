# Atualizações de Hoje - 13/04/2026

Este documento resume todas as melhorias e correções implementadas hoje no sistema de Fidelidade Varejo.

## 1. Identidade Visual e Logos
- **Correção de Exibição:** Corrigido o erro onde logos de novas empresas (como a DNA) não apareciam no WebApp. O sistema agora suporta tanto `logoURL` quanto `photoURL`.
- **Whitelisting:** A empresa **DNA** foi adicionada à lista de proteção do script de limpeza automática, garantindo que seus dados não sejam removidos durante manutenções.

## 2. Sistema de Notificações (WebApp do Consumidor)
- **Badge de Alertas:** Adicionado um balão vermelho (badge) no ícone de "Alertas" que mostra a quantidade de mensagens não lidas.
- **Swipe-to-Delete (Deslizar para Apagar):** Implementada a funcionalidade de deslizar para a esquerda ou direita para excluir notificações.
- **Correção de Persistência:** Corrigido o erro onde notificações deletadas reapareciam. Isso envolveu a atualização das **Regras de Segurança do Firestore** e a implementação de **Updates Otimistas** na interface.
- **Headlines Personalizadas:** Todas as notificações enviadas agora utilizam o padrão: `"Mensagem da [Nome da Empresa] para você"`.

## 3. Infraestrutura e PWA
- **Background Notifications:** Atualização do Service Worker (`sw.js`) para suportar o recebimento de notificações mesmo quando o app está em segundo plano ou fechado.
- **Segurança:** Atualização das permissões do banco de dados para permitir que consumidores gerenciem suas próprias notificações de forma segura.

---
**Instruções para Deploy:**
Para levar estas alterações para o seu GitHub ou baixar o código:
1. Clique no menu **Settings** (ícone de engrenagem) no canto superior direito do AI Studio.
2. Selecione **Export to GitHub** ou **Download ZIP**.
