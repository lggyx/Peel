import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite'

const sqlite = new SQLiteConnection(CapacitorSQLite)
let dbInstance: any = null

function getPlatform(): 'web' | 'native' {
  const platform = (window as any).Capacitor?.getPlatform?.() || 'web'
  return platform === 'web' ? 'web' : 'native'
}

export async function initDB() {
  if (dbInstance) return dbInstance

  const platform = getPlatform()
  console.log(`[DB] Platform: ${platform}`)

  try {
    if (platform === 'web') {
      const jeep = document.querySelector('jeep-sqlite')
      if (!jeep) {
        console.warn('[DB] jeep-sqlite not found in DOM')
        throw new Error('jeep-sqlite element not found')
      }
      await customElements.whenDefined('jeep-sqlite')
      await new Promise(resolve => setTimeout(resolve, 100))
      await sqlite.initWebStore()
    }

    const db = await sqlite.createConnection('reelmind', false, 'no-encryption', 1, false)
    await db.open()

    await db.execute(`
      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        title TEXT,
        url TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        analysis_json TEXT,
        created_at INTEGER DEFAULT (strftime('%s','now'))
      );
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s','now'))
      );
    `)

    dbInstance = db
    console.log('[DB] SQLite initialized successfully')
    return db

  } catch (err) {
    console.error('[DB] SQLite init failed:', err)
    throw err
  }
}

export async function getDB() {
  if (!dbInstance) {
    await initDB()
  }
  return dbInstance
}