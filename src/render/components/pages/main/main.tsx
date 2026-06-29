import { BookOpen, Clock, Coffee, MapPin, School, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Config, Schedule, Stream } from "../../../../shared/types";
import "./main.css";

const DAY_NAMES = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
const MONTHS = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function nowMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

function getActiveStream(streams: Stream[], now: Date): Stream | null {
  const nm = nowMinutes(now);

  // Ищем текущую активную смену
  for (const stream of streams) {
    const items = stream.schedule.filter((s) => s.time && s.duration);
    if (!items.length) continue;
    const first = toMinutes(items[0].time);
    const last = items[items.length - 1];
    const end = toMinutes(last.time) + toMinutes(last.duration || "00:00");
    if (nm >= first && nm <= end) return stream;
  }

  // Ищем ближайшую предстоящую смену
  const upcoming = streams.find((stream) => {
    const items = stream.schedule.filter((s) => s.time);
    return items.some((s) => toMinutes(s.time) > nm);
  });
  if (upcoming) return upcoming;

  // Все смены закончились — нет активной
  return null;
}

type LessonStatus = "past" | "active" | "upcoming";

function getLessonStatus(s: Schedule, now: Date): LessonStatus {
  if (!s.time) return "upcoming";
  const nm = nowMinutes(now);
  const start = toMinutes(s.time);
  const end = start + toMinutes(s.duration || "00:00");
  if (nm >= end) return "past";
  if (nm >= start) return "active";
  return "upcoming";
}

