import fs from 'node:fs'
import path from 'node:path'

const logsDir = path.join(process.cwd(), 'logs')

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function timestamp(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function logFile(): string {
  const d = new Date()
  return path.join(logsDir, `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.log`)
}

function write(level: string, message: string): void {
  const line = `[${timestamp()}] [${level}] ${message}\n`
  process.stdout.write(line)
  try {
    fs.mkdirSync(logsDir, { recursive: true })
    fs.appendFileSync(logFile(), line, 'utf-8')
  } catch {
    // не блокируем работу если лог не пишется
  }
}

export const logger = {
  info:  (msg: string) => write('INFO ', msg),
  warn:  (msg: string) => write('WARN ', msg),
  error: (msg: string) => write('ERROR', msg),
  bell:  (msg: string) => write('BELL ', msg),
}
