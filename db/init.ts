import { db } from './database';

export async function initDatabase() {
  const result = (await db.getFirstAsync("PRAGMA user_version")) as { user_version: number } | null;
  let version = result?.user_version ?? 0;

  if (version === 0) {
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
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY NOT NULL,
        app_lock BOOLEAN NOT NULL
      );
    `);
    await db.execAsync("PRAGMA user_version = 1");
    version = 1;
  }

  if (version === 1) {
    await db.execAsync(`
      ALTER TABLE persons ADD COLUMN usernames TEXT;
      PRAGMA user_version = 2;
      `)
    version = 2;
  }

  if (version === 2) {
    await db.execAsync(`
      ALTER TABLE persons ADD COLUMN images TEXT;
      PRAGMA user_version = 3;
      `)
    version = 3;
  }

  return db;
}