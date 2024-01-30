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

    this.query.sum = `
      SELECT COUNT(*) AS count FROM backup_cards;
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

  notifier (info) {
    const small = info.downloaded > 0 && `${shared.unit(info.downloaded)} of ${shared.unit(info.size)}`
    shared.popup('DelverLens Import', 'Download APK', small, info.percent)
  }

  /* fetch and unpack latest delver APK file */
  async update () {
    // fetch delver apk if required
    await downloader.queue(
      'https://delver-public.s3.us-west-1.amazonaws.com/app-release.apk',
      path.join(shared.userdir, 'db', 'delverlens.apk'),
      (info) => { this.notifier(info) }, false, 'metadata'
    )

    await this.unpack()
    await this.queries()
    this.busy = null
  }

  /* prepare delver requirements */
  async prepare () {
    if (!this.busy) {
      this.busy = this.update()
    }

    return this.busy
  }

  /* unpack the card-association sqlite file from the delver APK file */
  async unpack () {
    shared.popup('DelverLens Import', 'Unpacking Database')

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

    shared.popup('DelverLens Import', 'Reading Backup File')

    // open and prepare backup database
    const backup = new Sqlite3(file)
    backup.prepare(this.query.attach).run()
    backup.prepare(this.query.view).run()
    const sum = backup.prepare(this.query.sum).get().count
    let count = 0
    let percent = 0

    // initialize empty card array
    const cards = []

    // read through all results in merged backup table
    for (const row of backup.prepare(this.query.cards).all()) {
      // popup progress
      count = count + 1
      percent = (100.0 * count / sum).toFixed()
      shared.popup('DelverLens Import', 'Reading Backup File', `${count} of ${sum} Entries`, percent)

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
