# Fakeflix

Repositório oficial do curso Aplicações Enterprise com Node.js da [Tech Leads club](https://comece.techleads.club)

## 🛠️ Instalação

Requisitos mínimos:

- Node.js 20.x
- Docker

```bash
cp .env.default .env

# Instalar e rodar dependências externas.
npm run docker:up

# Criar o banco de dados e rodar as migrações.
npm run db:migrate
```
