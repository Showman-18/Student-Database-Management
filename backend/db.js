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

const getStudentTableColumns = async () => {
  const columns = await all('PRAGMA table_info(students)');
  return columns;
};

const rebuildStudentsTable = async () => {
  const oldColumns = await getStudentTableColumns();
  const oldColumnNames = new Set(oldColumns.map((column) => column.name));

  await run('ALTER TABLE students RENAME TO students_old');

  await run(`
    CREATE TABLE students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      gr_no TEXT NOT NULL UNIQUE,
      pan_no TEXT UNIQUE,
      phone_number TEXT NOT NULL,
      caste TEXT NOT NULL DEFAULT '',
      religion TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      id_no TEXT NOT NULL DEFAULT '',
      aadhar_no TEXT NOT NULL DEFAULT '',
      blood_group TEXT NOT NULL DEFAULT '',
      mother_tongue TEXT NOT NULL DEFAULT '',
      sub_caste TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      height REAL,
      weight REAL,
      father_name TEXT NOT NULL DEFAULT '',
      father_contact TEXT NOT NULL DEFAULT '',
      mother_name TEXT NOT NULL DEFAULT '',
      mother_contact TEXT NOT NULL DEFAULT '',
      fees_history TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const selectColumn = (name, fallback = 'NULL') => (oldColumnNames.has(name) ? name : fallback);

  await run(`
    INSERT INTO students (
      id, full_name, gr_no, pan_no, phone_number, caste, religion, address,
      id_no, aadhar_no, blood_group, mother_tongue, sub_caste, category, height, weight,
      father_name, father_contact, mother_name, mother_contact, fees_history,
      created_at, updated_at
    )
    SELECT
      ${selectColumn('id')},
      ${selectColumn('full_name')},
      ${selectColumn('gr_no')},
      ${selectColumn('pan_no', 'NULL')},
      ${selectColumn('phone_number')},
      ${selectColumn('caste', "''")},
      ${selectColumn('religion', "''")},
      ${selectColumn('address', "''")},
      ${selectColumn('id_no', "''")},
      ${selectColumn('aadhar_no', "''")},
      ${selectColumn('blood_group', "''")},
      ${selectColumn('mother_tongue', "''")},
      ${selectColumn('sub_caste', "''")},
      ${selectColumn('category', "''")},
      ${selectColumn('height', 'NULL')},
      ${selectColumn('weight', 'NULL')},
      ${selectColumn('father_name', "''")},
      ${selectColumn('father_contact', "''")},
      ${selectColumn('mother_name', "''")},
      ${selectColumn('mother_contact', "''")},
      ${selectColumn('fees_history', "'[]'")},
      ${selectColumn('created_at', 'CURRENT_TIMESTAMP')},
      ${selectColumn('updated_at', 'CURRENT_TIMESTAMP')}
    FROM students_old
  `);

  await run('DROP TABLE students_old');
};

const ensureStudentSchema = async () => {
  const columns = await getStudentTableColumns();
  const columnMap = new Map(columns.map((column) => [column.name, column]));

  const shouldRebuild =
    !columnMap.has('pan_no') ||
    columnMap.get('pan_no')?.notnull === 1 ||
    columnMap.get('height')?.notnull === 1 ||
    columnMap.get('weight')?.notnull === 1;

  if (shouldRebuild) {
    await rebuildStudentsTable();
    return;
  }

  const requiredColumns = [
    ['dob', "TEXT NOT NULL DEFAULT ''"],
    ['id_no', "TEXT NOT NULL DEFAULT ''"],
    ['aadhar_no', "TEXT NOT NULL DEFAULT ''"],
    ['blood_group', "TEXT NOT NULL DEFAULT ''"],
    ['mother_tongue', "TEXT NOT NULL DEFAULT ''"],
    ['sub_caste', "TEXT NOT NULL DEFAULT ''"],
    ['category', "TEXT NOT NULL DEFAULT ''"],
  ];

  for (const [columnName, columnDefinition] of requiredColumns) {
    if (!columnMap.has(columnName)) {
      await run(`ALTER TABLE students ADD COLUMN ${columnName} ${columnDefinition}`);
    }
  }

  if (!columnMap.has('height')) {
    await run('ALTER TABLE students ADD COLUMN height REAL');
  }

  if (!columnMap.has('weight')) {
    await run('ALTER TABLE students ADD COLUMN weight REAL');
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
      pan_no TEXT UNIQUE,
      phone_number TEXT NOT NULL,
      caste TEXT NOT NULL DEFAULT '',
      religion TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      id_no TEXT NOT NULL DEFAULT '',
      aadhar_no TEXT NOT NULL DEFAULT '',
      blood_group TEXT NOT NULL DEFAULT '',
      mother_tongue TEXT NOT NULL DEFAULT '',
      sub_caste TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      height REAL,
      weight REAL,
      father_name TEXT NOT NULL DEFAULT '',
      father_contact TEXT NOT NULL DEFAULT '',
      mother_name TEXT NOT NULL DEFAULT '',
      mother_contact TEXT NOT NULL DEFAULT '',
      fees_history TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await ensureStudentSchema();
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