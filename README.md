# Fakeflix

Repositório oficial do curso Aplicações Enterprise com Node.js da [Tech Leads
club](https://comece.techleads.club)

## 🛠️ Instalação

Requisitos mínimos:

- Node.js 20.x
- Docker

```shell
cp .env.default .env

# Instalar e rodar dependências externas.
npm run docker:up

# Criar o banco de dados e rodar as migrações.
npm run db:setup
```

## ✅ Testes

```shell
# Testes de tipagem.
npm run test:types

# Testes de unidade. 
npm run test:unit
npm run test:unit:watch

# Testes de integração e E2E (requer os containers do docker).
# Rodar as migrações apenas uma vez para criar o banco de testes.
npm run test:db:migrate 

# Testes de integração.
npm run test:integration
npm run test:integration:watch

# Testes end-to-end.
npm run test:e2e
npm run test:e2e:watch
```
