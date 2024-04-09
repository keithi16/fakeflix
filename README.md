![Logo](https://assets.circle.so/vwlv5vb7k62knu2ww18v0f674xv7)

# Construindo Aplicações Enterprise - Repositório Base (Lab)

Esse é o repositório base do curso Consturindo Aplicações Enterprise, ele é usado para experimentos e referência do código que sera utilizado no curso.

Tenha em mente que esse código muda constantemente conforme estamos testando coisas para serem adicionadas no curso, e ele sempre reflete o ultimo estado dos nossos experimentos.

Para ter um passo a passo e referência para cada parte do curso utilize o repositório [enterprise-apps-classes](https://github.com/tech-leads-club/enterprise-apps-classes)

## Executando o projeto

Necessário `Docker` e `docker-compose`

```bash
  yarn --frozen-lockfile //instala as dependencias na versão especifica do lockfile
  docker-compose up -d //inicia dependencias
  yarn test:db:setup //aplica migrações
  yarn test //executa os testes
```

## Contribuindo

Todos membros da Tech Leads club são livres para contribuir com ideas para o projeto, basta abrir um pull request.

## Licença

Esse código é proprietário da Tech Leads club e não deve ser compartilhado externamente.
