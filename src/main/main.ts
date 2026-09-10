import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { getDb } from './db';
import { createSubject, getUserSubjects, togglePoolStatus, spinSubject, getMostStudiedSubjectTitle } from './repositories/subjects';
import { startSession, finishSession } from './repositories/sessions';
import { getProfile } from './repositories/quest';
import { TarotIcon, TimeMode } from '../shared/types';
import { generateStudyTime } from '../shared/points';

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1100,
    height: 760,
    backgroundColor: '#140a1f',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(() => {
  getDb();

  ipcMain.handle('subjects:create', (_e, title: string, colorHex: string, icon: TarotIcon) =>
    createSubject(title, colorHex, icon));
  ipcMain.handle('subjects:list', () => getUserSubjects());
  ipcMain.handle('subjects:togglePool', (_e, subjectId: string, inPool: boolean) =>
    togglePoolStatus(subjectId, inPool));
  ipcMain.handle('subjects:mostStudiedTitle', () => getMostStudiedSubjectTitle());

  ipcMain.handle('roulette:spin', () => spinSubject());
  ipcMain.handle('roulette:generateTime', (_e, mode: TimeMode, manualMinutes?: number) =>
    generateStudyTime(mode, manualMinutes));

  ipcMain.handle('sessions:start', (_e, subjectId: string, targetMinutes: number, timeMode: TimeMode) =>
    startSession(subjectId, targetMinutes, timeMode));
  ipcMain.handle('sessions:finish', (_e, sessionId: string, actualMinutes: number, outcome: 'completed' | 'abandoned') =>
    finishSession(sessionId, actualMinutes, outcome));

  ipcMain.handle('profile:get', () => getProfile());

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
