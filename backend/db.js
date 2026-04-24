const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const configuredDbPath = process.env.SQLITE_DB_PATH;
const defaultDbPath = path.join(__dirname, 'data', 'student_management.db');
const dbPath = configuredDbPath ? path.resolve(configuredDbPath) : defaultDbPath;
const dataDir = path.dirname(dbPath);

let db = null;

const ensureDataDir = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

const openDatabase = () => {
  ensureDataDir();
  if (db) return db;

  db = new sqlite3.Database(dbPath);
  return db;
};

const getDb = () => {
  if (!db) {
    return openDatabase();
  }
  return db;
};

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    getDb().run(sql, params, function onRun(err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    getDb().get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    getDb().all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });

const closeDatabase = () =>
  new Promise((resolve, reject) => {
    if (!db) {
      resolve();
      return;
    }

    db.close((err) => {
      if (err) return reject(err);
      db = null;
      resolve();
    });
  });

const applyPragmas = async () => {
  // WAL and durable sync settings reduce corruption risk on unexpected exits.
  await run('PRAGMA journal_mode = WAL');
  await run('PRAGMA synchronous = FULL');
  await run('PRAGMA foreign_keys = ON');
  await run('PRAGMA busy_timeout = 5000');
  await run('PRAGMA temp_store = MEMORY');
};

const checkpoint = async () => {
  await run('PRAGMA wal_checkpoint(TRUNCATE)');
};

const quickCheck = async () => {
  const result = await get('PRAGMA quick_check');
  return result ? Object.values(result)[0] : 'unknown';
};

const integrityCheck = async () => {
  const result = await get('PRAGMA integrity_check');
  return result ? Object.values(result)[0] : 'unknown';
};

const ensureAdminRecoveryColumns = async () => {
  const columns = await all('PRAGMA table_info(admins)');
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has('recovery_question')) {
    await run("ALTER TABLE admins ADD COLUMN recovery_question TEXT NOT NULL DEFAULT ''");
  }

  if (!columnNames.has('recovery_answer_hash')) {
    await run("ALTER TABLE admins ADD COLUMN recovery_answer_hash TEXT NOT NULL DEFAULT ''");
  }
};

const ensureStudentColumns = async () => {
  const columns = await all('PRAGMA table_info(students)');
  const columnNames = new Set(columns.map((column) => column.name));

  const requiredColumns = [
    ['dob', "TEXT NOT NULL DEFAULT ''"],
    ['id_no', "TEXT NOT NULL DEFAULT ''"],
    ['aadhar_no', "TEXT NOT NULL DEFAULT ''"],
    ['blood_group', "TEXT NOT NULL DEFAULT ''"],
    ['mother_tongue', "TEXT NOT NULL DEFAULT ''"],
    ['sub_caste', "TEXT NOT NULL DEFAULT ''"],
    ['category', "TEXT NOT NULL DEFAULT ''"],
    ['height', 'REAL NOT NULL DEFAULT 0'],
    ['weight', 'REAL NOT NULL DEFAULT 0'],
  ];

  for (const [columnName, columnDefinition] of requiredColumns) {
    if (!columnNames.has(columnName)) {
      await run(`ALTER TABLE students ADD COLUMN ${columnName} ${columnDefinition}`);
    }
  }
};

const initDatabase = async () => {
  openDatabase();
  await applyPragmas();

  await run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await ensureAdminRecoveryColumns();

  await run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      gr_no TEXT NOT NULL UNIQUE,
      pan_no TEXT NOT NULL UNIQUE,
      phone_number TEXT NOT NULL,
      caste TEXT NOT NULL DEFAULT '',
      religion TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      father_name TEXT NOT NULL DEFAULT '',
      father_contact TEXT NOT NULL DEFAULT '',
      mother_name TEXT NOT NULL DEFAULT '',
      mother_contact TEXT NOT NULL DEFAULT '',
      fees_history TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await ensureStudentColumns();
};

module.exports = {
  dbPath,
  getDb,
  closeDatabase,
  checkpoint,
  quickCheck,
  integrityCheck,
  run,
  get,
  all,
  initDatabase,
};