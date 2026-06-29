import { Button } from "@base-ui/react/button";
import { Music, Play, Square, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import type { Bell } from "../../../../shared/types";
import "./melody-library.css";

interface MelodyLibraryProps {
  bells: Bell[];
  onAdd: (bells: Bell[]) => void;
  onDelete: (id: string) => void;
}

export function MelodyLibrary({ bells, onAdd, onDelete }: MelodyLibraryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [playing, setPlaying] = useState<string | null>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const newBells: Bell[] = await Promise.all(
      files.map(async (file) => {
        const buffer = await file.arrayBuffer();
        const diskPath = await window.api.saveBellFile(file.name, buffer);
        return {
          id: crypto.randomUUID(),
          name: file.name.replace(/\.[^.]+$/, ""),
          path: diskPath,
        };
      })
    );

    onAdd(newBells);
    e.target.value = "";
  }

  function toggleSelect(id: string, multi: boolean) {
    setSelected((prev) => {
      const next = new Set(multi ? prev : new Set<string>());
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  async function handlePlay(bell: Bell) {
    if (playing === bell.id) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlaying(null);
      return;
    }

    audioRef.current?.pause();
    audioRef.current = null;

    let src: string;
    let blobUrl: string | null = null;

    if (bell.path.startsWith("blob:") || bell.path.startsWith("http")) {
      src = bell.path;
    } else {
      const buffer = await window.api.readBellFile(bell.path);
      const blob = new Blob([buffer], { type: "audio/mpeg" });
      blobUrl = URL.createObjectURL(blob);
      src = blobUrl;
    }

    const audio = new Audio(src);
    audioRef.current = audio;
    audio.onended = () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      setPlaying(null);
    };
    audio.onerror = () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      setPlaying(null);
    };
    audio.play();
    setPlaying(bell.id);
  }

  function deleteSelected() {
    selected.forEach((id) => onDelete(id));
    setSelected(new Set());
  }

  return (
    <div className="settings-card">
      <div className="settings-card__header">
        <div className="settings-card__icon settings-card__icon--pink">
          <Music size={20} />
        </div>
        <div>
          <h4 className="settings-card__title">Библиотека мелодий</h4>
          <p className="settings-card__description">Управление звуковыми файлами</p>
        </div>
      </div>

      <div className="melody-actions">
        <Button
          className="melody-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={15} />
          Загрузить мелодию
        </Button>

        {selected.size > 0 && (
          <Button className="melody-btn melody-btn--danger" onClick={deleteSelected}>
            <Trash2 size={15} />
            Удалить ({selected.size})
          </Button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          hidden
          onChange={handleFiles}
        />
      </div>

      <div className="melody-info">
        📁 Загружено мелодий: <strong>{bells.length}</strong>
        {selected.size > 0 && (
          <span className="melody-info__selected"> · Выбрано: {selected.size}</span>
        )}
      </div>

      {bells.length > 0 && (
        <div className="melody-list">
          {bells.map((bell) => {
            const isSelected = selected.has(bell.id);
            const isPlaying = playing === bell.id;
            return (
              <div
                key={bell.id}
                className={`melody-item${isSelected ? " melody-item--selected" : ""}`}
                onClick={(e) => toggleSelect(bell.id, e.ctrlKey || e.metaKey)}
              >
                <div className="melody-item__icon">
                  <Music size={14} />
                </div>
                <span className="melody-item__name">{bell.name}</span>
                <div className="melody-item__actions">
                  <button
                    className={`melody-item__play${isPlaying ? " melody-item__play--active" : ""}`}
                    onClick={(e) => { e.stopPropagation(); handlePlay(bell); }}
                    title={isPlaying ? "Стоп" : "Воспроизвести"}
                  >
                    {isPlaying ? <Square size={12} /> : <Play size={12} />}
                  </button>
                  <button
                    className="melody-item__delete"
                    onClick={(e) => { e.stopPropagation(); onDelete(bell.id); }}
                    title="Удалить"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
