# 🎬 Fakeflix

Meu fork de estudos do laboratório de arquitetura enterprise da Tech Leads Club. Uso esse repositório pra praticar padrões de arquitetura modular em Node.js construindo uma simulação simplificada de um serviço de streaming (estilo Netflix).

> Repositório original: [tech-leads-club/fakeflix](https://github.com/tech-leads-club/fakeflix)

[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.0.0-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/nestjs-%5E10.0.0-ea2845.svg)](https://nestjs.com/)

---

## 🧠 O que tem aqui

Uma aplicação NestJS organizada em módulos de domínio independentes, num monorepo gerenciado por Nx. A ideia é exercitar na prática:

- **Arquitetura modular** — apps como bootstraps finos, packages com toda lógica de negócio
- **Domain-Driven Design** — separação clara de domínios e responsabilidades
- **Event-driven** — comunicação assíncrona entre módulos
- **Testing** — unit, integration e e2e em aplicações modulares
- **CI/CD** — pipelines automatizados com GitHub Actions

## 🏗️ Domínios

- 📺 **Content** — catálogo de vídeos, séries, filmes e recomendações
- 👤 **Identity** — usuários, autenticação e autorização
- 💳 **Billing** — assinaturas, pagamentos e planos

## 🚀 Como rodar

**Pré-requisitos:** Node.js 20+, Yarn, Docker e Docker Compose.

```bash
# Instala dependências
yarn install --frozen-lockfile

# Sobe Postgres, Redis e demais serviços
yarn docker:up

# Aplica migrations em todos os módulos
yarn db:migrate:all

# Inicia a API monolítica
nx serve monolith
```

API disponível em `http://localhost:3000`.

## ⚙️ Comandos úteis

```bash
# Testes
yarn test:all              # todos os testes
yarn test:unit:affected    # unit nos projetos afetados
yarn test:e2e:affected     # e2e nos projetos afetados

# Qualidade
yarn lint:all
yarn lint:fix:all

# Build
nx build <project-name>
nx affected -t build
```

## 🛠️ Stack

**Core:** NestJS · Nx · TypeScript · Node 20+
**Dados:** TypeORM · PostgreSQL · DynamoDB · Redis
**APIs:** REST · GraphQL · Event-driven
**Qualidade:** Jest · Supertest · ESLint · Prettier
**Segurança:** bcrypt · JWT · class-validator
**DevOps:** Docker · GitHub Actions

## 📂 Estrutura

```
fakeflix/
├── 📁 app/                      # Aplicações (bootstraps apenas)
│   ├── billing-api/             # API de faturamento independente
│   └── monolith/                # API monolítica (orquestra módulos)
│
├── 📁 package/                  # Módulos de domínio (business logic)
│   ├── billing/                 # 💳 Domínio de faturamento
│   │   ├── core/               # Lógica de negócio
│   │   ├── http/               # Controllers & DTOs
│   │   └── persistence/        # Entidades TypeORM
│   │
│   ├── content/                 # 📺 Domínio de conteúdo
│   │   ├── video-processor/    # Processamento de vídeos
│   │   ├── catalog/            # Catálogo de conteúdo
│   │   └── recommendation/     # Sistema de recomendações
│   │
│   ├── identity/                # 👤 Domínio de identidade
│   │   ├── user/               # Gestão de usuários
│   │   └── auth/               # Autenticação e autorização
│   │
│   └── shared/                  # 🔧 Módulos compartilhados
│       ├── config/             # Configurações
│       ├── logger/             # Logging Winston
│       ├── event-bus/          # Event-driven communication
│       └── database/           # Database utilities
│
├── 📁 test/                     # Setup e helpers de testes
├── 📁 docs/                     # Documentação técnica detalhada
├── 📁 .github/                  # CI/CD workflows
├── docker-compose.yml           # Infraestrutura local
├── nx.json                      # Configuração do Nx
└── package.json                 # Dependências e scripts
```

**Filosofia:** *Apps = Bootstraps, Packages = Business Logic*. Apps só orquestram; toda a lógica vive nos packages, que são independentes, composáveis e substituíveis.

## 📚 Documentação técnica

- [ARCHITECTURE-OVERVIEW.md](./docs/ARCHITECTURE-OVERVIEW.md) — visão geral da arquitetura
- [MODULAR-PRINCIPLES.md](./docs/MODULAR-PRINCIPLES.md) — 10 princípios de arquitetura modular
- [CODING-PATTERNS.md](./docs/CODING-PATTERNS.md) — padrões de código e boas práticas
- [STATE-ISOLATION.md](./docs/STATE-ISOLATION.md) — isolamento de estado e gestão de DB
- [RESILIENCE-OBSERVABILITY.md](./docs/RESILIENCE-OBSERVABILITY.md) — resiliência, logging e observabilidade
- [THIRD-PARTY-INTEGRATION.md](./docs/THIRD-PARTY-INTEGRATION.md) — integração com APIs externas

## 🙏 Créditos

Conteúdo baseado no curso *Construindo Aplicações Enterprise* da [Tech Leads Club](https://github.com/tech-leads-club). Este fork é mantido para fins de estudo pessoal.
