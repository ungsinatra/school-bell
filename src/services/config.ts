import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import type { Config } from '../shared/types'

export const dataDir = app.isPackaged
  ? path.join(process.resourcesPath, 'data')
  : path.join(process.cwd(), 'public', 'data')

const filePath = path.join(dataDir, 'config.json')

export class ConfigService {
  load(): Config {
    if (!fs.existsSync(filePath)) {
      return {
        school: { name: '', address: '', phone: '', email: '', website: '', logo: '', favicon: '' },
        lessons: { duration: '00:45', workWeek: [], workWeekend: [] },
        system: { name: '', version: '', build: '', buildDate: '', buildTime: '', buildTimestamp: 0 },
        soundsSettings: { volume: 100, muted: false, bellDurationSeconds: 10 },
        bells: [],
        streams: [],
      }
    }

    const config = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Config
    return this.migrate(config)
  }

  private migrate(config: Config): Config {
    const isBlob = (p?: string | null) => p?.startsWith('blob:') ?? false

    const bells = config.bells.filter(b => {
      if (isBlob(b.path)) {
        console.log(`🧹 Removed stale blob bell: ${b.name}`)
        return false
      }
      return true
    })

    const validBellIds = new Set(bells.map(b => b.id))

    const streams = config.streams.map(stream => ({
      ...stream,
      schedule: stream.schedule.map(item => ({
        ...item,
        sound: item.sound && validBellIds.has(item.sound.id) ? item.sound : null,
        startWarningSound:
          item.startWarningSound && validBellIds.has(item.startWarningSound.id)
            ? item.startWarningSound
            : null,
      })),
    }))

    return {
      ...config,
      bells,
      streams,
      soundsSettings: {
        ...config.soundsSettings,
        volume: config.soundsSettings?.volume ?? 100,
        muted: config.soundsSettings?.muted ?? false,
        bellDurationSeconds: config.soundsSettings?.bellDurationSeconds ?? 10,
      },
    }
  }

  save(config: Config) {
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2))
  }
}