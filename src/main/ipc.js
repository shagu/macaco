const electron = require('electron')
const shared = require('./shared.js')
const collection = require('./collection.js')

let maximized = false

class Ipc {
  async windowMinimize () {
    shared.window.minimize()
  }

  async windowMaximize () {
    maximized ? shared.window.unmaximize() : shared.window.maximize()
    maximized = !maximized
  }

  async windowClose () {
    shared.window.close()
  }

  async setCollection(event, folder, ...args) {
    if (!folder) {
      // show open dialog if folder is not set
      const result = await this.electron.dialog.showOpenDialog({
        properties: ['openDirectory', 'createDirectory']
      })

      if (!result.filePaths || result.canceled) return
      folder = result.filePaths[0]
    }

    // reload collection
    await collection.set(folder)

    // notify frontend
    shared.window.webContents.send('update-collection', collection.folder, collection.collection)
  }

  async setCardPreview(event, card, ...args) {
    // get preview card and send back to frontend
    const preview = await collection.preview(card)
    shared.window.webContents.send('update-card-preview', card, preview)
  }

  async setCardFolder(event, card, folder, ...args) {
    // convert to array if a single card is found
    const cards = Array.isArray(card) ? card : [ card ]

    // move collection cards
    for(const card of cards) {
      card.folder = folder
      await collection.write(card)
    }

    // notify frontend about collection changes
    shared.window.webContents.send('update-collection', collection.folder, collection.collection)
  }

  async addUpdateCard(event, card, ...args) {
    // skip empty or invalid card
    if (!card || !card.edition || !card.number || !card.language) return

    // add new card or update card in collection
    const newCard = await collection.write(card)

    // create card preview object
    const previewCard = structuredClone(newCard)
    previewCard.preview = card.fsurl
    previewCard.fsurl = undefined

    // send update events to frontend
    shared.window.webContents.send('update-collection', collection.folder, collection.collection)
    shared.window.webContents.send('update-card-preview', previewCard, previewCard)
  }

  register() {
    electron.ipcMain.handle('window-minimize', this.windowMinimize)
    electron.ipcMain.handle('window-maximize', this.windowMaximize)
    electron.ipcMain.handle('window-close', this.windowClose)

    electron.ipcMain.handle('set-collection', this.setCollection)
    electron.ipcMain.handle('set-card-preview', this.setCardPreview)
    electron.ipcMain.handle('set-card-folder', this.setCardFolder)
    electron.ipcMain.handle('add-update-card', this.addUpdateCard)
  }
}

module.exports = new Ipc()




