# scp

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```


# Como Rodar Backend Node.js no Servidor (Windows + XAMPP)

## Passo a Passo Completo

### 1. Suba o backend para o servidor

- Copie a pasta do backend (Node.js, normalmente com `index.js` ou `app.js` e `package.json`) para o servidor.
- Ela pode ficar, por exemplo, em `C:\backend-app`.

---

### 2. Instale o Node.js no servidor

- Se ainda não tiver, baixe e instale o [Node.js](https://nodejs.org/en/download) no servidor.
- Depois, abra o CMD e confira:
  ```bash
  node -v
  npm -v
  ```

---

### 3. Instale as dependências do backend

- No CMD, entre na pasta do backend:
  ```bash
  cd C:\backend-app
  npm install
  ```

---

### 4. Teste o backend

- No CMD, ainda na pasta, rode:
  ```bash
  node index.js
  ```
  ou
  ```bash
  node app.js
  ```
  (depende do seu arquivo principal)
- Veja se aparece algo como “Servidor rodando na porta 3000” (ou outra porta).
- Tente acessar do próprio servidor:
  ```
  http://localhost:3000
  ```
- Se funcionar, está ok.

---

### 5. (Opcional, recomendado) Use PM2 para rodar 24h e iniciar junto com o servidor

#### Instale o PM2 globalmente:
```bash
npm install -g pm2
```

#### Rode o backend com PM2:
```bash
pm2 start index.js --name "meu-backend"
```

#### Salve o processo para iniciar junto do Windows:
```bash
npm install -g pm2-windows-startup
pm2-startup install
pm2 save
```
> Pronto! Seu backend vai rodar 24h e reiniciar automaticamente junto com o Windows.

---

### 6. (Firewall) Libere a porta do backend

No Windows, adicione uma regra no firewall para liberar a porta que o backend usa (exemplo: 3000).

- Painel de Controle > Firewall do Windows > Regras de Entrada > Nova Regra > Porta > TCP > 3000 > Permitir.

---

### 7. (Frontend) Ajuste as requests para o endereço do servidor

No seu Vue, aponte as requisições para o IP do servidor (ex: `http://ip-do-servidor:3000`).

---

## Resumo Visual

```
C:\backend-app\ (backend Node.js)
  |-- index.js
  |-- package.json
  |-- node_modules/
```
- Backend roda por PM2, independente do seu computador.
- PM2 garante que o backend sempre inicie junto do servidor.

