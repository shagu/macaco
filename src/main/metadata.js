const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
const jimp = require('jimp')

const shared = require('./shared.js')
const downloader = require('./downloader.js')

class Metadata {
  async fetch() {
    const fetch_data = downloader.queue(
      'https://github.com/shagu/macaco-data/releases/latest/download/macaco-data.json.gz',
      '/tmp/mtg-date.json.gz',
      undefined, true, 'metadata'
    )
  
    const fetch_locales = downloader.queue(
      'https://github.com/shagu/macaco-data/releases/latest/download/macaco-locales.json.gz',
      '/tmp/mtg-locales.json.gz',
      undefined, true, 'metadata'
    )
  
    await Promise.all([fetch_locales, fetch_data])

    this.reload()
  }

  reload() {
    if(!shared.userdir) return false

    const data = path.join(shared.userdir, 'db', 'macaco-data.json.gz')
    const locales = path.join(shared.userdir, 'db', 'macaco-locales.json.gz')

    if(!fs.existsSync(data) || !fs.existsSync(locales)) {
      this.fetch()
    }
    
    const rawdata = fs.readFileSync(data)
    this.data = JSON.parse(zlib.gunzipSync(rawdata))

    const rawlocales = fs.readFileSync(locales)
    this.locales = JSON.parse(zlib.gunzipSync(rawlocales))

    return true
  }

  initialized() {
    if(!this.data || !this.locales) {
      if(!this.reload()) return false
    }

    return true
  }

  edition(edition) {
    if (!this.initialized()) return []

    if (!this.data[edition.toUpperCase()]) return []

    const numbers = []
    for(const [number, card] of Object.entries(this.data[edition.toUpperCase()])) {
      numbers.push(number)
    }

    return numbers
  }

  query(card) {
    if (!this.initialized()) return {}

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
        for (const entry of ["name", "text", "type", "flavor"]) {
          const pointer = parseInt(data.locales[language][entry])

          if (pointer !== undefined && locale[language][entry][pointer]) {
            metadata.locales[language][entry] = `${locale[language][entry][pointer]}`
          } else {
            delete metadata.locales[language][entry]
          }
        }
      }

      return metadata
    } else {
      return {}
    }
  }
}

module.exports = new Metadata()
