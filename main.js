import { app, BrowserWindow, ipcMain, dialog} from "electron";
import log from "electron-log";
import path from "path";
import fs from "fs";

// --- LOGGING ---
log.initialize(); // wymagane w ESM

// --- USTAWIENIE KATALOGÓW ---
const base = path.join(app.getPath("appData"), "Moza");

app.setPath("crashDumps", path.join(base, "Logs", "Crashes"));
app.setPath("logs", path.join(base, "Logs"));
app.setPath("userData", path.join(base, "Data"));

// --- UPEWNIJ SIĘ, ŻE KATALOG LOGÓW ISTNIEJE ---
fs.mkdirSync(app.getPath("logs"), { recursive: true });

// --- USTAWIENIE ŚCIEŻKI DO PLIKU LOGÓW ---
log.transports.file.resolvePathFn = () =>
  path.join(app.getPath("logs"), "main.log");
// --- OKNO ---
function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      preload: path.resolve("./preload.js"),
      
    },
    icon: path.resolve("./icon.ico"),
    frame: false,
    title: "Moza Browser",
  });
  win.loadFile("./ui/app.html");
  win.on("page-title-updated", (event) => {
    event.preventDefault(); // blokuje zmianę tytułu
  });
  win.setMenu(null);
  win.on('close', (e) => {
    e.preventDefault(); // blokuje zamknięcie okna

    const choice = dialog.showMessageBoxSync(win, {
      type: 'question',
      buttons: ['Yes', 'No'],
      defaultId: 1,
      title: 'Confirmation',
      message: 'Are you sure you want to leave?'
    });

    if (choice === 0) {
      // Tak → zamknij
      win.destroy();
    }
  });


  log.info("Application started");
ipcMain.on('port', (event, data) => {
  log.info("Port data: " + data);
  switch (data) {
    case "exit":
      app.quit()
      break;
      case "minimize":
        win.minimize()
        break;
        case "maximize":
          if (win.isMaximized()) {
            win.unmaximize();
          }
          else {
            win.maximize();
          }
          break;

  }
});



}

// --- START APLIKACJI ---
app.whenReady().then(() => {
  log.info("Moza Browser ready");
  createWindow();
});

// --- ZAMYKANIE ---
app.on("window-all-closed", () => {
  log.info("Quitting Moza Browser");
  if (process.platform !== "darwin") app.quit();
});
