import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("meineapp.db");
db.execSync("PRAGMA foreign_keys = ON;");