# Drivo — sua garagem inteligente

Web app para montar sua garagem de veículos. O diferencial: você envia o **CRLV** (PDF ou foto) e a **API gratuita do Gemini** lê o documento e preenche o cadastro automaticamente.

## Funcionalidades

- Cadastro, login (JWT) e logout
- Listagem de veículos com busca (placa, marca, modelo, cor, chassi) e paginação
- Criar, editar e excluir veículo
- Importar CRLV com IA (Gemini) — os dados extraídos preenchem o formulário para você **revisar** antes de salvar
- Alterar dados cadastrais (nome, e-mail e senha)
- Estados de loading, erro (com "tentar novamente") e vazio
- Documentação OpenAPI/Swagger em `http://localhost:3333/docs`

## Stack

| Camada | Tecnologia |
| --- | --- |
| Front-end | Next.js 14 (App Router), React 18, Tailwind CSS |
| Back-end | Fastify 5, Zod, `@fastify/jwt`, `@fastify/swagger` |
| Banco | PostgreSQL 16 + Prisma |
| IA | Gemini API (REST, `gemini-2.5-flash`) |
| Infra | Docker + docker-compose |

## Estrutura

```
drivo/
├── backend/      # API REST (Fastify)
│   ├── prisma/   # schema do banco
│   ├── src/modules/{auth,users,vehicles,crlv}
│   └── tests/
├── frontend/     # Next.js
│   └── src/{app,components,lib}
├── docker-compose.yml
└── .env.example
```

## Como instalar e executar (Docker — um único comando)

Pré-requisitos: Docker e Docker Compose.

```bash
cp .env.example .env
# edite .env e preencha GEMINI_API_KEY (chave gratuita: https://aistudio.google.com/apikey)
docker compose up --build
```

- App: http://localhost:3000
- API: http://localhost:3333
- Swagger: http://localhost:3333/docs

> Sem `GEMINI_API_KEY` tudo funciona, exceto a importação de CRLV (a API responde `503` com mensagem explicativa e o usuário ainda pode preencher manualmente).

## Como executar sem Docker (desenvolvimento)

Precisa de Node 22+ e um Postgres rodando (pode subir só o banco com `docker compose up db`).

```bash
# backend
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma db push
npm run dev            # http://localhost:3333

# frontend (outro terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev            # http://localhost:3000
```

## Como executar os testes

```bash
cd backend && npm test     # Vitest
cd frontend && npm test    # Vitest
```

Os testes do backend **não precisam de banco**: cobrem healthcheck, proteção das rotas com JWT, validação de entrada (Zod), documento OpenAPI, normalização dos dados do CRLV e o schema de veículo. O Prisma é mockado nos testes de rota.

## API (resumo)

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/auth/register` | Cadastro (retorna JWT) |
| POST | `/auth/login` | Login (retorna JWT) |
| GET / PATCH | `/me` | Dados do usuário / alterar dados cadastrais |
| GET | `/vehicles?search=&page=&pageSize=` | Lista e pesquisa |
| GET | `/vehicles/:id` | Detalhe |
| POST | `/vehicles` | Cria |
| PUT | `/vehicles/:id` | Edita |
| DELETE | `/vehicles/:id` | Exclui |
| POST | `/crlv/scan` | `multipart/form-data` (campo `file`) → dados extraídos pelo Gemini |

Erros seguem o formato `{ "code": "...", "message": "...", "issues"?: [{ "field", "message" }] }`.

## Decisões técnicas

- **Fastify + Zod (`fastify-type-provider-zod`)**: um único schema valida a entrada, tipa os handlers e gera o OpenAPI.
- **Módulos por domínio** (`routes` → `service` → Prisma, mais `schemas`): rotas finas e regras de negócio isoladas.
- **Gemini via REST (`fetch`)**: evita uma dependência a mais. Usamos `responseMimeType: application/json` e `temperature: 0`, e passamos a resposta por `normalizeCrlv`, que limpa e valida o que o modelo devolve (a saída de LLM nunca é confiada diretamente).
- **O scan não grava nada**: `/crlv/scan` só devolve os dados. O usuário revisa no formulário e salva pelo fluxo normal — evita persistir leituras erradas.
- **Autorização por dono**: toda query de veículo filtra por `userId` do JWT; um usuário nunca acessa veículo de outro (retorna 404).
- **Placa única por usuário** (`@@unique([userId, plate])`), aceitando formato antigo e Mercosul.
- **Login sem enumeração de usuários**: mesma mensagem para e-mail inexistente e senha errada.
- **Token em cookie** lido pelo `middleware.ts` do Next (redireciona rotas privadas sem flash) e enviado como `Bearer` pelo cliente de API.
- **Sem bibliotecas de estado/fetch no front**: com poucas telas, `useEffect` + um cliente `api()` pequeno bastam; busca com debounce.

## Limitações

- O token fica em cookie **não-HttpOnly** (definido via JS), logo está exposto a XSS. Em produção o ideal é cookie HttpOnly emitido pelo servidor.
- Sem refresh token: a sessão expira em 7 dias e o usuário precisa logar de novo.
- Schema sincronizado com `prisma db push` na subida do container; **não há migrations versionadas**.
- A precisão da leitura do CRLV depende do Gemini e da qualidade do arquivo; a API gratuita tem limite de requisições (a UI mostra mensagem específica no erro 429).
- Sem rate limiting nem verificação de e-mail.
- Interface criada sem o Figma (o link do enunciado não estava preenchido), portanto não é fiel a um layout específico.
- Os testes de rota usam Prisma mockado; não há testes de integração com banco real nem testes de componentes React/E2E.
