// db/init.ts
import { db } from './database';

export async function initDatabase() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS persons (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT,
      info TEXT,
      main_img TEXT,
      created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY NOT NULL,
      person_id INTEGER NOT NULL,
      file_path TEXT,
      FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
    );
  `);
  return db;
}