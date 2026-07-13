const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow
let db

function initDB() {
  const Database = require('better-sqlite3')
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'lerntracker.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#c084fc',
      emoji TEXT NOT NULL DEFAULT '📚',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      subject_id INTEGER,
      completed INTEGER DEFAULT 0,
      due_date TEXT,
      priority INTEGER DEFAULT 1,
      xp_reward INTEGER DEFAULT 10,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS flashcard_decks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subject_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS flashcards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deck_id INTEGER NOT NULL,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      ease_factor REAL DEFAULT 2.5,
      interval_days INTEGER DEFAULT 1,
      next_review TEXT DEFAULT CURRENT_DATE,
      review_count INTEGER DEFAULT 0,
      correct_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (deck_id) REFERENCES flashcard_decks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      subject_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      subject_id INTEGER,
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS pomodoro_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      duration_minutes INTEGER NOT NULL,
      subject_id INTEGER,
      date TEXT DEFAULT CURRENT_DATE,
      xp_earned INTEGER DEFAULT 25,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS user_stats (
      id INTEGER PRIMARY KEY DEFAULT 1,
      xp INTEGER DEFAULT 0,
      streak INTEGER DEFAULT 0,
      last_activity TEXT DEFAULT '',
      total_study_minutes INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      target_value INTEGER NOT NULL,
      current_value INTEGER DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'Minuten',
      period TEXT NOT NULL DEFAULT 'täglich',
      subject_id INTEGER,
      completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      achievement_id TEXT NOT NULL UNIQUE,
      unlocked_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      subject_id INTEGER,
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      subject_id INTEGER,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS exam_topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      order_index INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
    );
  `)

  const row = db.prepare('SELECT id FROM user_stats WHERE id = 1').get()
  if (!row) {
    db.prepare('INSERT INTO user_stats (id, xp, streak, last_activity, total_study_minutes) VALUES (1, 0, 0, ?, 0)').run('')
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0015',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  initDB()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// ── Window controls ──────────────────────────────────────────────────────────
ipcMain.on('window-minimize', () => mainWindow.minimize())
ipcMain.on('window-maximize', () => {
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
})
ipcMain.on('window-close', () => mainWindow.close())

// ── Helpers ───────────────────────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().split('T')[0] }

function computeNewStreak(stats) {
  const today = todayStr()
  if (stats.last_activity === today) return stats.streak
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  if (stats.last_activity === yesterday.toISOString().split('T')[0]) return stats.streak + 1
  return 1
}

// ── User Stats ───────────────────────────────────────────────────────────────
ipcMain.handle('get-stats', () => db.prepare('SELECT * FROM user_stats WHERE id = 1').get())

ipcMain.handle('add-xp', (_, amount) => {
  const stats = db.prepare('SELECT * FROM user_stats WHERE id = 1').get()
  const newStreak = computeNewStreak(stats)
  db.prepare('UPDATE user_stats SET xp = xp + ?, streak = ?, last_activity = ? WHERE id = 1')
    .run(amount, newStreak, todayStr())
  checkAchievements()
  return db.prepare('SELECT * FROM user_stats WHERE id = 1').get()
})

// ── Subjects ─────────────────────────────────────────────────────────────────
ipcMain.handle('get-subjects', () => db.prepare('SELECT * FROM subjects ORDER BY name').all())

ipcMain.handle('create-subject', (_, { name, color, emoji }) => {
  const result = db.prepare('INSERT INTO subjects (name, color, emoji) VALUES (?, ?, ?)').run(name, color, emoji)
  return db.prepare('SELECT * FROM subjects WHERE id = ?').get(result.lastInsertRowid)
})

ipcMain.handle('delete-subject', (_, id) => db.prepare('DELETE FROM subjects WHERE id = ?').run(id))

// ── Tasks ────────────────────────────────────────────────────────────────────
ipcMain.handle('get-tasks', (_, filters) => {
  let q = 'SELECT t.*, s.name as subject_name, s.color as subject_color, s.emoji as subject_emoji FROM tasks t LEFT JOIN subjects s ON t.subject_id = s.id'
  const where = []
  const params = []
  if (filters?.subject_id) { where.push('t.subject_id = ?'); params.push(filters.subject_id) }
  if (filters?.completed !== undefined) { where.push('t.completed = ?'); params.push(filters.completed ? 1 : 0) }
  if (where.length) q += ' WHERE ' + where.join(' AND ')
  q += ' ORDER BY t.completed ASC, t.priority DESC, t.created_at DESC'
  return db.prepare(q).all(...params)
})

ipcMain.handle('create-task', (_, task) => {
  const result = db.prepare(`
    INSERT INTO tasks (title, description, subject_id, due_date, priority, xp_reward)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(task.title, task.description || '', task.subject_id || null, task.due_date || null, task.priority || 1, task.xp_reward || 10)
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid)
})

