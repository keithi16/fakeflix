import AppDataSource from './migration.datasource';

export const migrate = async () => {
  const dataSource = AppDataSource;
  await dataSource.initialize();
  const pendingMigrations = await dataSource.showMigrations();
  if (pendingMigrations) {
    const appliedMigrations = await dataSource.runMigrations();
    console.log('Applied migrations:', appliedMigrations);
  }
};
