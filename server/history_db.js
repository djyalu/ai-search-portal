import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'history.db');
const db = new Database(dbPath);

// 테이블 초기화
db.exec(`
  CREATE TABLE IF NOT EXISTS search_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt TEXT NOT NULL,
    results TEXT,
    summary TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const HistoryDB = {
    save: (prompt, results, summary) => {
        const stmt = db.prepare('INSERT INTO search_history (prompt, results, summary) VALUES (?, ?, ?)');
        return stmt.run(prompt, JSON.stringify(results), summary);
    },

    getAll: () => {
        const stmt = db.prepare('SELECT * FROM search_history ORDER BY created_at DESC');
        return stmt.all().map(item => ({
            ...item,
            results: JSON.parse(item.results)
        }));
    },

    getById: (id) => {
        const stmt = db.prepare('SELECT * FROM search_history WHERE id = ?');
        const item = stmt.get(id);
        if (item) {
            item.results = JSON.parse(item.results);
        }
        return item;
    },

    delete: (id) => {
        const stmt = db.prepare('DELETE FROM search_history WHERE id = ?');
        return stmt.run(id);
    }
};

export default HistoryDB;
