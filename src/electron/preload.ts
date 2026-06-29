import { contextBridge, ipcRenderer } from 'electron'
import type { Config } from '../shared/types'

const api = {
  getConfig: () => ipcRenderer.invoke('get-config') as Promise<Config>,
  saveConfig: (config: Config) => ipcRenderer.invoke('save-config', config) as Promise<void>,
  saveBellFile: (fileName: string, buffer: ArrayBuffer) =>
    ipcRenderer.invoke('save-bell-file', fileName, buffer) as Promise<string>,
  playSound: (sound: string) => ipcRenderer.invoke('play-sound', sound) as Promise<void>,
  stopSound: () => ipcRenderer.invoke('stop-sound') as Promise<void>,
}

contextBridge.exposeInMainWorld('api', api)
contextBridge.exposeInMainWorld('electron', api)
