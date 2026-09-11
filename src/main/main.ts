import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'node:path';
import { getStore } from './db';
import { createSubject, getUserSubjects, togglePoolStatus, deleteSubject, deleteAllSubjects, spinSubject, getMostStudiedSubjectTitle } from './repositories/subjects';
import { startSession, finishSession } from './repositories/sessions';
import { getProfile } from './repositories/quest';
import { TarotIcon, TimeMode } from '../shared/types';
import { generateStudyTime } from '../shared/points';

function createWindow(): void {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const width = Math.min(1100, screenWidth);
  const height = Math.min(760, screenHeight);

  const win = new BrowserWindow({
    width,
    height,
    minWidth: Math.min(360, screenWidth),
    minHeight: Math.min(480, screenHeight),
    backgroundColor: '#140a1f',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (width >= screenWidth || height >= screenHeight) {
    win.maximize();
  }

  win.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(() => {
  getStore();

  ipcMain.handle('subjects:create', (_e, title: string, colorHex: string, icon: TarotIcon) =>
    createSubject(title, colorHex, icon));
  ipcMain.handle('subjects:list', () => getUserSubjects());
  ipcMain.handle('subjects:togglePool', (_e, subjectId: string, inPool: boolean) =>
    togglePoolStatus(subjectId, inPool));
  ipcMain.handle('subjects:mostStudiedTitle', () => getMostStudiedSubjectTitle());
  ipcMain.handle('subjects:delete', (_e, subjectId: string) => deleteSubject(subjectId));
  ipcMain.handle('subjects:deleteAll', () => deleteAllSubjects());

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
