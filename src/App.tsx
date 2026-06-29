import { Toast } from "@base-ui/react/toast";
import { CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./render/components/ui";
import type { Config } from "./shared/types";
import "./toast.css";

function App() {
  const [config, setConfig] = useState<Config | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await window.api.getConfig();
        if (!cancelled) setConfig(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load config");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let audio: HTMLAudioElement | null = null;
    let blobUrl: string | null = null;

    window.api.onPlayBell(async (filePath, durationSeconds) => {
      audio?.pause();
      if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }

      const buffer = await window.api.readBellFile(filePath);
      blobUrl = URL.createObjectURL(new Blob([buffer], { type: "audio/mpeg" }));
      audio = new Audio(blobUrl);

      const cleanup = () => {
        audio?.pause();
        audio = null;
        if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
      };

      audio.onended = cleanup;
      audio.play();

      if (durationSeconds > 0) {
        setTimeout(cleanup, durationSeconds * 1000);
      }
    });

    return () => {
      window.api.offPlayBell();
      audio?.pause();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, []);

  if (error) return <div>Error: {error}</div>;
  if (!config) return <div>Loading...</div>;

  return (
    <Toast.Provider timeout={4000}>
      <div style={{ display: "flex", width: "100%", height: "100vh", overflow: "hidden" }}>
        <Sidebar />
        <div style={{ flex: 1, minWidth: 0, height: "100%", overflow: "hidden", background: "#18181b" }}>
          <Outlet />
        </div>
      </div>
      <Toast.Viewport className="toast-viewport">
        <ToastList />
      </Toast.Viewport>
    </Toast.Provider>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast} className={`toast toast--${toast.type}`}>
      <div className="toast__icon">
        {toast.type === "success" && <CheckCircle size={18} />}
        {toast.type === "error" && <XCircle size={18} />}
      </div>
      <div className="toast__body">
        {toast.title && <Toast.Title className="toast__title">{toast.title}</Toast.Title>}
        {toast.description && (
          <Toast.Description className="toast__description">{toast.description}</Toast.Description>
        )}
      </div>
      <Toast.Close className="toast__close">✕</Toast.Close>
    </Toast.Root>
  ));
}

export default App;