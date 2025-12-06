# Módulo Content

Modulo responsável por gerenciar o conteúdo do sistema e streaming.

## 🏗️ Architecture

The module follows **Feature Folders** (Vertical Slice Architecture) organized into sub-domains:

> 📖 **Detailed Guide**: See [FEATURE-FOLDERS.md](../../docs/FEATURE-FOLDERS.md) for comprehensive documentation on Feature Folders, decision criteria, and implementation guidelines.
> 
> 📚 **Architecture Principles**: See [ARCHITECTURE-GUIDELINES.md](../../docs/ARCHITECTURE-GUIDELINES.md) for complete modular architecture principles.

```
content/
├── admin/                      # Sub-domain: Content Management
│   ├── movie/                  # Feature: Movie administration
│   ├── tv-show/                # Feature: TV Show administration
│   └── age-recommendation/     # Feature: Age rating management
├── catalog/                    # Sub-domain: Content Discovery
│   ├── player/                 # Feature: Video player
│   └── content-listing/        # Feature: Content browsing
├── video-processor/            # Sub-domain: AI Processing
│   ├── transcription/          # Feature: Video transcription
│   ├── summary/                # Feature: Content summarization
│   └── age-recommendation/     # Feature: Age rating analysis
└── shared/                     # Shared infrastructure
    └── persistence/            # Database config, entities, migrations
```

Each feature is a **vertical slice** containing:
- `core/` - Business logic (services, use-cases)
- `http/` - API layer (controllers, DTOs, external clients)
- `persistence/` - Data access (entities, repositories)
- `__test__/` - Tests (e2e, unit)

## Referências

- [FEATURE-FOLDERS.md](../../docs/FEATURE-FOLDERS.md) - Guia completo de Feature Folders (Vertical Slices)
- [ARCHITECTURE-GUIDELINES.md](../../docs/ARCHITECTURE-GUIDELINES.md) - Princípios de arquitetura modular
