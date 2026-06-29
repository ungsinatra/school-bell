import { Button } from "@base-ui/react/button";
import { Toast } from "@base-ui/react/toast";
import { Bell as BellIcon, BookOpen, GraduationCap } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import DraggableList, { type TemplateProps } from "react-draggable-list";
import type { Bell, Schedule, Stream } from "../../../../shared/types";
import { LessonCard } from "../../lessons/lesson";
import { PageHeader } from "../../ui";
import "./streams.css";

type CommonProps = {
  bells: Bell[];
  onUpdate: (id: string, patch: Partial<Schedule>) => void;
  onDelete: (id: string) => void;
};

class LessonTemplate extends React.Component<
  TemplateProps<Schedule, CommonProps>
> {
  render() {
    const { item, dragHandleProps, commonProps } = this.props;
    return (
      <LessonCard
        lesson={item}
        bells={commonProps.bells}
        dragHandleProps={dragHandleProps}
        onUpdate={(patch) => commonProps.onUpdate(item.id, patch)}
        onDelete={() => commonProps.onDelete(item.id)}
      />
    );
  }
}

export default function StreamsPage() {
  const { id } = useParams();
  const [stream, setStream] = useState<Stream | null>(null);
  const [bells, setBells] = useState<Bell[]>([]);
  const [saving, setSaving] = useState(false);
  const { promise } = Toast.useToastManager();
  const containerRef = useRef<HTMLDivElement>(null);

  async function handleSave() {
    if (!stream) return;
    setSaving(true);
    await promise(
      (async () => {
        const config = await window.api.getConfig();
        await window.api.saveConfig({
          ...config,
          streams: config.streams.map((s) => (s.id === stream.id ? stream : s)),
        });
        window.dispatchEvent(new Event("config-saved"));
      })(),
      {
        loading: { title: "Сохранение...", type: "loading", timeout: 0 },
        success: {
          title: "Сохранено",
          description: "Расписание обновлено",
          type: "success",
          timeout: 3000,
        },
        error: {
          title: "Ошибка",
          description: "Не удалось сохранить расписание",
          type: "error",
          timeout: 3000,
        },
      }
    ).finally(() => setSaving(false));
  }

  useEffect(() => {
    (async () => {
      const config = await window.api.getConfig();
      const found = config.streams.find((s) => s.id === id);
      if (!found) throw new Error(`Stream with id ${id} not found`);
      setStream(found);
      setBells(config.bells);
    })();
  }, [id]);

  function handleUpdate(lessonId: string, patch: Partial<Schedule>) {
    setStream((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        schedule: prev.schedule.map((s) =>
          s.id === lessonId ? { ...s, ...patch } : s
        ),
      };
    });
  }

  function handleAdd(type: "lesson" | "break") {
    setStream((prev) => {
      if (!prev) return prev;
      const lessonCount = prev.schedule.filter(
        (s) => s.type === "lesson"
      ).length;
      const breakCount = prev.schedule.filter((s) => s.type === "break").length;
      const lessonNumber = lessonCount + 1;
      const breakNumber = type === "break" ? lessonCount : breakCount + 1;
      const newItem: Schedule = {
        id: crypto.randomUUID(),
        name:
          type === "lesson"
            ? `Урок ${lessonNumber}`
            : `Перемена ${breakNumber}`,
        type,
        time: "",
        end: "",
        duration: "",
        delaySeconds: 0,
        sound: null,
        hasStartWarning: false,
        startWarningDurationSeconds: 0,
        startWarningSound: null,
      };
      return { ...prev, schedule: [...prev.schedule, newItem] };
    });
  }

  function handleDelete(lessonId: string) {
    setStream((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        schedule: prev.schedule.filter((s) => s.id !== lessonId),
      };
    });
  }

  async function handleReorder(newList: ReadonlyArray<Schedule>) {
    if (!stream) return;
    const updated = { ...stream, schedule: [...newList] };
    setStream(updated);
    try {
      const config = await window.api.getConfig();
      await window.api.saveConfig({
        ...config,
        streams: config.streams.map((s) => (s.id === updated.id ? updated : s)),
      });
      window.dispatchEvent(new Event("config-saved"));
    } catch {
      // silent — порядок в состоянии уже обновлён
    }
  }

  return (
    <div className="streams-page">
      <PageHeader
        title={stream?.name ?? ""}
        description="Настройте расписание звонков для этой смены"
        onSave={handleSave}
        saving={saving}
        saveLabel="Сохранить настройки"
        icon={<GraduationCap size={20} />}
      />
      <div className="streams-actions">
        <Button
          className="streams-action-btn"
          onClick={() => handleAdd("lesson")}
        >
          <BookOpen size={15} />
          Добавить урок
        </Button>
        <Button
          className="streams-action-btn streams-action-btn--break"
          onClick={() => handleAdd("break")}
        >
          <BellIcon size={15} />
          Добавить перемену
        </Button>
      </div>
      <div className="lessons-container" ref={containerRef}>
        {stream && (
          <DraggableList
            itemKey="id"
            template={LessonTemplate}
            list={stream.schedule}
            onMoveEnd={(newList: ReadonlyArray<Schedule>) =>
              handleReorder(newList)
            }
            container={() => containerRef.current}
            commonProps={{
              bells,
              onUpdate: handleUpdate,
              onDelete: handleDelete,
            }}
          />
        )}
      </div>
    </div>
  );
}
