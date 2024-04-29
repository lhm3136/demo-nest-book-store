import { config as dotenvConfig } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { existsSync } from 'fs';

if (existsSync('.env')) {
  console.log('Loading environment variables from .env file');
  // If it's not, load the environment variables from the .env file
  dotenvConfig();
}

console.log(process.env.DATABASE_HOST);

const config = {
  type: 'mysql',
  host: `${process.env.DATABASE_HOST}`,
  port: `${process.env.DATABASE_PORT}`,
  username: `${process.env.DATABASE_USERNAME}`,
  password: `${process.env.DATABASE_PASSWORD}`,
  database: `${process.env.DATABASE_NAME}`,
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/*{.ts,.js}'],
  autoLoadEntities: true,
  synchronize: false,
};

export const connectionSource = new DataSource(config as DataSourceOptions);
