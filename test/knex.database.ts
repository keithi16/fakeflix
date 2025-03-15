import knex from 'knex';

export const testDbClient = knex({
  client: 'pg',
  connection: `postgresql://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`,
  searchPath: ['public'],
});
