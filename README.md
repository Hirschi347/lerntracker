# 🌌 Lerntracker

Eine Kawaii-Galaxy Desktop-App zum Lernen organisieren — gebaut mit Electron + React.

![Design: dunkler Weltraum mit Pastel-Lila/Pink](https://img.shields.io/badge/design-kawaii%20galaxy-c084fc?style=flat-square)
![Electron](https://img.shields.io/badge/electron-43-47848F?style=flat-square&logo=electron)
![React](https://img.shields.io/badge/react-19-61DAFB?style=flat-square&logo=react)

## Features

- **Dashboard** — Wochenbericht, XP, Level, Prüfungs-Countdown
- **Aufgaben** — mit Priorität, Fach und XP-Belohnung
- **Karteikarten** — SM-2 Spaced Repetition + Vokabel-Modus
- **Notizen** — Rich-Text Editor mit Vorlagen
- **Pomodoro** — Timer mit Fokus-Klängen (Weißes Rauschen, Braunes Rauschen, Föhn+Regen)
- **Aktivitäts-Heatmap** — GitHub-Style, 1 Jahr
- **Prüfungen** — Countdown + Themen-Checkliste
- **Achievements** — 14 freischaltbare Erfolge
- **Ziele & Kalender**
- **Dunkles Weltraum-Design** mit animierten Sternen

## App herunterladen (ohne Installation)

👉 [Releases](https://github.com/Hirschi347/lerntracker/releases) — einfach die Datei für dein System herunterladen:

| System | Datei |
|--------|-------|
| Linux | `.AppImage` — ausführbar machen & starten |
| Windows | `.exe` Installer |
| macOS | `.dmg` |

## Aus dem Code selbst bauen

### Voraussetzungen

- [Node.js](https://nodejs.org) (v18 oder neuer)
- Auf Linux: `sudo apt install build-essential python3`
- Auf Windows: [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022) installieren

### Schritte

```bash
git clone https://github.com/Hirschi347/lerntracker.git
cd lerntracker
npm install
npm run dev
```

Die App öffnet sich automatisch als Fenster.

### Gebaut als App-Datei

```bash
npm run build
```

Die fertige App liegt dann im Ordner `dist-app/`.

## Daten

Alle Daten werden lokal gespeichert — keine Cloud, keine Accounts. Die SQLite-Datenbank liegt in deinem Benutzerordner (`appData`).
