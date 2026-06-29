import { ipcMain } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { ConfigService, dataDir } from '../services/config.ts'
import { logger } from '../services/logger.ts'
import { Scheduler } from '../services/scheduler.ts'
import type { Config } from '../shared/types'

const configService = new ConfigService()
export const scheduler = new Scheduler()

const bellsDir = path.join(dataDir, 'bells')

function getAllSchedules(config: Config) {
  return config.streams.flatMap(s => s.schedule)
}

export function registerIpc() {
  ipcMain.handle('get-config', () => {
    return configService.load()
  })

  ipcMain.handle('save-config', (_event: unknown, config: Config) => {
    configService.save(config)
    scheduler.stop()
    const schedules = getAllSchedules(config)
    logger.info(`Config saved. Restarting scheduler with ${schedules.length} schedule items...`)
    scheduler.start(schedules, config.soundsSettings, config.lessons)
  })

  ipcMain.handle('read-bell-file', (_event: unknown, filePath: string) => {
    return fs.readFileSync(filePath)
  })

  ipcMain.handle('save-bell-file', (_event: unknown, fileName: string, buffer: ArrayBuffer) => {
    fs.mkdirSync(bellsDir, { recursive: true })
    const safeName = fileName.replace(/[^a-zA-Z0-9._\-\u0400-\u04FF]/g, '_')
    const filePath = path.join(bellsDir, safeName)
    fs.writeFileSync(filePath, Buffer.from(buffer))
    return filePath
  })

}
