// src/config/ormconfig.ts
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [],
  synchronize: true,
  ssl: {
    rejectUnauthorized: false,
    requestCert: false,
  },
  migrations: ['src/migration/**/*.ts'],
  migrationsTableName: 'migrations',
});
