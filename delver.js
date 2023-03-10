const fs = require('fs')
const path = require('path')
const jszip = require('jszip')
const sqlite3 = require('better-sqlite3')

let query_attach = `ATTACH DATABASE '${path.join(core.data_directory, "db", "delverlens.sqlite")}' AS delver;`
let query_cards = `SELECT * FROM backup_cards;`
let query_cards_sum = `SELECT COUNT(*) AS count FROM backup_cards;`
let query_view = `
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

let language_map = {
  'English': 'en',
  'German': 'de',
}

let notify = (status) => {
  const current = core.utils.byte_units(status.current)
  const maxsize = core.utils.byte_units(status.size)
  const caption = `${status.url}<br>${current} of ${maxsize} (${status.percent}%)`
  core.utils.popup("DelverLens Metadata", caption, status.percent/100)
}

const delver = {
  /* unpack the card-association sqlite file from the delver APK file */
  unpack_apk: async () => {
    // show popup
    core.utils.popup("DelverLens Metadata", "Unpacking APK", null)

    const apk = fs.readFileSync(path.join(core.data_directory, "db", "delverlens.apk"))
    const extractor = new jszip()
    const result = await extractor.loadAsync(apk)
    const output = path.join(core.data_directory, "db", "delverlens.sqlite")
    const data = result.files['res/ut.db'].async('arraybuffer')

    fs.writeFileSync(output, Buffer.from(await data))

    // hide popup
    core.utils.popup("DelverLens Metadata", "Unpacking APK", 1)
  },

  /* fetch and unpack latest delver APK file */
  setup_metadata: async (force) => {
    if(delver.prepare) {
      return delver.prepare
    } else {
      delver.prepare = new Promise(async (resolve, reject) => {
        // fetch delver apk if required
        await core.fetcher.queue(
          "https://delver-public.s3.us-west-1.amazonaws.com/app-release.apk",
          path.join(core.data_directory, "db", "delverlens.apk"),
          notify, false, "delver-apk-fetch"
        )

        await delver.unpack_apk()
        delver.prepare = null
        resolve(true)
      })

      return delver.prepare
    }
  },

  /* import cards */
  import_backup: async (backup_file, current_path) => {
    core.utils.popup("Import DelverLens Backup", backup_file, null)

    // check for metadata
    await delver.setup_metadata()

    // open and prepare backup database
    const backup = new sqlite3(backup_file)
    backup.prepare(query_attach).run()
    backup.prepare(query_view).run()

    // get statistics for popup notifier
    let sum = backup.prepare(query_cards_sum).get().count
    let count = 0

    // read through all results in merged backup table
    const result = backup.prepare(query_cards).all()
    for(const row of result) {
      let card = {
        image: row.image,
        foil: row.foil == 0 ? false : true,
        language: row.language == '' || !language_map[row.language] ? language_map['English'] : language_map[row.language],
        set: row.edition,
        number: row.number,
        path: path.join(current_path, row.list.replaceAll('/', '-'))
      }

      count++
      const percent = Math.ceil(count / sum * 100)
      const caption = `backup_file<br>${count}/${sum} (${percent}%)`
      core.utils.popup("Import DelverLens Backup", caption, percent)

      await core.collection.add_card(card)
    }

    backup.close()
    await core.collection.reload()
  },
}

// attach self to several download events
core.electron.ipcMain.handle('import-backup', async (event, current_path) => {
  let dialog_options = {
    properties: ['openFile'],
    filters: [
      { name: 'DelverLens Backup Files', extensions: ['dlens.bin', 'dlens', 'sqlite'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  }

  let file = await core.electron.dialog.showOpenDialog(dialog_options)
  if (file.filePaths && !file.canceled) {
    delver.import_backup(file.filePaths[0], current_path)
  }
})

module.exports = delver
