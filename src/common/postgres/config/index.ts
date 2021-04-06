export interface PostgresConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  dbname: string;
  logging: boolean;
}

class Config implements PostgresConfig {
  host: string;

  port: number;

  username: string;

  password: string;

  dbname: string;

  logging: boolean;

  constructor() {
    this.host = process.env.POSTGRES_HOST || 'localhost';
    this.port = Number(process.env.POSTGRES_PORT || 5432);
    this.username = process.env.POSTGRES_USERNAME || 'postgres';
    this.password = process.env.POSTGRES_PASSWORD || '1';
    this.dbname = process.env.POSTGRES_DATABASE || 'attendence-management';
    this.logging = Boolean(process.env.POSTGRES_LOGGING || true);
  }
}

export const postgresConfig = new Config() as PostgresConfig;
