const { contextBridge, ipcRenderer } = require('electron')

const api = {
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  saveBellFile: (fileName, buffer) => ipcRenderer.invoke('save-bell-file', fileName, buffer),
  readBellFile: (filePath) => ipcRenderer.invoke('read-bell-file', filePath),
  onPlayBell: (callback) => {
    ipcRenderer.on('play-bell', (_event, filePath, durationSeconds) => callback(filePath, durationSeconds))
  },
  offPlayBell: () => {
    ipcRenderer.removeAllListeners('play-bell')
  },
}

contextBridge.exposeInMainWorld('api', api)
contextBridge.exposeInMainWorld('electron', api)
