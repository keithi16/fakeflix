# Construindo Aplicações Enterprise - Repositório Base (Lab)
[![CI](https://github.com/tech-leads-club/fakeflix/actions/workflows/main.yml/badge.svg)](https://github.com/tech-leads-club/fakeflix/actions/workflows/main.yml)
Esse é o repositório base do curso Consturindo Aplicações Enterprise, ele é usado para experimentos e referência do código que sera utilizado no curso.

📦 Este repositório contém a arquitetura modular do **Fakeflix**, um serviço de streaming fictício, desenvolvido com **NestJS** e gerenciado através do **Nx Monorepo**. O projeto adota uma abordagem modular para garantir escalabilidade, separação de domínios e reutilização de código.

🚨 Tenha em mente que esse **código muda constantemente** conforme estamos testando coisas para serem adicionadas no curso, e ele sempre reflete o ultimo estado dos **nossos experimentos**.

📚 Para ter um passo a passo e referência para **cada parte do curso** utilize o repositório [enterprise-apps-classes](https://github.com/tech-leads-club/enterprise-apps-classes)

## Estrutura do Projeto

O projeto é baseado em um monorepo Nx, onde cada **módulo de domínio** é um pacote independente dentro da pasta `package`. A estrutura do projeto é a seguinte:

```sh
├── app/                 # Aplicações que expõem APIs
│   ├── billing-api      # API de faturamento
│   ├── monolith         # API monolítica que orquestra os módulos
├── package/             # Pacotes modulares
│   ├── billing          # Módulo de faturamento
│   ├── content          # Módulo de gestão de conteúdo
│   ├── identity         # Módulo de autenticação e usuários
│   ├── shared           # Módulos compartilhados (configuração, logs, eventos, etc.)
├── test/                # Setup e utilitários para testes
├── docker-compose.yml   # Configuração de serviços via Docker
├── nest-cli.json        # Configuração do NestJS
├── nx.json              # Configuração do Nx
└── package.json         # Configuração de dependências e scripts
```

## Instalação

1. Instale as dependências:
   ```sh
   yarn install --frozen-lockfile
   ```

## Principais Comandos

O projeto utiliza **Nx** para gerenciar as execuções de comandos em múltiplos módulos. Alguns dos principais comandos são:

### Banco de Dados

- **Executar migrações em todos os módulos:**
  ```sh
  yarn db:migrate:all
  ```
- **Resetar banco de dados:**
  ```sh
  yarn db:drop:all
  ```

### Docker

- **Subir serviços necessários:**
  ```sh
  yarn docker:up
  ```
- **Parar serviços:**
  ```sh
  yarn docker:stop
  ```

### Qualidade de Código

- **Verificar lint em todos os módulos:**
  ```sh
  yarn lint:all
  ```
- **Corrigir problemas de lint:**
  ```sh
  yarn lint:fix:all
  ```

### Testes

- **Executar todos os testes:**
  ```sh
  yarn test:all
  ```
- **Executar apenas os testes afetados por mudanças recentes:**
  ```sh
  yarn test:affected
  ```
- **Executar testes unitários:**
  ```sh
  yarn test:unit:all
  ```
- **Executar testes e2e:**
  ```sh
  yarn test:e2e:all
  ```
- **Verificar tipos do TypeScript:**
  ```sh
  yarn test:type
  ```

## Principais Tecnologias e Bibliotecas

- **NestJS**: Framework para construção de APIs em Node.js.
- **Nx**: Ferramenta para gerenciamento de monorepos.
- **GraphQL**: Utilizado para algumas partes da API.
- **TypeORM**: ORM para PostgreSQL.
- **DynamoDB**: Banco de dados NoSQL para armazenar metadados de vídeos.

### Infraestrutura e DevOps

- **Docker**: Utilizado para gerenciar os serviços necessários para o projeto.
- **Winston + nest-winston**: Logging centralizado.
- **dotenv**: Gerenciamento de variáveis de ambiente.

### Segurança

- **bcrypt**: Hashing de senhas.
- **jsonwebtoken (JWT)**: Autenticação baseada em tokens.
- **class-validator & class-transformer**: Validação de entrada de dados.

### Testes

- **Jest**: Framework de testes unitários.
- **Supertest**: Utilizado para testes e2e.
- **Nock**: Mocking de chamadas HTTP externas.

## Contribuindo

Todos membros da Tech Leads club são livres para contribuir com ideas para o projeto, basta abrir um pull request.

1. Crie uma branch para sua feature/fix (`git checkout -b minha-feature`).
2. Faça o commit das mudanças (`git commit -m 'Adiciona nova feature'`).
3. Envie para a branch principal (`git push origin minha-feature`).
4. Abra um Pull Request.

## Licença

Esse código é proprietário da Tech Leads club e não deve ser compartilhado externamente.
