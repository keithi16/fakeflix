# Monólito

O Monólito inicia vários módulos juntos como o Content e o Identity.

## Banco de dados

O Monólito utiliza o banco de dados PostgreSQL compartilhado e um DynamoDB próprio.
Para executar as migrações do dynamodb é necessário executar o comando:

```bash
yarn streaming:db:setup
```