ipcMain.handle('complete-task', (_, id) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
  if (!task || task.completed) return null
  db.prepare('UPDATE tasks SET completed = 1 WHERE id = ?').run(id)
  const stats = db.prepare('SELECT * FROM user_stats WHERE id = 1').get()
  db.prepare('UPDATE user_stats SET xp = xp + ?, streak = ?, last_activity = ? WHERE id = 1')
    .run(task.xp_reward, computeNewStreak(stats), todayStr())
  checkAchievements()
  return db.prepare('SELECT * FROM user_stats WHERE id = 1').get()
})

ipcMain.handle('delete-task', (_, id) => db.prepare('DELETE FROM tasks WHERE id = ?').run(id))

ipcMain.handle('update-task', (_, { id, ...fields }) => {
  const setClauses = Object.keys(fields).map(k => `${k} = ?`).join(', ')
  db.prepare(`UPDATE tasks SET ${setClauses} WHERE id = ?`).run(...Object.values(fields), id)
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
})

// ── Flashcard Decks ───────────────────────────────────────────────────────────
ipcMain.handle('get-decks', () => {
  return db.prepare(`
    SELECT d.*, s.name as subject_name, s.color as subject_color, s.emoji as subject_emoji,
           COUNT(f.id) as card_count,
           SUM(CASE WHEN f.next_review <= date('now') THEN 1 ELSE 0 END) as due_count
    FROM flashcard_decks d
    LEFT JOIN subjects s ON d.subject_id = s.id
    LEFT JOIN flashcards f ON d.id = f.deck_id
    GROUP BY d.id ORDER BY d.created_at DESC
  `).all()
})

ipcMain.handle('create-deck', (_, { name, subject_id }) => {
  const result = db.prepare('INSERT INTO flashcard_decks (name, subject_id) VALUES (?, ?)').run(name, subject_id || null)
  return db.prepare('SELECT * FROM flashcard_decks WHERE id = ?').get(result.lastInsertRowid)
})

ipcMain.handle('delete-deck', (_, id) => db.prepare('DELETE FROM flashcard_decks WHERE id = ?').run(id))

// ── Flashcards ────────────────────────────────────────────────────────────────
ipcMain.handle('get-cards', (_, deck_id) => {
  return db.prepare('SELECT * FROM flashcards WHERE deck_id = ? ORDER BY created_at DESC').all(deck_id)
})

ipcMain.handle('get-due-cards', (_, deck_id) => {
  return db.prepare("SELECT * FROM flashcards WHERE deck_id = ? AND next_review <= date('now') ORDER BY next_review ASC").all(deck_id)
})

ipcMain.handle('create-card', (_, { deck_id, front, back }) => {
  const result = db.prepare('INSERT INTO flashcards (deck_id, front, back) VALUES (?, ?, ?)').run(deck_id, front, back)
  db.prepare('UPDATE user_stats SET xp = xp + 2 WHERE id = 1').run()
  return db.prepare('SELECT * FROM flashcards WHERE id = ?').get(result.lastInsertRowid)
})

ipcMain.handle('delete-card', (_, id) => db.prepare('DELETE FROM flashcards WHERE id = ?').run(id))

ipcMain.handle('review-card', (_, { id, quality }) => {
  // SM-2 spaced repetition algorithm (quality: 0-5)
  const card = db.prepare('SELECT * FROM flashcards WHERE id = ?').get(id)
  if (!card) return null

  let ef = card.ease_factor
  let interval = card.interval_days

  if (quality >= 3) {
    if (card.review_count === 0) interval = 1
    else if (card.review_count === 1) interval = 6
    else interval = Math.round(interval * ef)
    ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if (ef < 1.3) ef = 1.3
  } else {
    interval = 1
  }

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + interval)
  const nextReviewStr = nextReview.toISOString().split('T')[0]

  db.prepare(`
    UPDATE flashcards SET ease_factor = ?, interval_days = ?, next_review = ?,
    review_count = review_count + 1, correct_count = correct_count + ?
    WHERE id = ?
  `).run(ef, interval, nextReviewStr, quality >= 3 ? 1 : 0, id)

  if (quality >= 3) db.prepare('UPDATE user_stats SET xp = xp + 1 WHERE id = 1').run()
  checkAchievements()
  return db.prepare('SELECT * FROM user_stats WHERE id = 1').get()
})

