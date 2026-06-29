import dotenv from "dotenv";
import { app, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import { ConfigService } from "../services/config.ts";
import { registerIpc, scheduler } from "./ipc.ts";
import path from "node:path";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production" || app.isPackaged;

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Школьные звонки",
    webPreferences: {
      preload: isProd
        ? path.join(process.resourcesPath, "preload.cjs")
        : path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isProd) {
    mainWindow.loadFile(path.join(app.getAppPath(), "dist/index.html"));
  } else {
    mainWindow.loadURL(`http://localhost:${process.env.PORT}`);
  }

  if (!isProd) mainWindow.webContents.openDevTools();
  mainWindow.webContents.once("did-finish-load", () => {
    scheduler.setWebContents(mainWindow.webContents);
  });
  mainWindow.on("closed", () => {
    scheduler.setWebContents(null as never);
  });
}

app.whenReady().then(async () => {
  if (isProd) {
    app.setLoginItemSettings({ openAtLogin: true });
  }

  registerIpc();

  try {
    const configService = new ConfigService();
    const config = await configService.load();
    const allSchedules = config.streams.flatMap((s) => s.schedule);
    scheduler.start(allSchedules, config.soundsSettings, config.lessons);
  } catch (e) {
    console.error("Failed to start scheduler:", e);
  }

  createMainWindow();
});

app.on("window-all-closed", () => {
  scheduler.stop();
  if (process.platform !== "darwin") {
    app.quit();
  }
});
