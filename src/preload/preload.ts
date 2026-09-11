import { contextBridge, ipcRenderer } from 'electron';
import { Subject, StudySession, Profile, SessionCompletionResult, TarotIcon, TimeMode } from '../shared/types';

const api = {
  subjects: {
    create: (title: string, colorHex: string, icon: TarotIcon): Promise<Subject> =>
      ipcRenderer.invoke('subjects:create', title, colorHex, icon),
    list: (): Promise<Subject[]> => ipcRenderer.invoke('subjects:list'),
    togglePool: (subjectId: string, inPool: boolean): Promise<Subject> =>
      ipcRenderer.invoke('subjects:togglePool', subjectId, inPool),
    mostStudiedTitle: (): Promise<string | null> => ipcRenderer.invoke('subjects:mostStudiedTitle'),
    delete: (subjectId: string): Promise<void> => ipcRenderer.invoke('subjects:delete', subjectId),
    deleteAll: (): Promise<void> => ipcRenderer.invoke('subjects:deleteAll'),
  },
  roulette: {
    spin: (): Promise<Subject> => ipcRenderer.invoke('roulette:spin'),
    generateTime: (mode: TimeMode, manualMinutes?: number): Promise<number> =>
      ipcRenderer.invoke('roulette:generateTime', mode, manualMinutes),
  },
  sessions: {
    start: (subjectId: string, targetMinutes: number, timeMode: TimeMode): Promise<StudySession> =>
      ipcRenderer.invoke('sessions:start', subjectId, targetMinutes, timeMode),
    finish: (sessionId: string, actualMinutes: number, outcome: 'completed' | 'abandoned'): Promise<SessionCompletionResult> =>
      ipcRenderer.invoke('sessions:finish', sessionId, actualMinutes, outcome),
  },
  profile: {
    get: (): Promise<Profile> => ipcRenderer.invoke('profile:get'),
  },
};

export type TarotApi = typeof api;

contextBridge.exposeInMainWorld('tarotApi', api);
