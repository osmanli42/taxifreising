import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

function getDbConfig(): mysql.ConnectionOptions {
  return {
    host: process.env.DB_HOST || '',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || '',
    connectTimeout: 10000,
    ssl: { rejectUnauthorized: false },
  };
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const conn = await mysql.createConnection(getDbConfig());
  try {
    const [rows] = await conn.execute(sql, params);
    return rows as T[];
  } finally {
    await conn.end().catch(() => {});
  }
}

export async function run(sql: string, params: any[] = []): Promise<mysql.ResultSetHeader> {
  const conn = await mysql.createConnection(getDbConfig());
  try {
    const [result] = await conn.execute(sql, params);
    return result as mysql.ResultSetHeader;
  } finally {
    await conn.end().catch(() => {});
  }
}

export async function initializeDatabase(): Promise<void> {
  const conn = await mysql.createConnection(getDbConfig());
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS tf_inquiries (
        id              INT NOT NULL AUTO_INCREMENT,
        token           VARCHAR(36) UNIQUE NOT NULL,
        confirm_token   VARCHAR(36) UNIQUE NOT NULL,
        status          ENUM('new','quoted','confirmed') NOT NULL DEFAULT 'new',
        anrede          VARCHAR(20),
        vorname         VARCHAR(100),
        nachname        VARCHAR(100),
        email           VARCHAR(255),
        phone           VARCHAR(50),
        abholort        TEXT,
        zielort         TEXT,
        flugnummer      VARCHAR(50),
        abholdatum      VARCHAR(50),
        abholzeit       VARCHAR(10),
        fahrgaeste      INT,
        fahrzeug        VARCHAR(50),
        gepaeck         INT,
        anmerkungen     TEXT,
        kindersitz_baby INT DEFAULT 0,
        kindersitz_kinder INT DEFAULT 0,
        kindersitz_sitz INT DEFAULT 0,
        quoted_price    DECIMAL(10,2),
        admin_note      TEXT,
        created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        quoted_at       DATETIME,
        confirmed_at    DATETIME,
        PRIMARY KEY (id)
      )
    `);
    try {
      await conn.execute(`ALTER TABLE tf_inquiries ADD COLUMN kindersitz_baby INT DEFAULT 0`);
    } catch (e: any) {
      if (e.code !== 'ER_DUP_FIELDNAME') throw e;
    }
    try {
      await conn.execute(`ALTER TABLE tf_inquiries ADD COLUMN kindersitz_kinder INT DEFAULT 0`);
    } catch (e: any) {
      if (e.code !== 'ER_DUP_FIELDNAME') throw e;
    }
    try {
      await conn.execute(`ALTER TABLE tf_inquiries ADD COLUMN kindersitz_sitz INT DEFAULT 0`);
    } catch (e: any) {
      if (e.code !== 'ER_DUP_FIELDNAME') throw e;
    }
    console.log('Database initialized successfully.');
  } finally {
    await conn.end().catch(() => {});
  }
}
