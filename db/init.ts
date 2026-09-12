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

   if (version === 3) {
    await db.execAsync(`
      INSERT INTO settings (app_lock) VALUES (true);
      PRAGMA user_version = 4;
      `)
    version = 4;
  }

  if (version === 4) {
    // Migration: absolute Pfade (durch UUID-Wechsel bei Neuinstallation kaputt)
    // durch reine Dateinamen ersetzen, die zur Laufzeit neu zusammengesetzt werden.
    const persons = await db.getAllAsync<{ id: number; main_img: string | null }>(
      "SELECT id, main_img FROM persons"
    );
    for (const p of persons) {
      if (p.main_img && p.main_img.includes("/")) {
        const filename = p.main_img.split("/").pop();
        await db.runAsync("UPDATE persons SET main_img = ? WHERE id = ?", [filename ?? "", p.id]);
      }
    }

    const photos = await db.getAllAsync<{ id: number; file_path: string | null }>(
      "SELECT id, file_path FROM photos"
    );
    for (const ph of photos) {
      if (ph.file_path && ph.file_path.includes("/")) {
        const filename = ph.file_path.split("/").pop();
        await db.runAsync("UPDATE photos SET file_path = ? WHERE id = ?", [filename ?? "", ph.id]);
      }
    }

    await db.execAsync("PRAGMA user_version = 5;");
    version = 5;
  }

  if (version === 5) {
    
    await db.execAsync(`
      ALTER TABLE photos ADD COLUMN position INTEGER;
      PRAGMA user_version = 6;
      `)
    version = 6;
  }

  if (version === 6) {
    
    await db.execAsync(`
      ALTER TABLE settings ADD COLUMN devMode BOOLEAN NOT NULL DEFAULT false;
      PRAGMA user_version = 7;
      `)
    version = 7;
  }


  return db;
}