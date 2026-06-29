import type { WebContents } from 'electron'
import path from 'node:path'
import type { LessonsSettings, Schedule, SoundsSettings } from '../shared/types.ts'
import { logger } from './logger.ts'

const DAY_NAMES = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']

function todayName(): string {
  return DAY_NAMES[new Date().getDay()]
}

interface ScheduledEvent {
  timeMinutes: number
  soundPath: string
  label: string
}

function hhmm(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function addMinutes(timeMinutes: number, extra: number): number {
  return timeMinutes + extra
}

function durationToMinutes(duration: string): number {
  const [h, m] = duration.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export class Scheduler {
  private timers: NodeJS.Timeout[] = []
  private midnightTimer: NodeJS.Timeout | null = null
  private webContents: WebContents | null = null
  private bellDurationSeconds = 10

  private lastSchedules: Schedule[] = []
  private lastSoundsSettings?: Pick<SoundsSettings, 'bellDurationSeconds' | 'muted'>
  private lastLessonsSettings?: Pick<LessonsSettings, 'workWeek'>

  setWebContents(wc: WebContents) {
    this.webContents = wc
  }

  start(
    schedules: Schedule[],
    soundsSettings?: Pick<SoundsSettings, 'bellDurationSeconds' | 'muted'>,
    lessonsSettings?: Pick<LessonsSettings, 'workWeek'>,
  ) {
    this.stop()

    this.lastSchedules = schedules
    this.lastSoundsSettings = soundsSettings
    this.lastLessonsSettings = lessonsSettings

    if (soundsSettings) {
      this.bellDurationSeconds = soundsSettings.bellDurationSeconds
    }

    const today = todayName()
    const workWeek = lessonsSettings?.workWeek ?? []

    if (workWeek.length === 0 || !workWeek.includes(today)) {
      logger.info(`Сегодня ${today} — не рабочий день. Scheduler не запущен.`)
    } else {
      const events = this.buildEvents(schedules)
      const now = new Date()
      const nowMinutes = now.getHours() * 60 + now.getMinutes()

      for (const event of events) {
        const delayMs = (event.timeMinutes - nowMinutes) * 60 * 1000 - now.getSeconds() * 1000

        if (delayMs < 0) continue

        const timer = setTimeout(() => {
          logger.bell(`${event.label} | sound: ${path.basename(event.soundPath)}`)
          if (soundsSettings?.muted) {
            logger.info(`Muted — звук не воспроизведён (${event.label})`)
            return
          }
          this.webContents?.send('play-bell', event.soundPath, this.bellDurationSeconds)
        }, delayMs)

        this.timers.push(timer)
      }

      logger.info(`[${today}] Scheduler started: ${events.length} events, ${this.timers.length} scheduled today`)
    }

    this.scheduleMidnightRestart()
  }

  stop() {
    this.timers.forEach(clearTimeout)
    this.timers = []
    if (this.midnightTimer) {
      clearTimeout(this.midnightTimer)
      this.midnightTimer = null
    }
  }

  private scheduleMidnightRestart() {
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0)
    const msUntilMidnight = midnight.getTime() - now.getTime()

    this.midnightTimer = setTimeout(() => {
      logger.info('Полночь — перезапуск планировщика на новый день')
      this.start(this.lastSchedules, this.lastSoundsSettings, this.lastLessonsSettings)
    }, msUntilMidnight)
  }

  private buildEvents(schedules: Schedule[]): ScheduledEvent[] {
    const events: ScheduledEvent[] = []

    for (const item of schedules) {
      if (!item.time) continue

      const startMinutes = hhmm(item.time)

      // Start bell
      if (item.sound?.path) {
        if (item.sound.path.startsWith('blob:')) {
          logger.warn(`[${item.name}] blob: URL не поддерживается — переназначь мелодию`)
        } else {
          events.push({
            timeMinutes: startMinutes,
            soundPath: item.sound.path,
            label: `${item.name} — начало`,
          })
        }
      }

      if (!item.duration) continue

      const durationMin = durationToMinutes(item.duration)
      const endMinutes = addMinutes(startMinutes, durationMin)

      // Warning bell (before end)
      if (
        item.hasStartWarning &&
        item.startWarningSound?.path &&
        item.startWarningDurationSeconds > 0
      ) {
        if (item.startWarningSound.path.startsWith('blob:')) {
          logger.warn(`[${item.name}] blob: URL для предупреждения не поддерживается — переназначь мелодию`)
        } else {
          const warningMinutes = endMinutes - Math.ceil(item.startWarningDurationSeconds / 60)
          if (warningMinutes > startMinutes) {
            events.push({
              timeMinutes: warningMinutes,
              soundPath: item.startWarningSound.path,
              label: `${item.name} — предупреждение`,
            })
          }
        }
      }
    }

    return events.sort((a, b) => a.timeMinutes - b.timeMinutes)
  }
}
