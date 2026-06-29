import type { Config } from './shared/types'

type PreloadApi = {
  getConfig: () => Promise<Config>
  saveConfig: (config: Config) => Promise<void>
  saveBellFile: (fileName: string, buffer: ArrayBuffer) => Promise<string>
  readBellFile: (filePath: string) => Promise<ArrayBuffer>
  onPlayBell: (callback: (filePath: string, durationSeconds: number) => void) => void
  offPlayBell: () => void
}

declare global {
  interface Window {
    api: PreloadApi
    electron: PreloadApi
  }
}

export {}
