import { app, BrowserWindow, ipcMain } from "electron";
import log from "electron-log";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

log.initialize();

const base = path.join(app.getPath("appData"), "Moza");

app.setPath("crashDumps", path.join(base, "Logs", "Crashes"));
app.setPath("logs", path.join(base, "Logs"));
app.setPath("userData", path.join(base, "Data"));

fs.mkdirSync(app.getPath("logs"), { recursive: true });

log.transports.file.resolvePathFn = () =>
  path.join(app.getPath("logs"), "main.log");

let mainWindow = null;
let confirmWindow = null;
let isQuitting = false;

function createConfirmWindow() {
  if (confirmWindow) {
    confirmWindow.show();
    return;
  }

  confirmWindow = new BrowserWindow({
    width: 400,
    height: 300,
    resizable: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "icon.ico"),
    title: "Moza Browser",
  });

  confirmWindow.setMenu(null);
  confirmWindow.loadFile(path.join(__dirname, "ui/confirm.html"));


}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    frame: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "icon.ico"),
    title: "Moza Browser",
  });

  mainWindow.loadFile(path.join(__dirname, "ui/app.html"));
  mainWindow.setMenu(null);

  mainWindow.on("page-title-updated", (e) => e.preventDefault());


}

ipcMain.on("confirm", (event, data) => {
  if (data === "yes") {
    confirmWindow.close();
    mainWindow.close()
    isQuitting = true;
    app.quit();
  } else if (confirmWindow) {
    confirmWindow.hide();
  }
});

ipcMain.on("port", (event, data) => {
  if (!mainWindow) return;

  switch (data) {
    case "exit":
      createConfirmWindow();


      break;
    case "minimize":
      mainWindow.minimize();
      break;
    case "maximize":
      if (mainWindow.isMaximized()) mainWindow.unmaximize();
      else mainWindow.maximize();
      break;
  }
});

app.whenReady().then(() => {
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});