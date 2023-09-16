const path = require('path')
const electron = require('electron')

const fs = require('fs')

const rootdir = path.join(__dirname, '..', '..')
const userdir = electron.app.getPath('userData')

const filesystem = require('./filesystem.js')
const metadata = require('./metadata.js')
const shared = require('./shared.js')

shared.userdir = userdir

electron.app.commandLine.appendSwitch('ignore-gpu-blacklist');
electron.app.commandLine.appendSwitch('disable-gpu');
electron.app.commandLine.appendSwitch('disable-gpu-compositing');

electron.app.whenReady().then(async () => {
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

  // setup content
  window.setMenu(null)
  window.loadFile(path.join(rootdir, 'src', 'renderer', 'window.html'))

  // debug console
  if (process.env.DEV) {
    const devtools = new electron.BrowserWindow()
    window.webContents.setDevToolsWebContents(devtools.webContents)
    window.webContents.openDevTools({ mode: 'detach' })
  }

  shared.window = window

  /* IPC */
  // custom minimize button
  electron.ipcMain.handle('window-minimize', () => {
    window.minimize()
  })

  // custom maximize button
  let maximized = false
  electron.ipcMain.handle('window-maximize', () => {
    maximized ? window.unmaximize() : window.maximize()
    maximized = !maximized
  })

  // custom close button
  electron.ipcMain.handle('window-close', () => {
    window.close()
  })

  // update darkmode when the system theme is updated
  let lastThemeChange = 0
  electron.nativeTheme.on('updated', () => {
    // skip everything if not enough time has passed since the last change
    // and set lastThemeChange to ignore all events within the next 10ms
    if (Date.now() < lastThemeChange) return
    lastThemeChange = Date.now() + 10

    // setting the themeSource to 'system' will not update to the current
    // system mode if the value wasn't set to 'dark' & 'light' before
    electron.nativeTheme.themeSource = 'dark'
    electron.nativeTheme.themeSource = 'light'

    // now we can reset back to 'system' in order to refresh current mode
    electron.nativeTheme.themeSource = 'system'
  })

  // handle file dialog requests
  electron.ipcMain.handle('set-collection', async (event, folder, ...args) => {
    if (!folder) {
      // show open dialog if folder is not set
      const result = await electron.dialog.showOpenDialog({
        properties: ['openDirectory', 'createDirectory']
      })

      if (!result.filePaths || result.canceled) return
      folder = result.filePaths[0]
    }

    // reload collection from filesystem
    const collection = filesystem.find_cards(folder)
    for(const [path, cards] of Object.entries(collection)) {
      for(const card of cards) {
        card.metadata = metadata.query(card)
      }
    }

    // set new collection path
    shared.collection_path = folder
    shared.collection = collection

    // notify frontend
    window.webContents.send('update-collection', shared.collection_path, shared.collection)
  })

  const updatePreview = async (event, card, ...args) => {
    /* skip empty or invalid card */
    if (!card || !card.edition || !card.number || !card.language) {
      card.metadata = false
      window.webContents.send('update-card-preview', card, card)
      return
    }

    // query data and send preview update event
    const qcard = structuredClone(card)
    card.metadata = metadata.query(card)
    card.preview = await filesystem.get_image(card, true)

    window.webContents.send('update-card-preview', card, qcard)
  }

  electron.ipcMain.handle('set-card-preview', updatePreview)

  const push_card = (card, file_url) => {
    if (file_url) {
      for (const [folder, contents] of Object.entries(shared.collection)) {
        for (let cardid in contents) {
          if (contents[cardid].fsurl === file_url) {
            contents[cardid] = card
            return
          }
        }
      }
    } else {
      shared.collection[card.folder].push(card)
    }
  }

  electron.ipcMain.handle('add-update-card', async (event, card, ...args) => {
    /* skip empty or invalid card */
    if (!card || !card.edition || !card.number || !card.language) return

    // cheatcode to download all card images of a set
    if (card.number === '*') {
      const qcard = structuredClone(card)

      for(const number of metadata.edition(qcard.edition)) {
        qcard.number = number
        filesystem.get_image(qcard)
      }

      return
    }

    let suffix = `${card.edition}.${card.number}.${card.language}`
    suffix = card.foil ? `${suffix}.f` : suffix

    const oldurl = card.fsurl

    window.webContents.send('set-popup', "add-card", oldurl ? "Update Card" : "Add Card", suffix, 0)

    /* get best possible image file path */
    card.metadata = metadata.query(card)
    window.webContents.send('set-popup', "add-card", oldurl ? "Update Card" : "Add Card", suffix, 25)
    const image = await filesystem.get_image(card)
    window.webContents.send('set-popup', "add-card", oldurl ? "Update Card" : "Add Card", suffix, 75)

    updatePreview(event, structuredClone(card))

    /* detect best filename */
    let count = 1
    let filename = `[${suffix}](${count}).jpg`

    while (fs.existsSync(path.join(shared.collection_path, card.folder, filename))) {
      /* keep current filename if existing and matching */
      if(card.fsurl && card.fsurl == path.join(shared.collection_path, card.folder, filename)) break

      /* try next available filename */
      filename = `[${suffix}](${count}).jpg`
      count++
    }

    // generate new fsurl filename
    const fsurl = path.join(shared.collection_path, card.folder, filename)

    // move old one to new location if it was an existing card
    if (card.fsurl && fs.existsSync(card.fsurl)) fs.renameSync(card.fsurl, fsurl)

    // write (copy) image to file
    if (fs.existsSync(image)) fs.copyFileSync(image, fsurl)

    // update card
    card.fsurl = fsurl

    // add card to collection without filesystem-scanning
    push_card(card, oldurl)

    // reload collection (TODO: highlight in frontend parameter)
    window.webContents.send('set-popup', "add-card", oldurl ? "Update Card" : "Add Card", suffix, 100)
    window.webContents.send('update-collection', shared.collection_path, shared.collection)

    const pcard = structuredClone(card)
    pcard.fsurl = undefined
    pcard.preview = image

    window.webContents.send('update-card-preview', pcard, pcard)
  })
})