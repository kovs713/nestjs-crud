import { DatabaseConfig } from '@/providers/database/database.config';
import { AppConfig } from './app.config';

export type AllConfigType = {
  app: AppConfig;
  db: DatabaseConfig;
};
