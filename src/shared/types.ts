export interface Schedule {
  id: string;
  name: string;
  type: "lesson" | "break";
  time: string;
  end: string;
  duration: string;
  delaySeconds: number;
  sound: Bell | null;
  hasStartWarning: boolean;
  startWarningDurationSeconds: number;
  startWarningSound: Bell | null;
}

export interface Stream {
  id: string;
  name: string;
  schedule: Schedule[];
}

export interface School {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
  favicon: string;
}

export interface LessonsSettings {
  duration: string;
  workWeek: string[];
  workWeekend: string[];
}

export interface SystemInfo {
  name: string;
  version: string;
  build: string;
  buildDate: string;
  buildTime: string;
  buildTimestamp: number;
}

export interface SoundsSettings {
  volume: number;
  muted: boolean;
  bellDurationSeconds: number;
}

export interface Bell {
  id: string;
  name: string;
  path: string;
}

export interface Config {
  school: School;
  lessons: LessonsSettings;
  system: SystemInfo;
  soundsSettings: SoundsSettings;
  bells: Bell[];
  streams: Stream[];
}
