const fs = require('fs')
const path = require('path')

const collection = {
  data: { },
  library: { },

  addCard: async (card) => {
    await core.metadata.updateCard(card)

    let suffix = `${card.set}.${card.number}.${card.language}`
    suffix = card.foil ? `${suffix}.f` : suffix

    let count = 1
    let filename = `[${suffix}](${count}).jpg`

    while (fs.existsSync(path.join(core.folder, card.path, filename))) {
      filename = `[${suffix}](${count}).jpg`
      count++
    }

    fs.mkdirSync(path.join(core.folder, card.path), { recursive: true })
    card.file = path.join(core.folder, card.path, filename)

    // fetch and/or write image to file
    if (card.currentFile) {
      fs.renameSync(card.currentFile, card.file)
      card.currentFile = card.file
    } else {
      const fd = fs.openSync(card.file, 'a')
      if (card.image) fs.writeSync(fd, card.image)
      fs.closeSync(fd)
    }

    if (!card.image) {
      await core.metadata.getImage(card)
    }

    core.window.webContents.send('add-card-update', card)
  },

  moveCard: async (card, dest) => {
    if (!card || !card.set || !card.number || !card.language || !card.file) { return }

    if (!fs.existsSync(card.file) || !fs.existsSync(path.join(core.folder, dest))) { return }

    const oldFile = card.file
    let suffix = `${card.set}.${card.number}.${card.language}`
    suffix = card.foil ? `${suffix}.f` : suffix

    let count = 1
    let filename = `[${suffix}](${count}).jpg`

    while (fs.existsSync(path.join(core.folder, dest, filename))) {
      filename = `[${suffix}](${count}).jpg`
      count++
    }

    fs.renameSync(oldFile, path.join(core.folder, dest, filename))
  },

  countCards: async () => {
    for (const [, cards] of Object.entries(collection.library)) {
      const duplicates = {}

      // build duplicate arrays
      for (const card of cards) {
        const identifier = `[${card.set}.${card.number}.${card.language}${card.foil ? '.f' : ''}]`
        duplicates[identifier] = duplicates[identifier] || []
        duplicates[identifier].push(card)
      }

      // set all count values
      for (const [, cards] of Object.entries(duplicates)) {
        for (const card of cards) {
          card.count = cards.length
        }
      }
    }
  },

  scanCards: async (folder = '.') => {
    // abort if nothing was opened yet
    if (!core.folder) return

    // create root if not existing
    if (!collection.library[folder]) collection.library[folder] = []

    const tree = fs.readdirSync(path.join(core.folder, folder))

    for (const file of tree) {
      const filename = path.join(folder, file)
      const inode = path.join(core.folder, filename)
      const stat = fs.statSync(inode)

      if (file.length > 1 && file.startsWith('.')) {
        // ignore dotfiles
      } else if (stat.isDirectory()) {
        // scan subdirectories
        await collection.scanCards(filename)
      } else {
        // parse files
        const parse = file.match(/(.*?) ?\[(.*)\]/i)
        if (parse && parse[2]) {
          let name = parse[1] === '' ? 'Unknown' : parse[1]
          const meta = parse[2].split('.')

          // don't proceed on invalid files'
          if (!meta[0] || !meta[1] || !meta[2]) continue

          name = name.replaceAll('|', '/')

          // build card
          const card = {
            name,
            set: meta[0],
            number: meta[1],
            language: meta[2],
            foil: meta[3] !== undefined,
            file: path.join(core.folder, filename),
            path: folder
          }

          // add card to folder
          collection.library[folder].push(card)
        }
      }
    }
  },

  reloadMetadata: async (withProgress) => {
    let num = 0
    for (const [, content] of Object.entries(collection.library)) {
      num += content.length
    }

    let current = 0
    for (const [folder, cards] of Object.entries(collection.library)) {
      for (const card of cards) {
        // add extended metadata to card
        await core.metadata.updateCard(card)

        if (withProgress) {
          current++
          const percent = current / num
          const caption = `${folder}<br/>${current} of ${num} (${(percent * 100).toFixed()}%)`
          core.utils.popup('Open Collection Folder', caption, percent)
        }
      }
    }
  },

  open: async (folder) => {
    core.folder = folder

    core.utils.popup('Open Collection Folder', 'Waiting for metadata...', null)
    await core.metadata.setupMetadata()
    core.utils.popup('Open Collection Folder', folder, null)
    await collection.reload(true)
    core.utils.popup('Open Collection Folder', folder, 1)
    core.window.setTitle(`Macaco - ${folder}`)
  },

  reload: async (withProgress) => {
    collection.library = {}
    await collection.scanCards()
    await collection.countCards()
    await collection.reloadMetadata(withProgress)
    core.window.webContents.send('update-collection', collection.library)
  }
}

core.electron.ipcMain.handle('load-card', async (event, card) => {
  let suffix = `${card.set}.${card.number}.${card.language}`
  suffix = card.foil ? `${suffix}.f` : suffix

  card.file = path.join(core.dataDirectory, 'images', `preview_[${suffix}].jpg`)
  await core.metadata.updateCard(card)

  if (!card.unknown && !fs.existsSync(card.file)) {
    await core.metadata.getImage(card, true)
  }

  core.window.webContents.send('add-card-update', card)
})

core.electron.ipcMain.handle('new-folder', async (event, folder) => {
  if (!core.folder) return
  fs.mkdirSync(path.join(core.folder, folder), { recursive: true })
  await collection.reload()
})

core.electron.ipcMain.handle('add-card', async (event, card) => {
  await collection.addCard(card)
  await collection.reload()
})

core.electron.ipcMain.handle('move-card', async (event, card, dest) => {
  await collection.moveCard(card, dest)
  await collection.reload()
})

// update metadata
core.electron.ipcMain.handle('download-metadata', async (event, ...args) => {
  await core.metadata.setupMetadata(true)
  await collection.reload()
})

// attach to ui-button
core.electron.ipcMain.handle('open-folder', async (event, ...args) => {
  // show file dialog
  const result = await core.electron.dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory']
  })

  // open selected folder
  if (result.filePaths && !result.canceled) { await collection.open(result.filePaths[0]) }

  collection.reload()
})

// load local database on boot
core.electron.ipcMain.handle('dom-loaded', async (event, ...args) => {
  await core.metadata.setupMetadata()
})

module.exports = collection
