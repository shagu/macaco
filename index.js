core = {
  path: require('path'),
  electron: require('electron'),
  utils: require('./utils.js')
}

// initialize when ui is ready
core.electron.app.whenReady().then(async () => {
  // create new window
  core.window = new core.electron.BrowserWindow({
    width: 1600, height: 920,
    minWidth: 640, minHeight: 480,

    frame: false,

    icon: core.path.join(__dirname, "icon.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: core.path.join(__dirname, 'ui', 'ipc.js')
    },
  })

  // setup content
  core.window.setMenu(null)
  core.window.loadFile(core.path.join(__dirname, 'ui', 'frontend.html'))

  // debug console
  if(process.env.DEV) {
    const devtools = new core.electron.BrowserWindow()
    core.window.webContents.setDevToolsWebContents(devtools.webContents)
    core.window.webContents.openDevTools({ mode: 'detach' })
  }

  // setup default vars
  core.data_directory = core.electron.app.getPath('userData')

  // import components
  core.fetcher    = require('./fetcher.js')
  core.delver     = require('./delver.js')
  core.metadata   = require('./metadata.js')
  core.collection = require('./collection.js')

  core.electron.ipcMain.handle('window-minimize', () => {
    core.window.minimize()
  })

  let maximized = false
  core.electron.ipcMain.handle('window-maximize', () => {
    maximized ? core.window.unmaximize() : core.window.maximize()
    maximized = !maximized
  })

  core.electron.ipcMain.handle('window-close', () => {
    core.window.close()
  })

  // pre-load database if existing
  core.metadata.setup_metadata()
})
