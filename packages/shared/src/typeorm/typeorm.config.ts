import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function createTypeOrmConfig(
  config: ConfigService,
  entities: Function[],
): TypeOrmModuleOptions {
  const databaseUrl = config.get<string>('DATABASE_URL');
  const base: TypeOrmModuleOptions = {
    type: 'postgres',
    entities,
    synchronize: config.get('NODE_ENV') !== 'production',
    logging: config.get('NODE_ENV') === 'development',
  };
  if (databaseUrl) {
    return { ...base, url: databaseUrl };
  }
  return {
    ...base,
    host: config.get<string>('DB_HOST', 'localhost'),
    port: config.get<number>('DB_PORT', 5433),
    username: config.get<string>('DB_USERNAME', 'postgres'),
    password: config.get<string>('DB_PASSWORD', '12345'),
    database: config.get<string>('DB_DATABASE', 'fems'),
  };
}
