# Módulo Identity

Módulo responsável por gerenciar usuários, autenticação e autorização do sistema.

## Estrutura Package by Domain

O identity segue o padrão **Package by Domain**, onde cada sub-domínio possui sua estrutura completa:

```text
identity/
├── authentication/              # Sub-domínio: Autenticação
│   ├── core/
│   │   ├── service/            # AuthService
│   │   └── exception/          # UserUnauthorizedException
│   └── http/
│       └── graphql/
│           ├── resolver/       # AuthResolver
│           └── type/           # GraphQL types
├── user/                       # Sub-domínio: Gestão de Usuários (OWNER de User.entity)
│   ├── core/
│   │   ├── service/            # UserManagementService
│   │   └── interface/          # CreateUserDto
│   ├── persistence/            # User.entity vive AQUI
│   │   ├── entity/
│   │   └── repository/
│   └── http/
│       └── graphql/
│           ├── resolver/       # UserResolver
│           └── type/           # GraphQL types
└── shared/
    └── persistence/            # Infraestrutura compartilhada
        ├── identity-persistence.module.ts
        ├── migration/
        └── typeorm-datasource.*
```

## Sub-Domínios

### Authentication

Responsável por autenticação de usuários e geração de tokens JWT.

**Características:**

- Usa JWT com algoritmo HS256
- Valida credenciais do usuário
- Verifica status de assinatura (integração com Billing)
- **Dependência**: Importa `UserRepository` de `user/persistence/`

### User

Responsável pela gestão do ciclo de vida de usuários.

**Características:**

- CRUD de usuários
- Hash de senhas com bcrypt
- Owner da entidade `User`
- Expõe `UserRepository` para outros domínios

## Single Module Pattern

Identity usa o **Single Module Pattern** devido à alta coesão transacional entre authentication e user management:

- Um único `IdentityModule` orquestra ambos sub-domínios
- Providers organizados por domínio (comentários)
- Persistência compartilhada via `IdentityPersistenceModule`
- Dependências explícitas (authentication → user)

## Referências

- [FEATURE-FOLDERS.md](../../docs/FEATURE-FOLDERS.md) - Guia completo de Feature Folders (Vertical Slices)
- [ARCHITECTURE-GUIDELINES.md](../../docs/ARCHITECTURE-GUIDELINES.md) - Princípios de arquitetura modular
