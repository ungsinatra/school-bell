import { Input } from "@base-ui/react/input";
import { Slider } from "@base-ui/react/slider";
import { Switch } from "@base-ui/react/switch";
import { Toast } from "@base-ui/react/toast";
import { Calendar, School, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Bell, Config } from "../../../../shared/types";
import { MelodyLibrary } from "../../settings/melody-library/melody-library";
import { PageHeader } from "../../ui";
import "./settings.css";

const DAYS: { label: string; full: string }[] = [
  { label: "Пн", full: "Понедельник" },
  { label: "Вт", full: "Вторник" },
  { label: "Ср", full: "Среда" },
  { label: "Чт", full: "Четверг" },
  { label: "Пт", full: "Пятница" },
  { label: "Сб", full: "Суббота" },
  { label: "Вс", full: "Воскресенье" },
];

export default function SettingsPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { promise, add } = Toast.useToastManager();

  useEffect(() => {
    window.api
      .getConfig()
      .then(setConfig)
      .catch(() =>
        add({
          title: "Ошибка",
          description: "Не удалось загрузить конфигурацию",
          type: "error",
        })
      )
      .finally(() => setLoading(false));
  }, [add]);

  function updateSchool(patch: Partial<Config["school"]>) {
    setConfig((prev) => {
      if (!prev) return prev;
      return { ...prev, school: { ...prev.school, ...patch } };
    });
  }

  function updateLessons(patch: Partial<Config["lessons"]>) {
    setConfig((prev) => {
      if (!prev) return prev;
      return { ...prev, lessons: { ...prev.lessons, ...patch } };
    });
  }

  function updateSounds(patch: Partial<Config["soundsSettings"]>) {
    setConfig((prev) => {
      if (!prev) return prev;
      return { ...prev, soundsSettings: { ...prev.soundsSettings, ...patch } };
    });
  }

  function handleAddBells(newBells: Bell[]) {
    setConfig((prev) => {
      if (!prev) return prev;
      return { ...prev, bells: [...prev.bells, ...newBells] };
    });
  }

  function handleDeleteBell(id: string) {
    setConfig((prev) => {
      if (!prev) return prev;
      return { ...prev, bells: prev.bells.filter((b) => b.id !== id) };
    });
  }

  function toggleDay(full: string) {
    const workWeek = config?.lessons.workWeek ?? [];
    const next = workWeek.includes(full)
      ? workWeek.filter((d) => d !== full)
      : [...workWeek, full];
    updateLessons({ workWeek: next });
  }

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    await promise(window.api.saveConfig(config), {
      loading: { title: "Сохранение...", type: "loading", timeout: 0 },
      success: {
        title: "Сохранено",
        description: "Настройки обновлены",
        type: "success",
        timeout: 3000,
      },
      error: {
        title: "Ошибка",
        description: "Не удалось сохранить",
        type: "error",
        timeout: 3000,
      },
    }).finally(() => setSaving(false));
  }

  return (
    <div className="settings-page">
      <PageHeader
        title="Настройки"
        description="Управление параметрами системы"
        onSave={handleSave}
        saving={saving}
        disabled={loading || !config}
      />

      <div className="settings-content">
        {loading && <div className="settings-loading">Загрузка...</div>}
        {/* School info card */}
        <div className="settings-card">
          <div className="settings-card__header">
            <div className="settings-card__icon">
              <School size={20} />
            </div>
            <div>
              <h4 className="settings-card__title">Информация о школе</h4>
              <p className="settings-card__description">
                Основные данные учебного заведения
              </p>
            </div>
          </div>

          <div className="settings-card__fields">
            <div className="settings-field">
              <label className="settings-field__label">Название школы</label>
              <Input
                className="settings-field__input"
                placeholder="Школа №1"
                value={config?.school.name ?? ""}
                onChange={(e) => updateSchool({ name: e.target.value })}
              />
            </div>
            <div className="settings-field">
              <label className="settings-field__label">Адрес</label>
              <Input
                className="settings-field__input"
                placeholder="г. Москва, ул. Ленина, 1"
                value={config?.school.address ?? ""}
                onChange={(e) => updateSchool({ address: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Work schedule card */}
        <div className="settings-card">
          <div className="settings-card__header">
            <div className="settings-card__icon settings-card__icon--orange">
              <Calendar size={20} />
            </div>
            <div>
              <h4 className="settings-card__title">Расписание работы</h4>
              <p className="settings-card__description">
                Выберите дни недели для звонков
              </p>
            </div>
          </div>

          <div className="settings-days">
            {DAYS.map(({ label, full }) => {
              const active = config?.lessons.workWeek.includes(full) ?? false;
              return (
                <button
                  key={full}
                  className={`settings-day${
                    active ? " settings-day--active" : ""
                  }`}
                  onClick={() => toggleDay(full)}
                  disabled={!config}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="settings-separator" />

          <div className="settings-autostart">
            <div>
              <p className="settings-autostart__label">Автоматический запуск</p>
              <p className="settings-autostart__desc">
                Включать систему звонков автоматически
              </p>
            </div>
            <Switch.Root className="lesson-card__switch" checked={false}>
              <Switch.Thumb className="lesson-card__switch-thumb" />
            </Switch.Root>
          </div>
        </div>
        {/* Sound settings card */}
        <div className="settings-card">
          <div className="settings-card__header">
            <div className="settings-card__icon settings-card__icon--purple">
              <Volume2 size={20} />
            </div>
            <div>
              <h4 className="settings-card__title">Настройки звука</h4>
              <p className="settings-card__description">
                Громкость и параметры воспроизведения
              </p>
            </div>
          </div>

          <div>
            <div className="settings-volume-header">
              <span className="settings-field__label">Громкость звонка</span>
              <span className="settings-volume-value">
                {config?.soundsSettings.volume ?? 100}%
              </span>
            </div>
            <Slider.Root
              className="settings-slider"
              min={0}
              max={100}
              value={config?.soundsSettings.volume ?? 100}
              onValueChange={(val) => updateSounds({ volume: val as number })}
              disabled={!config}
            >
              <Slider.Control className="settings-slider__control">
                <Slider.Track className="settings-slider__track">
                  <Slider.Indicator className="settings-slider__indicator" />
                  <Slider.Thumb className="settings-slider__thumb" />
                </Slider.Track>
              </Slider.Control>
            </Slider.Root>
          </div>

          <div className="settings-separator" />

          <div className="settings-field settings-field--row">
            <div>
              <p className="settings-autostart__label">Длительность звонка</p>
              <p className="settings-autostart__desc">
                Сколько секунд играет звук (0 — до конца файла)
              </p>
            </div>
            <Input
              className="settings-field__input settings-field__input--short"
              type="number"
              min={0}
              max={300}
              value={config?.soundsSettings.bellDurationSeconds ?? 10}
              onChange={(e) =>
                updateSounds({ bellDurationSeconds: Number(e.target.value) })
              }
              disabled={!config}
            />
          </div>

          <div className="settings-separator" />

          <div className="settings-autostart">
            <div>
              <p className="settings-autostart__label">Без звука</p>
              <p className="settings-autostart__desc">
                Отключить воспроизведение всех звонков
              </p>
            </div>
            <Switch.Root
              className="lesson-card__switch"
              checked={config?.soundsSettings.muted ?? false}
              onCheckedChange={(checked) => updateSounds({ muted: checked })}
              disabled={!config}
            >
              <Switch.Thumb className="lesson-card__switch-thumb" />
            </Switch.Root>
          </div>
        </div>
        {config && (
          <MelodyLibrary
            bells={config.bells}
            onAdd={handleAddBells}
            onDelete={handleDeleteBell}
          />
        )}
      </div>
    </div>
  );
}
