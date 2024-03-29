const path = require('path')
const electron = require('electron')

const shared = require('./shared.js')
const ipc = require('./ipc.js')

electron.app.whenReady().then(async () => {
  const rootdir = path.join(__dirname, '..', '..')
  const userdir = electron.app.getPath('userData')
  const window = new electron.BrowserWindow({
    width: 1600,
    height: 920,
    minWidth: 640,
    minHeight: 480,

    frame: false,
    icon: path.join(rootdir, 'icon.png'),

    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(rootdir, 'src', 'renderer', 'preload.js')
    }
  })

  // save reference
  shared.rootdir = rootdir
  shared.userdir = userdir
  shared.window = window

  // setup content
  window.setMenu(null)
  window.loadFile(path.join(rootdir, 'src', 'renderer', 'window.html'))

  // debug console
  if (process.env.DEV) {
    const devtools = new electron.BrowserWindow()
    window.webContents.setDevToolsWebContents(devtools.webContents)
    window.webContents.openDevTools({ mode: 'detach' })
  }

  // detect darkmode on system theme change
  let themeLock = false
  electron.nativeTheme.on('updated', () => {
    // ignore theme events during update
    if (themeLock) return

    // lock theme change events for 100ms
    themeLock = true
    setTimeout(() => { themeLock = false }, 100)

    // setting the themeSource to 'system' will not update to the current
    // system mode if the value wasn't set to 'dark' & 'light' before
    electron.nativeTheme.themeSource = 'dark'
    electron.nativeTheme.themeSource = 'light'

    // now we can reset back to 'system' in order to refresh current mode
    electron.nativeTheme.themeSource = 'system'
  })

  /* IPC */
  ipc.register()
})