// ── Notes ─────────────────────────────────────────────────────────────────────
ipcMain.handle('get-notes', (_, subject_id) => {
  const base = 'SELECT n.*, s.name as subject_name, s.color as subject_color FROM notes n LEFT JOIN subjects s ON n.subject_id = s.id'
  return subject_id
    ? db.prepare(`${base} WHERE n.subject_id = ? ORDER BY n.updated_at DESC`).all(subject_id)
    : db.prepare(`${base} ORDER BY n.updated_at DESC`).all()
})

ipcMain.handle('create-note', (_, { title, content, subject_id }) => {
  const result = db.prepare('INSERT INTO notes (title, content, subject_id) VALUES (?, ?, ?)').run(title, content || '', subject_id || null)
  db.prepare('UPDATE user_stats SET xp = xp + 3 WHERE id = 1').run()
  return db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid)
})

ipcMain.handle('update-note', (_, { id, title, content }) => {
  db.prepare('UPDATE notes SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(title, content, id)
  return db.prepare('SELECT * FROM notes WHERE id = ?').get(id)
})

ipcMain.handle('delete-note', (_, id) => db.prepare('DELETE FROM notes WHERE id = ?').run(id))

// ── Scans ─────────────────────────────────────────────────────────────────────
ipcMain.handle('get-scans', (_, subject_id) => {
  const base = 'SELECT sc.*, s.name as subject_name FROM scans sc LEFT JOIN subjects s ON sc.subject_id = s.id'
  return subject_id
    ? db.prepare(`${base} WHERE sc.subject_id = ? ORDER BY sc.created_at DESC`).all(subject_id)
    : db.prepare(`${base} ORDER BY sc.created_at DESC`).all()
})

ipcMain.handle('upload-scan', async (_, { subject_id, description }) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Hefteintrag hochladen',
    filters: [
      { name: 'Bilder & PDFs', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'] },
    ],
    properties: ['openFile', 'multiSelections'],
  })
  if (result.canceled || !result.filePaths.length) return []

  const scansDir = path.join(app.getPath('userData'), 'scans')
  if (!fs.existsSync(scansDir)) fs.mkdirSync(scansDir, { recursive: true })

  const saved = []
  for (const filePath of result.filePaths) {
    const filename = path.basename(filePath)
    const destPath = path.join(scansDir, `${Date.now()}_${filename}`)
    fs.copyFileSync(filePath, destPath)
    const row = db.prepare('INSERT INTO scans (filename, filepath, subject_id, description) VALUES (?, ?, ?, ?)').run(filename, destPath, subject_id || null, description || '')
    saved.push(db.prepare('SELECT * FROM scans WHERE id = ?').get(row.lastInsertRowid))
  }
  db.prepare('UPDATE user_stats SET xp = xp + ? WHERE id = 1').run(5 * saved.length)
  checkAchievements()
  return saved
})

ipcMain.handle('delete-scan', (_, id) => {
  const scan = db.prepare('SELECT * FROM scans WHERE id = ?').get(id)
  if (scan && fs.existsSync(scan.filepath)) fs.unlinkSync(scan.filepath)
  db.prepare('DELETE FROM scans WHERE id = ?').run(id)
})

ipcMain.handle('open-scan', async (_, filepath) => {
  const err = await shell.openExternal(`file://${filepath}`)
  return err || null
})

// ── Pomodoro ──────────────────────────────────────────────────────────────────
ipcMain.handle('save-pomodoro', (_, { duration_minutes, subject_id }) => {
  const xpEarned = Math.max(1, duration_minutes)
  db.prepare('INSERT INTO pomodoro_sessions (duration_minutes, subject_id, xp_earned) VALUES (?, ?, ?)').run(duration_minutes, subject_id || null, xpEarned)
  const stats = db.prepare('SELECT * FROM user_stats WHERE id = 1').get()
  db.prepare('UPDATE user_stats SET xp = xp + ?, total_study_minutes = total_study_minutes + ?, streak = ?, last_activity = ? WHERE id = 1')
    .run(xpEarned, duration_minutes, computeNewStreak(stats), todayStr())
  checkAchievements()
  return db.prepare('SELECT * FROM user_stats WHERE id = 1').get()
})

