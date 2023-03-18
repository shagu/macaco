core = {
  path: require('path'),
  electron: require('electron'),
  utils: require('./utils.js')
}

// initialize when ui is ready
core.electron.app.whenReady().then(async () => {
  // create new window
  core.window = new core.electron.BrowserWindow({
    width: 1600,
    height: 920,
    minWidth: 640,
    minHeight: 480,

    frame: false,

    icon: core.path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: core.path.join(__dirname, 'ui', 'ipc.js')
    }
  })

  // setup content
  core.window.setMenu(null)
  core.window.loadFile(core.path.join(__dirname, 'ui', 'frontend.html'))

  // debug console
  if (process.env.DEV) {
    const devtools = new core.electron.BrowserWindow()
    core.window.webContents.setDevToolsWebContents(devtools.webContents)
    core.window.webContents.openDevTools({ mode: 'detach' })
  }

  // setup default vars
  core.dataDirectory = core.electron.app.getPath('userData')

  // import components
  core.fetcher = require('./fetcher.js')
  core.delver = require('./delver.js')
  core.metadata = require('./metadata.js')
  core.collection = require('./collection.js')

  // custom minimize button
  core.electron.ipcMain.handle('window-minimize', () => {
    core.window.minimize()
  })

  // custom maximize button
  let maximized = false
  core.electron.ipcMain.handle('window-maximize', () => {
    maximized ? core.window.unmaximize() : core.window.maximize()
    maximized = !maximized
  })

  // custom close button
  core.electron.ipcMain.handle('window-close', () => {
    core.window.close()
  })

  // update darkmode when the system theme is updated
  let lastThemeChange = 0
  core.electron.nativeTheme.on('updated', () => {
    // skip everything if not enough time has passed since the last change
    // and set lastThemeChange to ignore all events within the next 10ms
    if (Date.now() < lastThemeChange) return
    lastThemeChange = Date.now() + 10

    // setting the themeSource to 'system' will not update to the current
    // system mode if the value wasn't set to 'dark' & 'light' before
    core.electron.nativeTheme.themeSource = 'dark'
    core.electron.nativeTheme.themeSource = 'light'

    // now we can reset back to 'system' in order to refresh current mode
    core.electron.nativeTheme.themeSource = 'system'
  })
})
