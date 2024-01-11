const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const shared = require('./shared.js')
const downloader = require('./downloader.js')

const languages = {
  'Ancient Greek': 'grc',
  'Arabic': 'ar',
  'Chinese Simplified': 'cs',
  'Chinese Traditional': 'ct',
  'English': 'en',
  'French': 'fr',
  'German': 'de',
  'Hebrew': 'he',
  'Italian': 'it',
  'Japanese': 'jp',
  'Korean': 'kr',
  'Latin': 'la',
  'Phyrexian': 'ph',
  'Portuguese (Brazil)': 'pt',
  'Russian': 'ru',
  'Sanskrit': 'sa',
  'Spanish': 'sp',
}

class Metadata {
  runner = false

  async reload(force) {
    const data = path.join(shared.userdir, 'db', 'macaco-data.json.gz')
    const locales = path.join(shared.userdir, 'db', 'macaco-locales.json.gz')

    // fetch metadata if not existing
    if(force || !fs.existsSync(data) || !fs.existsSync(locales)) {
      const fetch_data = downloader.queue(
        'https://github.com/shagu/macaco-data/releases/latest/download/macaco-data.json.gz',
        path.join(shared.userdir, 'db', 'macaco-data.json.gz'),
        undefined, true, 'metadata'
      )

      const fetch_locales = downloader.queue(
        'https://github.com/shagu/macaco-data/releases/latest/download/macaco-locales.json.gz',
        path.join(shared.userdir, 'db', 'macaco-locales.json.gz'),
        undefined, true, 'metadata'
      )

      await Promise.all([fetch_locales, fetch_data])
    }

    const rawdata = fs.readFileSync(data)
    this.data = JSON.parse(zlib.gunzipSync(rawdata))

    const rawlocales = fs.readFileSync(locales)
    this.locales = JSON.parse(zlib.gunzipSync(rawlocales))
  }

  async initialized() {
    if(!this.data || !this.locales) {
      if(!this.runner) this.runner = this.reload()
      await this.runner
    }
  }

  async edition(edition) {
    await this.initialized()

    if (!this.data[edition.toUpperCase()]) return []

    const numbers = []
    for(const [number, card] of Object.entries(this.data[edition.toUpperCase()])) {
      numbers.push(number)
    }

    return numbers
  }

  async query(card) {
    await this.initialized()

    const edition = card.edition ? card.edition.toUpperCase() : 'Unknown'
    const number = card.number ? card.number.toString().toUpperCase() : 'Unknown'

    if (this.data && this.data[edition] && this.data[edition][number]) {
      // shortcuts to access internal databases
      const data = this.data[edition][number] || { name: "Unknown" }
      const locale = this.locales[data.name]

      // deep copy the dabase's metadata to a new metadata object
      const metadata = structuredClone(data)

      // replace pointers with locale strings
      for (const language in data.locales) {
        const short = languages[language]

        for (const entry of ["name", "text", "type", "flavor"]) {
          const pointer = parseInt(data.locales[language][entry])

          if (pointer !== undefined && locale[language][entry][pointer]) {
            metadata.locales[short] = metadata.locales[short] || {}
            metadata.locales[short][entry] = `${locale[language][entry][pointer]}`
          }
        }

        delete metadata.locales[language]
      }

      // add best price shortcut
      metadata.price = 0
      if (metadata.prices) {
        metadata.price = metadata.prices[2] || metadata.prices[0]
        if (data.foil) metadata.price = metadata.prices[3] || metadata.prices[1]
      }

      return metadata
    } else {
      return {}
    }
  }
}

module.exports = new Metadata()