ipcMain.handle('get-pomodoro-sessions', (_, days) => {
  const d = Math.max(1, Math.min(365, parseInt(days) || 30))
  return db.prepare(`
    SELECT p.*, s.name as subject_name, s.color as subject_color
    FROM pomodoro_sessions p LEFT JOIN subjects s ON p.subject_id = s.id
    WHERE p.date >= date('now', '-${d} days') ORDER BY p.date DESC
  `).all()
})

// ── Goals ─────────────────────────────────────────────────────────────────────
ipcMain.handle('get-goals', () => db.prepare('SELECT g.*, s.name as subject_name, s.color as subject_color, s.emoji as subject_emoji FROM goals g LEFT JOIN subjects s ON g.subject_id = s.id ORDER BY g.created_at DESC').all())

ipcMain.handle('auto-update-goals', (_, { duration_minutes, subject_id }) => {
  const goals = db.prepare(`
    SELECT * FROM goals WHERE completed = 0
    AND (unit = 'Minuten' OR unit = 'Pomodoros')
    AND (subject_id IS NULL OR subject_id = ?)
  `).all(subject_id || null)

  for (const goal of goals) {
    const add = goal.unit === 'Minuten' ? duration_minutes : 1
    const newVal = Math.min(goal.current_value + add, goal.target_value)
    db.prepare('UPDATE goals SET current_value = ?, completed = ? WHERE id = ?')
      .run(newVal, newVal >= goal.target_value ? 1 : 0, goal.id)
  }
  return goals.length
})

ipcMain.handle('create-goal', (_, goal) => {
  const result = db.prepare('INSERT INTO goals (title, target_value, unit, period, subject_id) VALUES (?, ?, ?, ?, ?)').run(goal.title, goal.target_value, goal.unit, goal.period, goal.subject_id || null)
  return db.prepare('SELECT * FROM goals WHERE id = ?').get(result.lastInsertRowid)
})

ipcMain.handle('update-goal-progress', (_, { id, value }) => {
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id)
  if (!goal) return null
  const newValue = Math.min(goal.current_value + value, goal.target_value)
  const completed = newValue >= goal.target_value ? 1 : 0
  db.prepare('UPDATE goals SET current_value = ?, completed = ? WHERE id = ?').run(newValue, completed, id)
  return db.prepare('SELECT * FROM goals WHERE id = ?').get(id)
})

ipcMain.handle('delete-goal', (_, id) => db.prepare('DELETE FROM goals WHERE id = ?').run(id))

// ── Calendar ──────────────────────────────────────────────────────────────────
ipcMain.handle('get-events', (_, month) => {
  const base = 'SELECT e.*, s.name as subject_name, s.color as subject_color FROM calendar_events e LEFT JOIN subjects s ON e.subject_id = s.id'
  return month
    ? db.prepare(`${base} WHERE e.date LIKE ? ORDER BY e.date`).all(`${month}%`)
    : db.prepare(`${base} ORDER BY e.date`).all()
})

ipcMain.handle('create-event', (_, { title, date, subject_id, description }) => {
  const result = db.prepare('INSERT INTO calendar_events (title, date, subject_id, description) VALUES (?, ?, ?, ?)').run(title, date, subject_id || null, description || '')
  return db.prepare('SELECT * FROM calendar_events WHERE id = ?').get(result.lastInsertRowid)
})

ipcMain.handle('delete-event', (_, id) => db.prepare('DELETE FROM calendar_events WHERE id = ?').run(id))

