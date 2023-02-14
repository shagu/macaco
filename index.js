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

  // electron doesn't update its window to the system's shouldUseDarkColors
  // when the system colors get changed while the application is open.
  // so let's instead do it manually in an extremly awkward way:
  let last_theme_change = 0
  core.electron.nativeTheme.on('updated',  () => {
    // skip everything if not enough time has passed since the last change
    if(Date.now() < last_theme_change) return

    // set last_theme_change to ignore all events within the next 100ms
    // otherwise all the themeSource changes below would trigger it again..
    last_theme_change = Date.now() + 100

    // for some reason, the first change to 'dark' and 'light' doesn't change
    // anything in the electron window. So lets set both variants at least once
    // before the real mode is set later to the value from "shouldUseDarkColors".
    core.electron.nativeTheme.themeSource = 'dark'
    core.electron.nativeTheme.themeSource = 'light'

    // now we can reset back to 'system' in order to read 'shouldUseDarkColors'
    core.electron.nativeTheme.themeSource = 'system'

    // finally.. read the darkmode state and manually set electron accordingly
    if (core.electron.nativeTheme.shouldUseDarkColors === true) {
      core.electron.nativeTheme.themeSource = 'dark'
    } else {
      core.electron.nativeTheme.themeSource = 'light'
    }

    // great! these workarounds made it work.. i'm done here.. if you can do better, PR welcome.
    console.log(`Electron colors are now: ${core.electron.nativeTheme.themeSource}`)
  })
})