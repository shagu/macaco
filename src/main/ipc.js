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

  async setCollection (event, folder, ...args) {
    if (!folder) {
      // show open dialog if folder is not set
      const result = await electron.dialog.showOpenDialog({
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

  async reloadCollection (event, ...args) {
    // reload collection
    await collection.set(collection.folder, true)

    // notify frontend
    shared.window.webContents.send('update-collection', collection.folder, collection.collection)
  }

  async setCardPreview (event, card, ...args) {
    // get preview card and send back to frontend
    const preview = await collection.preview(card)
    shared.window.webContents.send('update-card-preview', card, preview)
  }

  async setCardFolder (event, card, folder, ...args) {
    // convert to array if a single card is found
    const cards = Array.isArray(card) ? card : [card]

    // move collection cards
    for (const card of cards) {
      card.folder = folder
      await collection.write(card, true)
    }

    // notify frontend about collection changes
    shared.window.webContents.send('update-collection', collection.folder, collection.collection)
  }

  async deleteCard (event, card, ...args) {
    // convert to array if a single card is found
    const cards = Array.isArray(card) ? card : [card]

    // delete each card in list
    for (const card of cards) {
      await collection.delete(card)
    }

    // notify frontend about collection changes
    shared.window.webContents.send('update-collection', collection.folder, collection.collection)
  }

  async addUpdateCard (event, card, ...args) {
    // skip empty or invalid card
    if (!card || !card.edition || !card.number || !card.language) return

    // add new card or update card in collection
    const newCard = await collection.write(card)

    // create card preview object
    const previewCard = structuredClone(newCard)
    previewCard.preview = card.fsurl
    previewCard.fsurl = undefined

    // send update events to frontend
    shared.window.webContents.send('update-collection', collection.folder, collection.collection, [card.fsurl])
    shared.window.webContents.send('update-card-preview', previewCard, previewCard)
  }

  async createNewFolder (event, folder, ...args) {
    await collection.mkdir(folder)
    shared.window.webContents.send('update-collection', collection.folder, collection.collection, [folder])
  }

  async reloadMetadata (event, forced, ...args) {
    await collection.metadata(forced)
    shared.window.webContents.send('update-collection', collection.folder, collection.collection)
  }

  async importDelver (event, file, ...args) {
    if (!file) {
      // show open dialog if folder is not set
      const dialogOptions = {
        properties: ['openFile'],
        filters: [
          { name: 'DelverLens Backup Files', extensions: ['dlens.bin', 'dlens', 'sqlite'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      }

      const result = await await electron.dialog.showOpenDialog(dialogOptions)
      if (!result.filePaths || result.canceled) return
      file = result.filePaths[0]
    }

    // reload collection
    await collection.importDelver(file)

    // notify frontend
    shared.window.webContents.send('update-collection', collection.folder, collection.collection)
  }

  async importTextFile (event, folder) {
    // show open dialog if folder is not set
    const dialogOptions = {
      properties: ['openFile'],
      filters: [
        { name: 'Text File', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    }

    const result = await electron.dialog.showOpenDialog(dialogOptions)
    if (!result.filePaths || result.canceled) return
    const file = result.filePaths[0]

    // reload collection
    await collection.importTextFile(file, folder)

    // notify frontend
    shared.window.webContents.send('update-collection', collection.folder, collection.collection)
  }

  async exportTextFile (event, contents) {
    const result = await electron.dialog.showSaveDialog({
      filters: [{ name: 'Plain Text File', extensions: ['txt'] }]
    })

    if (!result.filePath || result.canceled) return

    await collection.exportTextFile(result.filePath, contents)
  }

  register () {
    electron.ipcMain.handle('window-minimize', this.windowMinimize)
    electron.ipcMain.handle('window-maximize', this.windowMaximize)
    electron.ipcMain.handle('window-close', this.windowClose)

    electron.ipcMain.handle('reload-metadata', this.reloadMetadata)
    electron.ipcMain.handle('import-delver', this.importDelver)

    electron.ipcMain.handle('set-collection', this.setCollection)
    electron.ipcMain.handle('reload-collection', this.reloadCollection)

    electron.ipcMain.handle('set-card-preview', this.setCardPreview)
    electron.ipcMain.handle('set-card-folder', this.setCardFolder)

    electron.ipcMain.handle('delete-card', this.deleteCard)
    electron.ipcMain.handle('add-update-card', this.addUpdateCard)
    electron.ipcMain.handle('create-new-folder', this.createNewFolder)

    electron.ipcMain.handle('import-textfile', this.importTextFile)
    electron.ipcMain.handle('export-textfile', this.exportTextFile)
  }
}

module.exports = new Ipc()
