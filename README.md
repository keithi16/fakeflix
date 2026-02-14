<div align="center">

# 🎬 Fakeflix - Laboratório de Arquitetura Enterprise

[![CI](https://github.com/tech-leads-club/fakeflix/actions/workflows/main.yml/badge.svg)](https://github.com/tech-leads-club/fakeflix/actions/workflows/main.yml)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.0.0-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/nestjs-%5E10.0.0-ea2845.svg)](https://nestjs.com/)

**Repositório oficial de experimentação e referência do curso "Construindo Aplicações Enterprise"**

[📚 Material do Curso](https://github.com/tech-leads-club/enterprise-apps-classes) • [🐛 Reportar Bug](https://github.com/tech-leads-club/fakeflix/issues) • [💡 Sugerir Feature](https://github.com/tech-leads-club/fakeflix/issues)

</div>

---

## 📖 Sobre o Projeto

O **Fakeflix** é um projeto de laboratório desenvolvido pela comunidade **Tech Leads Club** para demonstrar e experimentar princípios de arquitetura enterprise em aplicações Node.js.

Este repositório serve como:

- 🧪 **Laboratório de experimentação** para padrões e práticas enterprise
- 📚 **Referência técnica** para o curso "Construindo Aplicações Enterprise"
- 🎯 **Porta de entrada** para novos membros da comunidade aprenderem arquitetura modular
- 🔬 **Ambiente de testes** para novas ideias e abordagens arquiteturais

### 🎯 Objetivos de Aprendizado

Ao explorar este projeto, você aprenderá:

- ✅ **Arquitetura Modular**: Como estruturar aplicações enterprise em módulos independentes
- ✅ **Monorepo com Nx**: Gerenciamento eficiente de múltiplos pacotes e aplicações
- ✅ **Domain-Driven Design**: Separação clara de domínios e responsabilidades
- ✅ **Microservices Patterns**: Comunicação entre módulos, event-driven architecture
- ✅ **Testing Strategies**: Testes unitários, integração e e2e em aplicações modulares
- ✅ **DevOps & CI/CD**: Pipelines automatizados para monorepos

### 🚨 Importante

> **Este é um repositório ativo de experimentação!** O código muda constantemente conforme testamos novas ideias e patterns para o curso. Ele sempre reflete o **estado mais atual** dos nossos experimentos.
>
> Para um guia passo a passo estruturado, consulte o repositório [enterprise-apps-classes](https://github.com/tech-leads-club/enterprise-apps-classes)

### 🏗️ Visão da Arquitetura

O **Fakeflix** simula um serviço de streaming (similar a Netflix) e implementa:

- 📺 **Content Management**: Gestão de catálogo de vídeos, séries e filmes
- 👤 **Identity & Access**: Autenticação, autorização e gestão de usuários
- 💳 **Billing**: Assinaturas, pagamentos e planos
- 🎨 **Modular Architecture**: Cada domínio é independente e pode ser extraído como microserviço

---

## 🚀 Quick Start

### Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** >= 20.0.0
- **Yarn** >= 1.22.0
- **Docker** e **Docker Compose**
- **Git**

### Configuração Inicial

```bash
# 1. Clone o repositório
git clone https://github.com/tech-leads-club/fakeflix.git
cd fakeflix

# 2. Instale as dependências
yarn install --frozen-lockfile

# 3. Suba os serviços de infraestrutura (PostgreSQL, DynamoDB, etc)
yarn docker:up

# 4. Execute as migrações do banco de dados
yarn db:migrate:all

# 5. Inicie a aplicação monolítica
nx serve monolith
```

Acesse http://localhost:3000 e você verá a aplicação rodando! 🎉

### Primeiros Passos

1. **Explore a arquitetura**: Leia o [ARCHITECTURE-OVERVIEW.md](./docs/ARCHITECTURE-OVERVIEW.md)
2. **Entenda os patterns**: Consulte o [CODING-PATTERNS.md](./docs/CODING-PATTERNS.md)
3. **Veja os módulos**: Navegue pelos packages em `package/` (billing, content, identity)
4. **Execute os testes**: `yarn test:all`

---

## 📂 Estrutura do Projeto

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

### Princípios Arquiteturais

Este projeto segue a filosofia **"Apps = Bootstraps, Packages = Business Logic"**:

- **Apps**: Apenas orquestração e inicialização (thin layer)
- **Packages**: Toda a lógica de negócio (fat modules)
- **Modules**: Independentes, composáveis e substituíveis

📖 Leia mais em [MODULAR-PRINCIPLES.md](./docs/MODULAR-PRINCIPLES.md)

---

## ⚙️ Comandos Disponíveis

### 🗄️ Banco de Dados

```bash
# Executar migrações em todos os módulos
yarn db:migrate:all

# Gerar nova migration para um módulo específico
nx db:generate <package-name>

# Gerar migrations para todos os módulos
yarn db:generate:all

# Resetar banco de dados (cuidado em desenvolvimento!)
yarn db:drop:all
```

### 🐳 Docker

```bash
# Subir todos os serviços (PostgreSQL, DynamoDB, etc)
yarn docker:up

# Parar serviços
yarn docker:stop
```

### 🧪 Testes

```bash
# Executar todos os testes (unit + e2e)
yarn test:all

# Apenas testes unitários
yarn test:unit:all

# Apenas testes e2e
yarn test:e2e:all

# Testes afetados por mudanças (otimizado!)
yarn test:affected

# Testes unitários afetados
yarn test:unit:affected

# Testes e2e afetados
yarn test:e2e:affected
```

### 🔍 Qualidade de Código

```bash
# Verificar lint em todos os módulos
yarn lint:all

# Corrigir problemas de lint automaticamente
yarn lint:fix:all
```

### 🏗️ Build

```bash
# Build de um projeto específico
nx build <project-name>

# Build de projetos afetados por mudanças
nx affected -t build
```

### 🚀 Desenvolvimento

```bash
# Iniciar API monolítica (modo desenvolvimento)
nx serve monolith

# Iniciar API de billing
nx serve billing-api

# Executar um comando em todos os projetos
nx run-many --target=<comando> --all
```

---

## 🛠️ Stack Tecnológica

### Core Framework

| Tecnologia                                    | Versão   | Uso                 |
| --------------------------------------------- | -------- | ------------------- |
| [NestJS](https://nestjs.com/)                 | ^10.0.0  | Framework backend   |
| [Nx](https://nx.dev/)                         | ^19.0.0  | Monorepo tooling    |
| [TypeScript](https://www.typescriptlang.org/) | ^5.0.0   | Linguagem principal |
| [Node.js](https://nodejs.org/)                | >=20.0.0 | Runtime             |

### Banco de Dados & ORM

| Tecnologia                                   | Uso                            |
| -------------------------------------------- | ------------------------------ |
| [TypeORM](https://typeorm.io/)               | ORM para PostgreSQL            |
| [PostgreSQL](https://www.postgresql.org/)    | Banco de dados relacional      |
| [DynamoDB](https://aws.amazon.com/dynamodb/) | NoSQL para metadados de vídeos |

### APIs & Comunicação

| Tecnologia                      | Uso                                  |
| ------------------------------- | ------------------------------------ |
| [GraphQL](https://graphql.org/) | API alternativa em alguns módulos    |
| [REST](https://restfulapi.net/) | API principal                        |
| Event-Driven                    | Comunicação assíncrona entre módulos |

### Observabilidade & Qualidade

| Tecnologia                                            | Uso                 |
| ----------------------------------------------------- | ------------------- |
| [Winston](https://github.com/winstonjs/winston)       | Logging estruturado |
| [Jest](https://jestjs.io/)                            | Framework de testes |
| [Supertest](https://github.com/visionmedia/supertest) | Testes E2E          |
| [ESLint](https://eslint.org/)                         | Linting             |
| [Prettier](https://prettier.io/)                      | Code formatting     |

### Segurança

| Tecnologia                                                      | Uso                   |
| --------------------------------------------------------------- | --------------------- |
| [bcrypt](https://www.npmjs.com/package/bcrypt)                  | Hashing de senhas     |
| [jsonwebtoken](https://jwt.io/)                                 | JWT para autenticação |
| [class-validator](https://github.com/typestack/class-validator) | Validação de DTOs     |

### DevOps

| Tecnologia                                            | Uso                |
| ----------------------------------------------------- | ------------------ |
| [Docker](https://www.docker.com/)                     | Containerização    |
| [GitHub Actions](https://github.com/features/actions) | CI/CD              |
| [Docker Compose](https://docs.docker.com/compose/)    | Orquestração local |

---

## 📚 Documentação Técnica

### Guias Arquiteturais

- **[ARCHITECTURE-OVERVIEW.md](./docs/ARCHITECTURE-OVERVIEW.md)** - Visão geral da arquitetura e navegação
- **[MODULAR-PRINCIPLES.md](./docs/MODULAR-PRINCIPLES.md)** - 10 princípios de arquitetura modular
- **[CODING-PATTERNS.md](./docs/CODING-PATTERNS.md)** - Padrões de código e boas práticas
- **[STATE-ISOLATION.md](./docs/STATE-ISOLATION.md)** - Isolamento de estado e gestão de banco de dados
- **[RESILIENCE-OBSERVABILITY.md](./docs/RESILIENCE-OBSERVABILITY.md)** - Resiliência, logging e observabilidade
- **[THIRD-PARTY-INTEGRATION.md](./docs/THIRD-PARTY-INTEGRATION.md)** - Integração com APIs externas

### Guias Práticos

- **[IMPLEMENTATION-CHECKLIST.md](./docs/IMPLEMENTATION-CHECKLIST.md)** - Checklist de implementação e verificação

### README dos Módulos

Cada módulo possui sua própria documentação:

- [📦 package/billing/README.md](./package/billing/README.md)
- [📦 package/content/README.md](./package/content/README.md)
- [📦 package/identity/README.md](./package/identity/README.md)

---

## 🤝 Como Contribuir

Todos os membros da **Tech Leads Club** são bem-vindos a contribuir com ideias, experimentos e melhorias para o projeto!

### 🌟 Formas de Contribuir

- 🐛 **Reportar bugs** ou problemas encontrados
- 💡 **Sugerir features** ou melhorias arquiteturais
- 📝 **Melhorar documentação** ou exemplos
- 🔬 **Propor experimentos** de novos patterns
- ✅ **Revisar Pull Requests** de outros membros
- 🎓 **Compartilhar aprendizados** na comunidade

### 📋 Processo de Contribuição

1. **Fork** o repositório
2. **Crie uma branch** para sua feature/fix:

   ```bash
   git checkout -b feature/minha-feature
   # ou
   git checkout -b fix/correcao-bug
   ```

3. **Implemente suas mudanças** seguindo os padrões do projeto:

   - Leia [CODING-PATTERNS.md](./docs/CODING-PATTERNS.md)
   - Execute `yarn lint:fix:all` antes de commitar
   - Adicione testes para novas funcionalidades
   - Atualize documentação se necessário

4. **Execute os testes**:

   ```bash
   yarn test:all
   yarn lint:all
   yarn test:type
   ```

5. **Commit suas mudanças** com mensagens claras:

   ```bash
   git commit -m "feat: adiciona sistema de cache para recomendações"
   # ou
   git commit -m "fix: corrige vazamento de memória no video-processor"
   ```

6. **Push para sua branch**:

   ```bash
   git push origin feature/minha-feature
   ```

7. **Abra um Pull Request** com:
   - Descrição clara do que foi implementado
   - Contexto e motivação da mudança
   - Screenshots/exemplos se aplicável
   - Checklist de verificação

### ✅ Checklist de PR

Antes de abrir o Pull Request, verifique:

- [ ] Código segue os padrões do projeto (lint passing)
- [ ] Testes adicionados/atualizados (coverage mantido)
- [ ] Documentação atualizada se necessário
- [ ] Build está passando (`yarn build:all`)
- [ ] Commits seguem padrão semântico
- [ ] Branch está atualizada com `main`

### 🎯 Áreas de Experimentação

Estamos sempre explorando novos patterns e abordagens. Áreas atuais de interesse:

- **Event-Driven Architecture**: Melhorias no event-bus
- **Observability**: Tracing distribuído, métricas customizadas
- **Performance**: Otimizações, caching strategies
- **Testing**: Contract testing, mutation testing
- **DevOps**: Melhorias no CI/CD pipeline

### 💬 Dúvidas?

- Abra uma [Issue](https://github.com/tech-leads-club/fakeflix/issues) para discussões
- Entre no canal da comunidade Tech Leads Club
- Revise PRs existentes para entender o processo

---

## 🎓 Recursos de Aprendizado

### Documentação do Projeto

1. Comece pelo [ARCHITECTURE-OVERVIEW.md](./docs/ARCHITECTURE-OVERVIEW.md)
2. Entenda os princípios em [MODULAR-PRINCIPLES.md](./docs/MODULAR-PRINCIPLES.md)
3. Aprenda os patterns em [CODING-PATTERNS.md](./docs/CODING-PATTERNS.md)

### Material Relacionado

- 📚 [Enterprise Apps Classes](https://github.com/tech-leads-club/enterprise-apps-classes) - Material estruturado do curso
- 🎥 **Vídeos do curso** - Disponível para membros da comunidade
- 📖 **Blog posts** - Artigos sobre os patterns implementados

### Conceitos-Chave para Estudar

- **Domain-Driven Design (DDD)**
- **Clean Architecture**
- **Modular Monoliths**
- **Event-Driven Architecture**
- **Microservices Patterns**
- **Testing Strategies**

### Ferramentas Recomendadas

- [Nx Console](https://marketplace.visualstudio.com/items?itemName=nrwl.angular-console) - VS Code extension
- [NestJS Devtools](https://docs.nestjs.com/devtools/overview)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

---

## 🏗️ Roadmap e Experimentos

### ✅ Implementado

- [x] Arquitetura modular base (billing, content, identity)
- [x] Event-driven communication entre módulos
- [x] Testes E2E e unitários
- [x] CI/CD com GitHub Actions
- [x] TypeORM migrations automatizadas
- [x] Logging estruturado com Winston
- [x] Docker Compose para ambiente local

### 🔬 Em Experimentação

- [ ] Distributed tracing com OpenTelemetry
- [ ] Cache distribuído com Redis
- [ ] Message queue com RabbitMQ/SQS
- [ ] API Gateway pattern
- [ ] CQRS para módulos específicos
- [ ] GraphQL Federation

### 💭 Ideias Futuras

- [ ] Contract testing entre módulos
- [ ] Chaos engineering experiments
- [ ] Performance benchmarks automatizados
- [ ] Feature flags system
- [ ] Multi-tenancy implementation

> **Nota**: Este roadmap reflete experimentos em andamento. Prioridades podem mudar conforme aprendemos e testamos novas abordagens.

---

## 📞 Suporte e Comunidade

### 🐛 Encontrou um Bug?

1. Verifique se já existe uma [Issue](https://github.com/tech-leads-club/fakeflix/issues) aberta
2. Se não, crie uma nova Issue com:
   - Descrição clara do problema
   - Passos para reproduzir
   - Comportamento esperado vs atual
   - Versões (Node, Yarn, SO)
   - Logs relevantes

### 💡 Tem uma Sugestão?

Abra uma [Issue](https://github.com/tech-leads-club/fakeflix/issues) com:

- Tag `[FEATURE]` no título
- Descrição da feature proposta
- Motivação e casos de uso
- Possível implementação (opcional)

### 👥 Tech Leads Club

Este projeto é mantido pela comunidade **Tech Leads Club**.

- 🌐 **Website**: [em breve]
- 💬 **Discord**: [link da comunidade]
- 📧 **Email**: [contato]

---

## 📄 Licença

Este código é **proprietário** da Tech Leads Club e destinado exclusivamente para fins educacionais dentro da comunidade.

**⚠️ Importante**: Não compartilhe este código externamente sem autorização.

---

## 🙏 Agradecimentos

Agradecemos a todos os membros da comunidade Tech Leads Club que contribuem com ideias, código e feedback para este projeto!

### Contribuidores

<!-- Será atualizado automaticamente -->

---

<div align="center">

**Feito com ❤️ pela comunidade Tech Leads Club**

⭐ Se este projeto te ajudou a aprender, deixe uma estrela!

[📚 Documentação](./docs) • [🐛 Issues](https://github.com/tech-leads-club/fakeflix/issues) • [🤝 Contribuir](#-como-contribuir)

</div>
