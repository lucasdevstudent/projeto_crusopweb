# SiNutre

Aplicação web para acompanhar a alimentação: o usuário entra com a conta do GitHub, registra refeições com alimentos e quantidades em gramas, e acompanha calorias, macronutrientes, meta calórica diária, peso e IMC.

## Funcionalidades

- Login com GitHub (OAuth)
- Registro de refeições por dia
- Busca de alimentos cadastrados na base de dados
- Adição de alimentos às refeições, com a quantidade em gramas
- Acompanhamento de macronutrientes (proteínas, carboidratos e gorduras)
- Meta calórica diária estimada
- Evolução de peso, com gráfico
- IMC atual, com classificação

## Tecnologias

- **Back-end:** Node.js, Express, TypeScript, Prisma 7 (SQLite com adapter libsql), JWT
- **Front-end:** React, Vite, TypeScript

## Estrutura

```
projeto_crusopweb/
  prisma/              schema, migrações e seed de alimentos
  src/
    config/            variáveis de ambiente
    controllers/       login com GitHub
    middleware/        validação do JWT
    routes/            rotas de autenticação e da API
    app.ts             configuração do Express
    index.ts           inicia o servidor
    prisma.ts          cliente do banco
  frontend/            aplicação React (Vite)
```

## Pré-requisitos

- Node.js 20 ou superior
- Uma OAuth App no GitHub (Settings > Developer settings > OAuth Apps), com a **Authorization callback URL** igual a `http://localhost:3000/auth/github/callback`

## Como rodar

### 1. Back-end

Na pasta raiz do projeto:

```bash
npm install
```

Crie o arquivo `.env` (ele não deve ser enviado ao Git):

```dotenv
PORT=3000
FRONTEND_URL=http://localhost:5173
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET=troque-por-um-valor-longo-e-aleatorio
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
```

Para gerar um `JWT_SECRET`:

```bash
openssl rand -hex 32
```

Prepare o banco e inicie o servidor:

```bash
npx prisma migrate dev --name init
npx prisma generate
npx tsx prisma/seed.ts
npm run dev
```

O terminal deve mostrar `API rodando em http://localhost:3000`. Teste em `http://localhost:3000/health`.

### 2. Front-end

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`. Se o back-end estiver em outra porta, crie `frontend/.env` com:

```dotenv
VITE_API_URL=http://localhost:3000
```

Os dois servidores precisam estar rodando ao mesmo tempo.

## Variáveis de ambiente (back-end)

| Variável | Descrição |
| --- | --- |
| `PORT` | Porta da API (padrão 3000) |
| `FRONTEND_URL` | Endereço do front, usado no CORS e no redirecionamento após o login |
| `DATABASE_URL` | Caminho do banco SQLite |
| `JWT_SECRET` | Segredo usado para assinar o token |
| `GITHUB_CLIENT_ID` | Client ID da OAuth App |
| `GITHUB_CLIENT_SECRET` | Client Secret da OAuth App |
| `GITHUB_CALLBACK_URL` | Callback cadastrada na OAuth App |

## API

Todas as rotas de `/api` exigem o cabeçalho `Authorization: Bearer <token>`.

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/auth/github` | Inicia o login com GitHub |
| GET | `/auth/github/callback` | Recebe o retorno do GitHub e redireciona ao front com o token |
| GET | `/health` | Verifica se a API está no ar |
| GET | `/api/me` | Usuário logado e seu perfil |
| PUT | `/api/profile` | Salva altura, ano de nascimento, sexo e nível de atividade |
| GET | `/api/foods?q=` | Busca alimentos pelo nome |
| GET | `/api/meals?date=AAAA-MM-DD` | Lista as refeições do dia |
| POST | `/api/meals` | Cria uma refeição (`name`, `date`) |
| DELETE | `/api/meals/:id` | Exclui uma refeição |
| POST | `/api/meals/:id/items` | Adiciona um alimento (`foodId`, `grams`) |
| DELETE | `/api/meals/:id/items/:itemId` | Remove um alimento da refeição |
| GET | `/api/weights` | Lista os registros de peso |
| POST | `/api/weights` | Registra um peso (`kg`, `date`) |
| DELETE | `/api/weights/:id` | Remove um registro de peso |
| GET | `/api/summary?date=AAAA-MM-DD` | Totais do dia, meta calórica, IMC e peso atual |

## Como os cálculos funcionam

- **IMC:** peso (kg) dividido pela altura (m) ao quadrado, usando o último peso registrado.
- **Meta calórica:** taxa metabólica basal pela equação de Mifflin-St Jeor, multiplicada pelo fator de atividade escolhido. É uma estimativa e não substitui a orientação de um profissional de saúde.
- **Nutrientes:** os valores de cada alimento são por 100 g e proporcionais à quantidade informada. Os valores do seed são aproximados.

## Cuidados

- Nunca envie o `.env` ao repositório. Confirme que ele está no `.gitignore`, junto com `node_modules`.
- Para publicar na internet, é preciso hospedar o back e o front, criar uma OAuth App de produção com a callback pública e ajustar `GITHUB_CALLBACK_URL`, `FRONTEND_URL` e `VITE_API_URL`.
