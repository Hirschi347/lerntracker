const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  // Window
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // Stats
  getStats: () => ipcRenderer.invoke('get-stats'),
  addXP: (amount) => ipcRenderer.invoke('add-xp', amount),
  getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),

  // Subjects
  getSubjects: () => ipcRenderer.invoke('get-subjects'),
  createSubject: (data) => ipcRenderer.invoke('create-subject', data),
  deleteSubject: (id) => ipcRenderer.invoke('delete-subject', id),

  // Tasks
  getTasks: (filters) => ipcRenderer.invoke('get-tasks', filters),
  createTask: (task) => ipcRenderer.invoke('create-task', task),
  completeTask: (id) => ipcRenderer.invoke('complete-task', id),
  deleteTask: (id) => ipcRenderer.invoke('delete-task', id),
  updateTask: (data) => ipcRenderer.invoke('update-task', data),

  // Flashcard Decks
  getDecks: () => ipcRenderer.invoke('get-decks'),
  createDeck: (data) => ipcRenderer.invoke('create-deck', data),
  deleteDeck: (id) => ipcRenderer.invoke('delete-deck', id),

  // Flashcards
  getCards: (deckId) => ipcRenderer.invoke('get-cards', deckId),
  getDueCards: (deckId) => ipcRenderer.invoke('get-due-cards', deckId),
  createCard: (data) => ipcRenderer.invoke('create-card', data),
  deleteCard: (id) => ipcRenderer.invoke('delete-card', id),
  reviewCard: (data) => ipcRenderer.invoke('review-card', data),

  // Notes
  getNotes: (subjectId) => ipcRenderer.invoke('get-notes', subjectId),
  createNote: (data) => ipcRenderer.invoke('create-note', data),
  updateNote: (data) => ipcRenderer.invoke('update-note', data),
  deleteNote: (id) => ipcRenderer.invoke('delete-note', id),

  // Scans
  getScans: (subjectId) => ipcRenderer.invoke('get-scans', subjectId),
  uploadScan: (data) => ipcRenderer.invoke('upload-scan', data),
  deleteScan: (id) => ipcRenderer.invoke('delete-scan', id),
  openScan: (filepath) => ipcRenderer.invoke('open-scan', filepath),

  // Pomodoro
  savePomodoro: (data) => ipcRenderer.invoke('save-pomodoro', data),
  getPomodoroSessions: (days) => ipcRenderer.invoke('get-pomodoro-sessions', days),
  getHeatmapData: () => ipcRenderer.invoke('get-heatmap-data'),

  // Goals
  getGoals: () => ipcRenderer.invoke('get-goals'),
  autoUpdateGoals: (data) => ipcRenderer.invoke('auto-update-goals', data),
  createGoal: (data) => ipcRenderer.invoke('create-goal', data),
  updateGoalProgress: (data) => ipcRenderer.invoke('update-goal-progress', data),
  deleteGoal: (id) => ipcRenderer.invoke('delete-goal', id),

  // Calendar
  getEvents: (month) => ipcRenderer.invoke('get-events', month),
  createEvent: (data) => ipcRenderer.invoke('create-event', data),
  deleteEvent: (id) => ipcRenderer.invoke('delete-event', id),

  // Achievements
  getAchievements: () => ipcRenderer.invoke('get-achievements'),

  // Exams
  getExams: () => ipcRenderer.invoke('get-exams'),
  createExam: (data) => ipcRenderer.invoke('create-exam', data),
  deleteExam: (id) => ipcRenderer.invoke('delete-exam', id),
  getExamTopics: (examId) => ipcRenderer.invoke('get-exam-topics', examId),
  createExamTopic: (data) => ipcRenderer.invoke('create-exam-topic', data),
  toggleExamTopic: (id) => ipcRenderer.invoke('toggle-exam-topic', id),
  deleteExamTopic: (id) => ipcRenderer.invoke('delete-exam-topic', id),

  // Events from main
  onAchievementUnlocked: (cb) => ipcRenderer.on('achievement-unlocked', (_, data) => cb(data)),
  removeAchievementListener: () => ipcRenderer.removeAllListeners('achievement-unlocked'),
})
