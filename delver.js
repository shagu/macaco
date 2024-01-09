const fs = require('fs')
const path = require('path')
const Jszip = require('jszip')
const Sqlite3 = require('better-sqlite3')

const queryAttach = `ATTACH DATABASE '${path.join(core.dataDirectory, 'db', 'delverlens.sqlite')}' AS delver;`
const queryCards = 'SELECT * FROM backup_cards;'
const queryCardsSum = 'SELECT COUNT(*) AS count FROM backup_cards;'
const queryView = `
  CREATE TEMP VIEW backup_cards AS
    SELECT
      cards.image AS image,
      cards.foil AS foil,
      cards.language AS language,
      delver_cards.number AS number,
      delver_editions.tl_abb AS edition,
      backup_lists.name AS list
    FROM cards
      LEFT JOIN lists AS backup_lists ON cards.list = backup_lists._id
      LEFT JOIN delver.cards AS delver_cards ON cards.card = delver_cards._id
      LEFT JOIN delver.editions AS delver_editions ON delver_cards.edition = delver_editions._id;
`

const languageMap = {
  English: 'en',
  German: 'de'
}

const notify = (status) => {
  const current = core.utils.byteUnits(status.current)
  const maxsize = core.utils.byteUnits(status.size)
  const caption = `${status.url}<br>${current} of ${maxsize} (${status.percent}%)`
  core.utils.popup('DelverLens Metadata', caption, status.percent / 100)
}

const delver = {
  /* unpack the card-association sqlite file from the delver APK file */
  unpackApk: async () => {
    // show popup
    core.utils.popup('DelverLens Metadata', 'Unpacking APK', null)

    const extractor = new Jszip()
    const apk = fs.readFileSync(path.join(core.dataDirectory, 'db', 'delverlens.apk'))
    const result = await extractor.loadAsync(apk)
    const output = path.join(core.dataDirectory, 'db', 'delverlens.sqlite')
    const data = result.files['res/Cc.db'].async('arraybuffer')

    fs.writeFileSync(output, Buffer.from(await data))

    // hide popup
    core.utils.popup('DelverLens Metadata', 'Unpacking APK', 1)
  },

  /* fetch and unpack latest delver APK file */
  setupMetadata: async (force) => {
    if (delver.prepare) {
      return delver.prepare
    } else {
      delver.prepare = new Promise(async (resolve, reject) => {
        // fetch delver apk if required
        await core.fetcher.queue(
          'https://delver-public.s3.us-west-1.amazonaws.com/app-release.apk',
          path.join(core.dataDirectory, 'db', 'delverlens.apk'),
          notify, false, 'delver-apk-fetch'
        )

        await delver.unpackApk()
        delver.prepare = null
        resolve(true)
      })

      return delver.prepare
    }
  },

  /* import cards */
  importBackup: async (backupFile, currentPath) => {
    core.utils.popup('Import DelverLens Backup', backupFile, null)

    // check for metadata
    await delver.setupMetadata()

    // open and prepare backup database
    const backup = new Sqlite3(backupFile)
    backup.prepare(queryAttach).run()
    backup.prepare(queryView).run()

    // get statistics for popup notifier
    const sum = backup.prepare(queryCardsSum).get().count
    let count = 0

    // read through all results in merged backup table
    const result = backup.prepare(queryCards).all()
    for (const row of result) {
      const card = {
        image: row.image,
        foil: row.foil !== 0,
        language: row.language === '' || !languageMap[row.language] ? languageMap.English : languageMap[row.language],
        set: row.edition,
        number: row.number,
        path: path.join(currentPath, row.list.replaceAll('/', '-'))
      }

      count++
      const percent = Math.ceil(count / sum * 100)
      const caption = `${backupFile}<br>${count}/${sum} (${percent}%)`
      core.utils.popup('Import DelverLens Backup', caption, percent)

      await core.collection.addCard(card)
    }

    backup.close()
    await core.collection.reload()
  }
}

// attach self to several download events
core.electron.ipcMain.handle('import-backup', async (event, currentPath) => {
  const dialogOptions = {
    properties: ['openFile'],
    filters: [
      { name: 'DelverLens Backup Files', extensions: ['dlens.bin', 'dlens', 'sqlite'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  }

  const file = await core.electron.dialog.showOpenDialog(dialogOptions)
  if (file.filePaths && !file.canceled) {
    delver.importBackup(file.filePaths[0], currentPath)
  }
})

module.exports = delver
