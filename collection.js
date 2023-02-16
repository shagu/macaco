const fs = require('fs')
const path = require('path')

const collection = {
  data: { },
  library: { },

  add_card: async (card) => {
    await core.metadata.update_card(card)

    let suffix = `${card.set}.${card.number}.${card.language}`
    suffix = card.foil ? `${suffix}.f` : suffix

    let count = 1
    let filename = `[${suffix}](${count}).jpg`

    while(fs.existsSync(path.join(core.folder, card.path, filename))) {
      filename = `[${suffix}](${count}).jpg`
      count++
    }

    fs.mkdirSync(path.join(core.folder, card.path), { recursive: true })
    card.file = path.join(core.folder, card.path, filename)

    // fetch and/or write image to file
    if(card.current_file) {
      fs.renameSync(card.current_file, card.file)
      card.current_file = card.file
    } else {
      let fd = fs.openSync(card.file, 'a')
      if(card.image) fs.writeSync(fd, card.image)
      fs.closeSync(fd)
    }

    if(!card.image) {
      await core.metadata.get_image(card)
    }

    core.window.webContents.send('add-card-update', card)
  },

  move_card: async (card, dest) => {
    if(!card || !card.set || !card.number || !card.language || !card.file)
      return

    if(!fs.existsSync(card.file) || !fs.existsSync(path.join(core.folder, dest)))
      return

    const old_file = card.file
    let suffix = `${card.set}.${card.number}.${card.language}`
    suffix = card.foil ? `${suffix}.f` : suffix

    let count = 1
    let filename = `[${suffix}](${count}).jpg`

    while(fs.existsSync(path.join(core.folder, dest, filename))) {
      filename = `[${suffix}](${count}).jpg`
      count++
    }

    fs.renameSync(old_file, path.join(core.folder, dest, filename))
  },

  scan_cards: async (folder = ".") => {
    // abort if nothing was opened yet
    if(!core.folder) return

    // create root if not existing
    if(!collection.library[folder]) collection.library[folder] = []

    const tree = fs.readdirSync(path.join(core.folder, folder))

    for(const file of tree) {
      let filename = path.join(folder, file)
      let inode = path.join(core.folder, filename)
      let stat = fs.statSync(inode)

      if(file.length > 1 && file.startsWith(".")) {
        // ignore dotfiles
      } else if (stat.isDirectory()) {
        // scan subdirectories
        await collection.scan_cards(filename)
      } else {
        // parse files
        let parse = file.match(/(.*?) ?\[(.*)\]/i)
        if (parse && parse[2]) {
          let name = parse[1] == '' ? 'Unknown' : parse[1]
          let meta = parse[2].split(".")

          // don't proceed on invalid files'
          if(!meta[0] || !meta[1] || !meta[2]) continue

          name = name.replaceAll('|', '/')

          // build card
          let card = {
            name: name,
            set: meta[0],
            number: meta[1],
            language: meta[2],
            foil: meta[3] === undefined ? false : true,
            file: path.join(core.folder, filename),
            path: folder
          }

          // add card to folder
          collection.library[folder].push(card)

          // update card counts
          const count = collection.library[folder].filter((e) => e.set === card.set && e.number === card.number && e.foil === card.foil).length
          for(const element of collection.library[folder]) {
            if (element.set === card.set && element.number === card.number && element.foil === card.foil) {
              element.count = count
            }
          }
        }
      }
    }
  },

  reload_metadata: async (with_progress) => {
    let num = 0
    for (const [folder, content] of Object.entries(collection.library)) {
      num += content.length
    }

    let current = 0
    for (const [folder, cards] of Object.entries(collection.library)) {
      for (card of cards) {
          // add extended metadata to card
          await core.metadata.update_card(card)

          if (with_progress) {
            current++
            const percent = current / num
            const caption = `${folder}<br/>${current} of ${num} (${(percent*100).toFixed()}%)`
            core.utils.popup("Open Collection Folder", caption, percent)
          }
      }
    }
  },

  open: async (folder) => {
    core.folder = folder

    core.utils.popup("Open Collection Folder", "Waiting for metadata...", null)
    await core.metadata.setup_metadata()
    core.utils.popup("Open Collection Folder", folder, null)
    await collection.reload(true)
    core.utils.popup("Open Collection Folder", folder, 1)
    core.window.setTitle(`Macaco - ${folder}`)
  },

  reload: async (with_progress) => {
    collection.library = {}
    await collection.scan_cards()
    await collection.reload_metadata(with_progress)
    core.window.webContents.send('update-collection', collection.library)
  }
}

core.electron.ipcMain.handle('load-card', async (event, card) => {
  let suffix = `${card.set}.${card.number}.${card.language}`
  suffix = card.foil ? `${suffix}.f` : suffix

  card.file = path.join(core.data_directory, "images", `preview_[${suffix}].jpg`)

  if (!fs.existsSync(card.file)) {
    await core.metadata.get_image(card, true)
  }

  if (fs.existsSync(card.file)) {
    await core.metadata.update_card(card)
    core.window.webContents.send('add-card-update', card)
  } else {
    card.unknown = true
    core.window.webContents.send('add-card-update', card)
  }
})

core.electron.ipcMain.handle('new-folder', async (event, folder) => {
  if(!core.folder) return
  fs.mkdirSync(path.join(core.folder, folder), { recursive: true })
  await collection.reload()
})

core.electron.ipcMain.handle('add-card', async (event, card) => {
  await collection.add_card(card)
  await collection.reload()
})

core.electron.ipcMain.handle('move-card', async (event, card, dest) => {
  await collection.move_card(card, dest)
  await collection.reload()
})

// update metadata
core.electron.ipcMain.handle('download-metadata', async (event, ...args) => {
  await core.metadata.setup_metadata(true)
  await collection.reload()
})

// attach to ui-button
core.electron.ipcMain.handle('open-folder', async (event, ...args) => {
  // show file dialog
  let result = await core.electron.dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
  })

  // open selected folder
  if (result.filePaths && !result.canceled)
    await collection.open(result.filePaths[0])

  collection.reload()
})

// load local database on boot
core.electron.ipcMain.handle('dom-loaded', async (event, ...args) => {
  await core.metadata.setup_metadata()
})

module.exports = collection