// ── Achievements ──────────────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id: 'first_task', title: 'Erster Schritt ✨', desc: 'Erste Aufgabe abgeschlossen', icon: '🌟', check: (db) => db.prepare('SELECT COUNT(*) as c FROM tasks WHERE completed = 1').get().c >= 1 },
  { id: 'tasks_10', title: 'Fleißige Biene 🐝', desc: '10 Aufgaben erledigt', icon: '🐝', check: (db) => db.prepare('SELECT COUNT(*) as c FROM tasks WHERE completed = 1').get().c >= 10 },
  { id: 'tasks_50', title: 'Lernmaschine 🤖', desc: '50 Aufgaben erledigt', icon: '🤖', check: (db) => db.prepare('SELECT COUNT(*) as c FROM tasks WHERE completed = 1').get().c >= 50 },
  { id: 'first_pomodoro', title: 'Tomaten-Liebhaber 🍅', desc: 'Erster Pomodoro abgeschlossen', icon: '🍅', check: (db) => db.prepare('SELECT COUNT(*) as c FROM pomodoro_sessions').get().c >= 1 },
  { id: 'pomodoros_10', title: 'Fokus-Meister 🎯', desc: '10 Pomodoros abgeschlossen', icon: '🎯', check: (db) => db.prepare('SELECT COUNT(*) as c FROM pomodoro_sessions').get().c >= 10 },
  { id: 'first_deck', title: 'Karteikarten-Fan 🃏', desc: 'Erstes Kartendeck erstellt', icon: '🃏', check: (db) => db.prepare('SELECT COUNT(*) as c FROM flashcard_decks').get().c >= 1 },
  { id: 'cards_correct_50', title: 'Quiz-Ass ♠️', desc: '50 Karten richtig beantwortet', icon: '♠️', check: (db) => db.prepare('SELECT SUM(correct_count) as c FROM flashcards').get().c >= 50 },
  { id: 'streak_3', title: 'Streak-Starter 🔥', desc: '3 Tage in Folge gelernt', icon: '🔥', check: (db) => db.prepare('SELECT streak FROM user_stats WHERE id = 1').get().streak >= 3 },
  { id: 'streak_7', title: 'Durchhalter 💪', desc: '7 Tage Streak', icon: '💪', check: (db) => db.prepare('SELECT streak FROM user_stats WHERE id = 1').get().streak >= 7 },
  { id: 'streak_30', title: 'Monats-Held 🏆', desc: '30 Tage Streak', icon: '🏆', check: (db) => db.prepare('SELECT streak FROM user_stats WHERE id = 1').get().streak >= 30 },
  { id: 'scans_5', title: 'Scan-Sammler 📸', desc: '5 Hefteinträge hochgeladen', icon: '📸', check: (db) => db.prepare('SELECT COUNT(*) as c FROM scans').get().c >= 5 },
  { id: 'notes_10', title: 'Notiz-Nerd 📝', desc: '10 Notizen geschrieben', icon: '📝', check: (db) => db.prepare('SELECT COUNT(*) as c FROM notes').get().c >= 10 },
  { id: 'level_5', title: 'Aufsteiger ⭐', desc: 'Level 5 erreicht', icon: '⭐', check: (db) => { const xp = db.prepare('SELECT xp FROM user_stats WHERE id = 1').get().xp; return calcLevel(xp).level >= 5 } },
  { id: 'level_10', title: 'Galaxie-Star 🌌', desc: 'Level 10 erreicht', icon: '🌌', check: (db) => { const xp = db.prepare('SELECT xp FROM user_stats WHERE id = 1').get().xp; return calcLevel(xp).level >= 10 } },
]

function calcLevel(xp) {
  let level = 1, required = 100, totalXP = 0
  while (xp >= totalXP + required) { totalXP += required; level++; required = level * 150 }
  return { level, currentXP: xp - totalXP, required }
}

function checkAchievements() {
  const unlocked = db.prepare('SELECT achievement_id FROM achievements').all().map(r => r.achievement_id)
  const newlyUnlocked = []
  for (const ach of ACHIEVEMENTS) {
    if (!unlocked.includes(ach.id) && ach.check(db)) {
      db.prepare('INSERT OR IGNORE INTO achievements (achievement_id) VALUES (?)').run(ach.id)
      newlyUnlocked.push(ach)
    }
  }
  if (newlyUnlocked.length && mainWindow) {
    const safe = newlyUnlocked.map(({ id, title, desc, icon }) => ({ id, title, desc, icon }))
    mainWindow.webContents.send('achievement-unlocked', safe)
  }
}

ipcMain.handle('get-achievements', () => {
  const unlocked = db.prepare('SELECT * FROM achievements').all()
  const unlockedIds = unlocked.map(r => r.achievement_id)
  return ACHIEVEMENTS.map(a => ({
    ...a,
    check: undefined,
    unlocked: unlockedIds.includes(a.id),
    unlocked_at: unlocked.find(u => u.achievement_id === a.id)?.unlocked_at || null,
  }))
})

