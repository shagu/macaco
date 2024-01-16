const fs = require('fs')
const path = require('path')

const Jszip = require('jszip')
const Sqlite3 = require('better-sqlite3')

const shared = require('./shared.js')
const downloader = require('./downloader.js')

class Delver {
  busy = null
  query = {}

  async queries () {
    this.query.attach = `
      ATTACH DATABASE '${path.join(shared.userdir, 'db', 'delverlens.sqlite')}' AS delver;
    `

    this.query.cards = `
      SELECT * FROM backup_cards;
    `

    this.query.view = `
      CREATE TEMP VIEW backup_cards AS
        SELECT
        cards.image AS image,
        cards.foil AS foil,
        cards.language AS language,
        cards.quantity AS count,
        delver_cards.number AS number,
        delver_editions.tl_abb AS edition,
        backup_lists.name AS list
      FROM cards
        LEFT JOIN lists AS backup_lists ON cards.list = backup_lists._id
        LEFT JOIN delver.cards AS delver_cards ON cards.card = delver_cards._id
        LEFT JOIN delver.editions AS delver_editions ON delver_cards.edition = delver_editions._id;
    `
  }

  /* fetch and unpack latest delver APK file */
  async prepare () {
    if (this.busy) {
      return this.busy
    } else {
      this.busy = new Promise(async (resolve, reject) => {
        // fetch delver apk if required
        await downloader.queue(
          'https://delver-public.s3.us-west-1.amazonaws.com/app-release.apk',
          path.join(shared.userdir, 'db', 'delverlens.apk'),
          undefined, false, 'metadata'
        )

        await this.unpack()
        await this.queries()

        this.busy = null
        resolve(true)
      })

      return this.busy
    }
  }

  /* unpack the card-association sqlite file from the delver APK file */
  async unpack () {
    const extractor = new Jszip()
    const apk = fs.readFileSync(path.join(shared.userdir, 'db', 'delverlens.apk'))
    const result = await extractor.loadAsync(apk)
    const output = path.join(shared.userdir, 'db', 'delverlens.sqlite')

    /* find database file in APK */
    let filename = false
    for (const [file] of Object.entries(result.files)) {
      const found = file.match(/res\/.?.?.db/)
      if (found) filename = found[0]
    }

    if (!filename) return

    const data = result.files[filename].async('arraybuffer')
    fs.writeFileSync(output, Buffer.from(await data))
  }

  async import (file) {
    // prepare all metadata
    await this.prepare()

    // open and prepare backup database
    const backup = new Sqlite3(file)
    backup.prepare(this.query.attach).run()
    backup.prepare(this.query.view).run()

    // initialize empty card array
    const cards = []

    // read through all results in merged backup table
    for (const row of backup.prepare(this.query.cards).all()) {
      // use fallback list name on empty list entries
      const folder = row.list || 'Unknown List'
      const amount = row.count || 1

      for (let i = 1; i <= amount; i++) {
        cards.push({
          edition: row.edition,
          number: row.number,
          foil: row.foil !== 0,
          language: row.language ? row.language : 'English',
          folder: folder.replaceAll('/', '-'),
          image: row.image
        })
      }
    }

    backup.close()
    return cards
  }
}

module.exports = new Delver()
