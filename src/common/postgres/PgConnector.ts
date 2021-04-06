import { createConnection, Connection } from 'typeorm';
import path from 'path';
import pg from 'pg';

import { postgresConfig } from './config';

const entitiesDir = path.normalize(`${__dirname}/../../models/**/*.{js,ts}`);

// eslint-disable-next-line import/prefer-default-export
export class PgConnector {
  private pool: pg.Pool;

  private connect: Promise<Connection>;

  constructor() {
    this.pool = new pg.Pool();
  }

  getConnection(): Promise<Connection> {
    console.log(`Creating a connection. Using entities at ${entitiesDir}`);

    if (!this.connect) {
      this.connect = createConnection({
        type: 'postgres',
        host: postgresConfig.host,
        username: postgresConfig.username,
        password: postgresConfig.password,
        database: postgresConfig.dbname,
        port: postgresConfig.port,
        logging: postgresConfig.logging,
        entities: [entitiesDir],
      });

      this.connect.catch((error) => {
        console.error(`Connection Error: ${error}`);
      });
    }
    return this.connect;
  }

  query(query: string) {
    return this.pool.query(query);
  }
}
