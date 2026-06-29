import { Input } from "@base-ui/react/input";
import { Select } from "@base-ui/react/select";
import { Switch } from "@base-ui/react/switch";
import { Bell as BellIcon, BookOpen, ChevronDown, GripVertical, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { HTMLAttributes } from "react";
import type { Bell, Schedule } from "../../../shared/types";
import "./lesson.css";

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function minutesToHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getLessonStatus(
  time: string,
  duration: string,
  now: Date
): "past" | "active" | "upcoming" {
  if (!time || !duration) return "upcoming";
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(time);
  const end = start + toMinutes(duration);
  if (currentMinutes >= end) return "past";
  if (currentMinutes >= start) return "active";
  return "upcoming";
}

interface LessonCardProps {
  lesson: Schedule;
  bells: Bell[];
  onUpdate: (updated: Partial<Schedule>) => void;
  onDelete: () => void;
  dragHandleProps?: HTMLAttributes<HTMLDivElement>;
}

export function LessonCard({ lesson, bells, onUpdate, onDelete, dragHandleProps }: LessonCardProps) {
  const isLesson = lesson.type === "lesson";
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const status = getLessonStatus(lesson.time, lesson.duration, now);

  return (
    <div
      className={`lesson-card ${
        isLesson ? "lesson" : "break"
      } status-${status}`}
    >
      <div className="lesson-card__drag-handle" {...dragHandleProps}>
        <GripVertical size={16} />
      </div>

      <div
        className={`lesson-card__icon ${
          isLesson ? "lesson-icon" : "break-icon"
        }`}
      >
        {isLesson ? <BookOpen size={20} /> : <BellIcon size={20} />}
      </div>

      <div className="lesson-card__body">
        <h1 className="lesson-card__name">{lesson.name}</h1>

        <div className="lesson-card__fields">
          <div className="lesson-card__field">
            <span className="lesson-card__label">Время начала</span>
            <Input
              className="lesson-card__input"
              type="time"
              value={lesson.time ?? ""}
              onChange={(e) => onUpdate({ time: e.target.value })}
            />
          </div>

          <div className="lesson-card__field">
            <span className="lesson-card__label">Длительность (мин)</span>
            <Input
              className="lesson-card__input"
              type="number"
              min={1}
              max={300}
              value={lesson.duration ? toMinutes(lesson.duration) : ""}
              onChange={(e) => {
                const min = parseInt(e.target.value);
                onUpdate({ duration: min > 0 ? minutesToHHMM(min) : "" });
              }}
            />
          </div>

          <div className="lesson-card__field">
            <span className="lesson-card__label">Мелодия</span>
            <Select.Root
              value={lesson.sound?.id ?? undefined}
              onValueChange={(id) => {
                const bell = bells.find((b) => b.id === id) ?? null;
                onUpdate({ sound: bell });
              }}
            >
              <Select.Trigger className="lesson-card__select-trigger">
                <Select.Value>
                  {lesson.sound?.name ?? <span className="lesson-card__placeholder">Выберите мелодию</span>}
                </Select.Value>
                <ChevronDown className="lesson-card__select-icon" size={14} />
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner className="lesson-card__select-positioner" side="top" sideOffset={4}>
                  <Select.Popup className="lesson-card__select-popup">
                    {bells.length === 0 ? (
                      <div className="lesson-card__select-empty">Нет доступных мелодий</div>
                    ) : bells.map((b) => (
                      <Select.Item
                        key={b.id}
                        value={b.id}
                        className="lesson-card__select-item"
                      >
                        <Select.ItemText>{b.name}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </div>
        </div>

        {!isLesson && (
          <div className="lesson-card__warning">
            <label className="lesson-card__warning-label">
              <Switch.Root
                className="lesson-card__switch"
                checked={lesson.hasStartWarning}
                onCheckedChange={(checked) =>
                  onUpdate({ hasStartWarning: checked })
                }
              >
                <Switch.Thumb className="lesson-card__switch-thumb" />
              </Switch.Root>
              <span className="lesson-card__label">
                Предупреждение об окончании
              </span>
            </label>

            {lesson.hasStartWarning && (
              <div className="lesson-card__field">
                <span className="lesson-card__label">Звук предупреждения</span>
                <Select.Root
                  value={lesson.startWarningSound?.id ?? undefined}
                  onValueChange={(id) => {
                    const bell = bells.find((b) => b.id === id) ?? null;
                    onUpdate({ startWarningSound: bell });
                  }}
                >
                  <Select.Trigger className="lesson-card__select-trigger">
                    <Select.Value>
                      {lesson.startWarningSound?.name ?? <span className="lesson-card__placeholder">Выберите звук</span>}
                    </Select.Value>
                    <ChevronDown
                      className="lesson-card__select-icon"
                      size={14}
                    />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Positioner side="top" sideOffset={4}>
                      <Select.Popup className="lesson-card__select-popup">
                        {bells.length === 0 ? (
                          <div className="lesson-card__select-empty">Нет доступных мелодий</div>
                        ) : bells.map((b) => (
                          <Select.Item
                            key={b.id}
                            value={b.id}
                            className="lesson-card__select-item"
                          >
                            <Select.ItemText>{b.name}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Popup>
                    </Select.Positioner>
                  </Select.Portal>
                </Select.Root>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        className="lesson-card__delete"
        onClick={onDelete}
        title="Удалить"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