// ── Stats for dashboard ───────────────────────────────────────────────────────
ipcMain.handle('get-dashboard-stats', () => {
  const stats = db.prepare('SELECT * FROM user_stats WHERE id = 1').get()
  const { level, currentXP, required } = calcLevel(stats.xp)
  const tasksCompleted = db.prepare('SELECT COUNT(*) as c FROM tasks WHERE completed = 1').get().c
  const totalTasks = db.prepare('SELECT COUNT(*) as c FROM tasks').get().c
  const totalDecks = db.prepare('SELECT COUNT(*) as c FROM flashcard_decks').get().c
  const dueCards = db.prepare("SELECT COUNT(*) as c FROM flashcards WHERE next_review <= date('now')").get().c
  const todaySessions = db.prepare("SELECT COUNT(*) as c, SUM(duration_minutes) as mins FROM pomodoro_sessions WHERE date = date('now')").get()
  const unlockedAchievements = db.prepare('SELECT COUNT(*) as c FROM achievements').get().c
  const studyBySubject = db.prepare(`
    SELECT s.name, s.color, SUM(p.duration_minutes) as minutes
    FROM pomodoro_sessions p JOIN subjects s ON p.subject_id = s.id
    WHERE p.date >= date('now', '-7 days')
    GROUP BY s.id ORDER BY minutes DESC LIMIT 5
  `).all()
  const dailyStudy = db.prepare(`
    SELECT date, SUM(duration_minutes) as minutes
    FROM pomodoro_sessions WHERE date >= date('now', '-14 days')
    GROUP BY date ORDER BY date
  `).all()

  const dow = (new Date().getDay() + 6) % 7  // 0=Mon
  const weekStartStr = new Date(Date.now() - dow * 86400000).toISOString().split('T')[0]
  const weeklyStudy = db.prepare(`SELECT COALESCE(SUM(duration_minutes), 0) as mins, COUNT(*) as sessions FROM pomodoro_sessions WHERE date >= ?`).get(weekStartStr)
  const weeklyNotes = db.prepare(`SELECT COUNT(*) as c FROM notes WHERE DATE(created_at) >= ?`).get(weekStartStr).c

  return { stats: { ...stats, level, currentXP, required }, tasksCompleted, totalTasks, totalDecks, dueCards, todaySessions, unlockedAchievements, studyBySubject, dailyStudy, weeklyStudy, weeklyNotes }
})

ipcMain.handle('get-heatmap-data', () => {
  return db.prepare(`
    SELECT date, SUM(duration_minutes) as minutes
    FROM pomodoro_sessions WHERE date >= date('now', '-365 days')
    GROUP BY date
  `).all()
})

// ── Exams ─────────────────────────────────────────────────────────────────────
ipcMain.handle('get-exams', () => {
  return db.prepare(`
    SELECT e.*, s.name as subject_name, s.color as subject_color, s.emoji as subject_emoji,
           COUNT(t.id) as topic_count,
           SUM(t.completed) as topics_done
    FROM exams e
    LEFT JOIN subjects s ON e.subject_id = s.id
    LEFT JOIN exam_topics t ON e.id = t.exam_id
    GROUP BY e.id ORDER BY e.date ASC
  `).all()
})

ipcMain.handle('create-exam', (_, { title, date, subject_id, notes }) => {
  const result = db.prepare('INSERT INTO exams (title, date, subject_id, notes) VALUES (?, ?, ?, ?)').run(title, date, subject_id || null, notes || '')
  return db.prepare('SELECT * FROM exams WHERE id = ?').get(result.lastInsertRowid)
})

ipcMain.handle('delete-exam', (_, id) => db.prepare('DELETE FROM exams WHERE id = ?').run(id))

ipcMain.handle('get-exam-topics', (_, exam_id) => {
  return db.prepare('SELECT * FROM exam_topics WHERE exam_id = ? ORDER BY order_index ASC, created_at ASC').all(exam_id)
})

ipcMain.handle('create-exam-topic', (_, { exam_id, title }) => {
  const maxOrder = db.prepare('SELECT MAX(order_index) as m FROM exam_topics WHERE exam_id = ?').get(exam_id).m || 0
  const result = db.prepare('INSERT INTO exam_topics (exam_id, title, order_index) VALUES (?, ?, ?)').run(exam_id, title, maxOrder + 1)
  return db.prepare('SELECT * FROM exam_topics WHERE id = ?').get(result.lastInsertRowid)
})

ipcMain.handle('toggle-exam-topic', (_, id) => {
  const topic = db.prepare('SELECT * FROM exam_topics WHERE id = ?').get(id)
  if (!topic) return null
  const newVal = topic.completed ? 0 : 1
  db.prepare('UPDATE exam_topics SET completed = ? WHERE id = ?').run(newVal, id)
  if (newVal === 1) db.prepare('UPDATE user_stats SET xp = xp + 5 WHERE id = 1').run()
  return db.prepare('SELECT * FROM exam_topics WHERE id = ?').get(id)
})

ipcMain.handle('delete-exam-topic', (_, id) => db.prepare('DELETE FROM exam_topics WHERE id = ?').run(id))