function getNextEvent(
  streams: Stream[],
  now: Date
): { item: Schedule; streamName: string; inMin: number } | null {
  const nm = nowMinutes(now);
  let closest: { item: Schedule; streamName: string; inMin: number } | null = null;

  for (const stream of streams) {
    for (const s of stream.schedule) {
      if (!s.time) continue;
      const diff = toMinutes(s.time) - nm;
      if (diff > 0 && (!closest || diff < closest.inMin)) {
        closest = { item: s, streamName: stream.name, inMin: Math.ceil(diff) };
      }
    }
  }

  return closest;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function MainPage() {
  const [now, setNow] = useState(() => new Date());
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () =>
      window.api.getConfig().then(setConfig).catch(() => {}).finally(() => setLoading(false));
    load();
    window.addEventListener("config-saved", load);
    return () => window.removeEventListener("config-saved", load);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const todayName = DAY_NAMES[now.getDay()];
  const dateStr = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  const workWeek = config?.lessons.workWeek ?? [];
  const isWorkDay = workWeek.includes(todayName);
  const streams = config?.streams ?? [];
  const activeStream = getActiveStream(streams, now);
  const schedule = activeStream?.schedule ?? [];
  const activeLesson = schedule.find((s) => getLessonStatus(s, now) === "active") ?? null;
  const nextEvent = getNextEvent(streams, now);

  const activeStart = activeLesson?.time ? toMinutes(activeLesson.time) * 60 : 0;
  const activeDur = activeLesson?.duration ? toMinutes(activeLesson.duration) * 60 : 0;
  const elapsed = activeLesson ? Math.floor(nowMinutes(now) * 60) - activeStart : 0;
  const remaining = activeDur - elapsed;

  const isLesson = activeLesson?.type === "lesson";

  return (
    <div className="main-page">
    <div className="main-content">
      {/* Header */}
      <div className="main-header">
        <div className="main-date">
          <span className="main-date__day">{todayName}</span>
          <span className="main-date__full">{dateStr}</span>
        </div>
        <div className="main-clock">
          {String(now.getHours()).padStart(2, "0")}:{String(now.getMinutes()).padStart(2, "0")}:{String(now.getSeconds()).padStart(2, "0")}
        </div>
      </div>

      {/* School info */}
      {config?.school && (
        <div className="main-school">
          <div className="main-school__icon">
            <School size={20} />
          </div>
          <div className="main-school__info">
            <span className="main-school__name">{config.school.name}</span>
            {config.school.address && (
              <span className="main-school__address">
                <MapPin size={12} />
                {config.school.address}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="main-grid">
        {/* Work day status */}
        <div className={`main-card main-card--status ${isWorkDay ? "main-card--workday" : "main-card--weekend"}`}>
          <div className="main-card__icon">
            {isWorkDay ? <Volume2 size={22} /> : <Coffee size={22} />}
          </div>
          <div>
            <p className="main-card__label">Сегодня</p>
            <p className="main-card__value">{isWorkDay ? "Рабочий день" : "Выходной"}</p>
            {!isWorkDay && <p className="main-card__sub">Звонки не воспроизводятся</p>}
          </div>
        </div>

        {/* Active stream */}
        <div className="main-card">
          <div className="main-card__icon main-card__icon--blue">
            <Clock size={22} />
          </div>
          <div>
            <p className="main-card__label">Текущая смена</p>
            <p className="main-card__value">{activeStream?.name ?? "—"}</p>
            <p className="main-card__sub">
              {streams.length ? `${streams.length} смен(ы) всего` : "Нет смен"}
            </p>
          </div>
        </div>

        {isWorkDay && (
          <>
            {/* Current lesson */}
            <div className={`main-card ${activeLesson ? (isLesson ? "main-card--lesson" : "main-card--break") : ""}`}>
              <div className={`main-card__icon ${isLesson ? "main-card__icon--blue" : "main-card__icon--orange"}`}>
                <BookOpen size={22} />
              </div>
              <div>
                <p className="main-card__label">{activeLesson ? (isLesson ? "Идёт урок" : "Перемена") : "Сейчас"}</p>
                <p className="main-card__value">{activeLesson?.name ?? "Нет активного урока"}</p>
                {activeLesson && remaining > 0 && (
                  <p className="main-card__sub">Осталось {formatCountdown(remaining)}</p>
                )}
              </div>
              {activeLesson && remaining > 0 && (
                <div className="main-card__countdown">{formatCountdown(remaining)}</div>
              )}
            </div>

            {/* Next event */}
            <div className="main-card">
              <div className="main-card__icon main-card__icon--purple">
                <Clock size={22} />
              </div>
              <div>
                <p className="main-card__label">Следующий звонок</p>
                <p className="main-card__value">{nextEvent?.item.name ?? "Нет"}</p>
                {nextEvent && (
                  <p className="main-card__sub">
                    {nextEvent.streamName} · в {nextEvent.item.time} · через {nextEvent.inMin} мин
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Today schedule */}
      <div className="main-schedule">
        <h3 className="main-schedule__title">Расписание на сегодня</h3>

        {loading ? (
          <div className="main-schedule__empty">
            <div className="main-schedule__spinner" />
            Загрузка...
          </div>
        ) : !isWorkDay ? (
          <div className="main-schedule__empty">
            <Coffee size={32} className="main-schedule__empty-icon" />
            <p>Сегодня выходной день</p>
            <p className="main-schedule__empty-sub">Звонки не воспроизводятся</p>
          </div>
        ) : streams.length === 0 ? (
          <div className="main-schedule__empty">
            <Clock size={32} className="main-schedule__empty-icon" />
            <p>Расписание не настроено</p>
          </div>
        ) : (
          <div className="main-schedule__streams">
            {streams.map((stream) => (
              <div key={stream.id} className="main-schedule__stream-group">
                <div className={`main-schedule__stream-label${stream.id === activeStream?.id ? " main-schedule__stream-label--active" : ""}`}>
                  {stream.name}
                  {stream.id === activeStream?.id && <span className="main-schedule__stream-now">Сейчас</span>}
                </div>
                {stream.schedule.length === 0 ? (
                  <p className="main-schedule__stream-empty">Нет уроков</p>
                ) : (
                  <div className="main-schedule__list">
                    {stream.schedule.map((item) => {
                      const status = getLessonStatus(item, now);
                      return (
                        <div key={item.id} className={`main-schedule__item status-${status} ${item.type}`}>
                          <div className="main-schedule__time">{item.time || "—"}</div>
                          <div className="main-schedule__name">{item.name}</div>
                          <div className="main-schedule__duration">
                            {item.duration ? `${toMinutes(item.duration)} мин` : ""}
                          </div>
                          <div className={`main-schedule__badge badge-${status}`}>
                            {status === "active" ? "Сейчас" : status === "past" ? "Прошёл" : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
