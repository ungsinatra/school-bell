import { BookMarked, ChevronDown, Clock, GraduationCap, Home, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { version } from "../../../../../package.json";
import type { Stream } from "../../../../shared/types";
import "./sidebar.css";

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function getRemainingLessons(stream: Stream, now: Date): number {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return stream.schedule.filter((s) => {
    if (s.type !== "lesson" || !s.time || !s.duration) return false;
    const end = toMinutes(s.time) + toMinutes(s.duration);
    return nowMin < end;
  }).length;
}

export function Sidebar() {
  const { pathname } = useLocation();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [streamsOpen, setStreamsOpen] = useState(true);

  useEffect(() => {
    const load = () =>
      window.api.getConfig().then((c) => setStreams(c.streams)).catch(() => {});
    load();
    window.addEventListener("config-saved", load);
    return () => window.removeEventListener("config-saved", load);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="header">
        <div className="header-content">
          <div className="header-icon-container">
            <Clock className="header-icon" />
          </div>
          <div className="header-text">
            <span style={{ fontWeight: 700, fontSize: 15, color: "#fafafa" }}>
              Школьные звонки
            </span>
            <span>Управление звонками</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 8px 0" }}>
        {/* Главная */}
        <Link
          to="/"
          className={`stream-item-link${pathname === "/" ? " stream-item-link--active" : ""}`}
        >
          <div className="stream-item-container">
            <div className={`stream-icon-container${pathname === "/" ? " stream-icon-container-active" : ""}`}>
              <Home size={20} />
            </div>
            <div className="stream-info">
              <span className="stream-name">Главная</span>
              <span className="stream-description">Текущее расписание</span>
            </div>
          </div>
        </Link>


        {/* Смены — collapsible */}
        <button
          className="stream-item-link stream-group-toggle"
          onClick={() => setStreamsOpen((v) => !v)}
        >
          <div className="stream-item-container">
            <div className="stream-icon-container">
              <GraduationCap size={20} />
            </div>
            <div className="stream-info">
              <span className="stream-name">Смены</span>
              <span className="stream-description">{streams.length} смен(ы)</span>
            </div>
            <ChevronDown
              size={14}
              className={`stream-group-chevron${streamsOpen ? " stream-group-chevron--open" : ""}`}
            />
          </div>
        </button>

        {/* Подменю смен */}
        <div className={`stream-submenu${streamsOpen ? " stream-submenu--open" : ""}`}>
          {streams.map((stream) => {
            const to = `/streams/${stream.id}`;
            const active = pathname === to;
            const remaining = getRemainingLessons(stream, now);
            const total = stream.schedule.filter((s) => s.type === "lesson").length;
            return (
              <Link
                key={stream.id}
                to={to}
                className={`stream-subitem${active ? " stream-subitem--active" : ""}`}
              >
                <div className="stream-subitem__dot" />
                <div className="stream-info">
                  <span className="stream-name">{stream.name}</span>
                  <span className="stream-description">
                    {total > 0 ? `${remaining} из ${total} уроков` : "Нет уроков"}
                  </span>
                </div>
                {remaining > 0 && (
                  <span className="stream-badge">{remaining}</span>
                )}
              </Link>
            );
          })}
        </div>


        {/* Справочник */}
        <Link
          to="/reference"
          className={`stream-item-link${pathname === "/reference" ? " stream-item-link--active" : ""}`}
        >
          <div className="stream-item-container">
            <div className={`stream-icon-container${pathname === "/reference" ? " stream-icon-container-active" : ""}`}>
              <BookMarked size={20} />
            </div>
            <div className="stream-info">
              <span className="stream-name">Справочник</span>
              <span className="stream-description">Информация и помощь</span>
            </div>
          </div>
        </Link>
      </nav>

      {/* Settings */}
      <div className="sidebar-footer">
        <Link
          to="/settings"
          className={`sidebar-settings-link${pathname === "/settings" ? " sidebar-settings-link--active" : ""}`}
        >
          <Settings size={18} />
          Настройки
        </Link>
        <span className="sidebar-version">v{version}</span>
      </div>
    </aside>
  );
}
