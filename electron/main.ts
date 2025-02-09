import {
    app,
    BrowserWindow,
    BrowserWindowConstructorOptions,
    screen,
    globalShortcut,
} from 'electron';
import {join} from 'node:path'

app.commandLine.appendSwitch('remote-allow-origins', '*')
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

let mainWindow: BrowserWindow;
const createWindow = (show = true, title = 'main') => {
    const primaryDisplay = screen.getPrimaryDisplay()
    const {width, height} = primaryDisplay.size
    const config: BrowserWindowConstructorOptions = {
        width,
        height,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
            contextIsolation: false,
            preload: join(__dirname, 'preload.cjs')
        },
    };
    mainWindow = new BrowserWindow(config);
    if (process.argv.length === 3 && process.argv[2].includes('http://localhost')) {
        mainWindow.loadURL(process.argv[2])
    } else {
        mainWindow.loadFile(app.getAppPath() + '/dist/index.html');
    }
};

function registerGlobalKey() {
    globalShortcut.register('CommandOrControl+Shift+D', () => {
        if (mainWindow.webContents.isDevToolsOpened()) {
            mainWindow.webContents.closeDevTools()
        } else {
            mainWindow.webContents.openDevTools();
        }
    })

}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // 用户正在尝试运行第二个实例，我们需要让焦点指向我们的窗口
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            if (!mainWindow.isVisible()) {
                mainWindow.show();
            }
            mainWindow.focus();
        }
    });
    app.whenReady().then(() => {
        createWindow();
        registerGlobalKey();
    });
    app.on('window-all-closed', () => {
        globalShortcut.unregisterAll()
        if (process.platform !== 'darwin') {
            app.quit();
        } else {
            app.exit()
        }
    });
    app.on('quit', () => {
        globalShortcut.unregisterAll()
        if (process.platform !== 'darwin') {
            app.quit();
        } else {
            app.exit()
        }
    })

    app.on('activate', () => {
        if (mainWindow === null) {
            createWindow();
        }
    });
}
