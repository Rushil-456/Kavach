import { openDB } from 'idb';

const DB_NAME = 'kavach_db';
const DB_VERSION = 1;
const STORE_SESSIONS = 'sessions';
const STORE_LOGS = 'logs';

export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        db.createObjectStore(STORE_SESSIONS, { keyPath: 'sessionId' });
      }
      if (!db.objectStoreNames.contains(STORE_LOGS)) {
        const logStore = db.createObjectStore(STORE_LOGS, { keyPath: 'id', autoIncrement: true });
        logStore.createIndex('sessionId', 'sessionId');
      }
    },
  });
}

export async function createSession() {
  const db = await initDB();
  const sessionId = Date.now().toString();
  await db.put(STORE_SESSIONS, {
    sessionId,
    startTime: new Date().toISOString(),
    isThreat: false,
    threatLevel: 'LOW'
  });
  return sessionId;
}

export async function logEvent(sessionId, location, devices) {
  const db = await initDB();
  await db.add(STORE_LOGS, {
    sessionId,
    timestamp: new Date().toISOString(),
    location, 
    devices   
  });
}

export async function markSessionAsThreat(sessionId, level) {
  const db = await initDB();
  const session = await db.get(STORE_SESSIONS, sessionId);
  if (session) {
    session.isThreat = true;
    session.threatLevel = level;
    await db.put(STORE_SESSIONS, session);
  }
}

export async function getSessionLogs(sessionId) {
  const db = await initDB();
  return db.getAllFromIndex(STORE_LOGS, 'sessionId', sessionId);
}

export async function getAllSessions() {
  const db = await initDB();
  const sessions = await db.getAll(STORE_SESSIONS);
  return sessions.sort((a,b) => b.sessionId.localeCompare(a.sessionId));
}
