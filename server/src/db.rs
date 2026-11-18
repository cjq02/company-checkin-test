use rusqlite::{params, Connection, Result};
use std::path::Path;
use std::sync::Mutex;

/// SQLite 数据库句柄（用 Mutex 包裹，供 axum 共享状态）
pub struct Db {
    pub conn: Mutex<Connection>,
}

impl Db {
    pub fn open(path: &str) -> Result<Self> {
        if let Some(parent) = Path::new(path).parent() {
            std::fs::create_dir_all(parent).ok();
        }

        let conn = Connection::open(path)?;
        conn.execute_batch(
            "
            PRAGMA journal_mode = WAL;
            PRAGMA foreign_keys = ON;

            CREATE TABLE IF NOT EXISTS users (
                username TEXT PRIMARY KEY,
                role     TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
                password TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sessions (
                token      TEXT PRIMARY KEY,
                username   TEXT NOT NULL,
                role       TEXT NOT NULL,
                created_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS checkin_point (
                id         INTEGER PRIMARY KEY CHECK (id = 1),
                name       TEXT NOT NULL,
                address    TEXT NOT NULL,
                latitude   REAL NOT NULL,
                longitude  REAL NOT NULL,
                radius     REAL NOT NULL,
                updated_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS records (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                username   TEXT NOT NULL,
                point_name TEXT NOT NULL,
                latitude   REAL NOT NULL,
                longitude  REAL NOT NULL,
                distance   REAL NOT NULL,
                created_at INTEGER NOT NULL
            );
            ",
        )?;

        // 默认账号：admin / employee，密码均为 123456
        conn.execute(
            "INSERT OR IGNORE INTO users (username, role, password) VALUES (?1, ?2, ?3)",
            params!["admin", "admin", "123456"],
        )?;
        conn.execute(
            "INSERT OR IGNORE INTO users (username, role, password) VALUES (?1, ?2, ?3)",
            params!["employee", "employee", "123456"],
        )?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }
}
