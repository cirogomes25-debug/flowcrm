# ⚡ FlowCRM — Guia de Deploy Online
### Do zero ao link funcionando em ~30 minutos

---

## O que você vai precisar criar (tudo gratuito):
1. **Conta Firebase** → banco de dados compartilhado em tempo real
2. **Conta GitHub** → onde o código fica armazenado
3. **Conta Vercel** → onde o site fica hospedado (gera seu link)

---

## PARTE 1 — Firebase (banco de dados)

### 1.1 Criar conta Firebase
1. Acesse **https://firebase.google.com**
2. Clique em **"Começar"** ou **"Get started"**
3. Clique em **"Fazer login com o Google"** e entre com sua conta Google
4. Você vai ver o console do Firebase

### 1.2 Criar um projeto
1. Clique em **"Adicionar projeto"** (botão com +)
2. No campo nome, digite: `flowcrm` (ou qualquer nome que quiser)
3. Clique em **Continuar**
4. Na tela do Google Analytics, pode **desativar** e clicar em **Criar projeto**
5. Aguarde uns segundos... clique em **Continuar**

### 1.3 Criar o banco de dados
1. No menu lateral esquerdo, procure **"Compilação"** → clique em **"Realtime Database"**
2. Clique no botão **"Criar banco de dados"**
3. Escolha a localização: selecione **"United States (us-central1)"**
4. Clique em **Próxima**
5. Em "Regras de segurança", selecione **"Iniciar no modo de teste"**
6. Clique em **"Ativar"**
7. Você vai ver a URL do banco — ela será algo como:
   `https://flowcrm-xxxxx-default-rtdb.firebaseio.com`
   **Guarde essa URL!** Você vai precisar dela.

### 1.4 Pegar as credenciais do projeto
1. No menu lateral, clique na **engrenagem ⚙️** ao lado de "Visão geral do projeto"
2. Clique em **"Configurações do projeto"**
3. Role a página para baixo até a seção **"Seus apps"**
4. Clique no ícone **"</>"** (web app)
5. No campo "Apelido do app", digite: `flowcrm-web`
6. Clique em **"Registrar app"**
7. Vai aparecer um código assim:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXX",
  authDomain: "flowcrm-xxxxx.firebaseapp.com",
  databaseURL: "https://flowcrm-xxxxx-default-rtdb.firebaseio.com",
  projectId: "flowcrm-xxxxx",
  storageBucket: "flowcrm-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

**📋 Copie e salve esse bloco inteiro!** Você vai colar no próximo passo.

8. Clique em **"Continuar no console"**

---

## PARTE 2 — GitHub (armazenar o código)

### 2.1 Criar conta GitHub
1. Acesse **https://github.com**
2. Clique em **"Sign up"**
3. Digite seu **email**, crie uma **senha** e escolha um **nome de usuário**
4. Verifique seu email (chega um código)
5. Complete o cadastro (pode pular as perguntas clicando em "Skip personalization")

### 2.2 Criar um repositório
1. Na página inicial do GitHub, clique em **"New"** (botão verde) ou no **"+"** no canto superior direito
2. Em "Repository name", digite: `flowcrm`
3. Deixe marcado como **Public**
4. Marque a opção **"Add a README file"**
5. Clique em **"Create repository"**

### 2.3 Fazer upload dos arquivos
1. Na página do repositório que acabou de criar, clique em **"Add file"** → **"Upload files"**
2. Arraste **todos os arquivos** da pasta `flowcrm-deploy` que o Claude gerou
   (os arquivos são: `package.json`, `vite.config.js`, `index.html`, `.env.example` e a pasta `src/`)
3. No campo de commit, deixe a mensagem padrão
4. Clique em **"Commit changes"**

### 2.4 Configurar o arquivo .env com suas credenciais Firebase
1. No repositório, clique no arquivo **`.env.example`**
2. Clique no ícone de lápis ✏️ para editar
3. Substitua cada valor com os dados do Firebase que você copiou:
   ```
   VITE_FB_KEY=AIzaSyXXXXXXXXXXXXX
   VITE_FB_DOMAIN=flowcrm-xxxxx.firebaseapp.com
   VITE_FB_URL=https://flowcrm-xxxxx-default-rtdb.firebaseio.com
   VITE_FB_PROJECT=flowcrm-xxxxx
   VITE_FB_BUCKET=flowcrm-xxxxx.appspot.com
   VITE_FB_SENDER=123456789
   VITE_FB_APP=1:123456789:web:abcdef
   ```
4. **Renomeie o arquivo** de `.env.example` para `.env`
5. Clique em **"Commit changes"**

---

## PARTE 3 — Vercel (hospedar e gerar o link)

### 3.1 Criar conta Vercel
1. Acesse **https://vercel.com**
2. Clique em **"Sign Up"**
3. Selecione **"Continue with GitHub"** — isso conecta os dois automaticamente
4. Autorize o Vercel a acessar sua conta GitHub

### 3.2 Fazer o deploy
1. Na tela inicial do Vercel, clique em **"Add New Project"**
2. Você vai ver o repositório `flowcrm` que criou — clique em **"Import"**
3. O Vercel vai detectar que é um projeto Vite automaticamente
4. Na seção **"Environment Variables"**, adicione cada variável:
   - Clique em "Add" para cada uma:
   - `VITE_FB_KEY` → cole o valor correspondente
   - `VITE_FB_DOMAIN` → cole o valor
   - `VITE_FB_URL` → cole o valor
   - `VITE_FB_PROJECT` → cole o valor
   - `VITE_FB_BUCKET` → cole o valor
   - `VITE_FB_SENDER` → cole o valor
   - `VITE_FB_APP` → cole o valor
5. Clique em **"Deploy"**
6. Aguarde 1-2 minutos...

### 3.3 Seu link está pronto! 🎉
O Vercel vai gerar um link do tipo:
```
https://flowcrm.vercel.app
```
ou
```
https://flowcrm-seunome.vercel.app
```

**Compartilhe esse link com seus SDRs** — todos vão acessar o mesmo CRM com dados compartilhados em tempo real!

---

## PARTE 4 — Primeiros passos no CRM online

1. Abra o link gerado
2. Na primeira vez, o CRM vai carregar com os dados de exemplo
3. Vá em **Equipe (◑)** e edite os nomes dos SDRs com os nomes reais da sua equipe
4. Cada SDR acessa o mesmo link e seleciona seu perfil no canto inferior esquerdo
5. Todos os dados (contatos, pipeline, follow-ups) são sincronizados automaticamente

---

## Dúvidas frequentes

**O link vai sair do ar?**
Não. Vercel e Firebase têm plano gratuito permanente para projetos pequenos e médios.

**Os dados são seguros?**
Sim. O banco de dados Firebase é privado e só quem tem o link do CRM consegue acessar.

**Posso personalizar o domínio? (ex: crm.minhaempresa.com.br)**
Sim! No Vercel, na seção "Domains", você pode adicionar um domínio próprio gratuitamente.

**Quantos SDRs podem usar ao mesmo tempo?**
O plano gratuito do Firebase suporta até 100 conexões simultâneas e 1GB de dados, o suficiente para uma equipe de vendas.

---

## Precisa de ajuda?
Se travar em qualquer etapa, copie a mensagem de erro e mande para o Claude — resolvo na hora!
