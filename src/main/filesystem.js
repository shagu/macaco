const fs = require('fs')
const path = require('path')

const shared = require('./shared.js')
const downloader = require('./downloader.js')

const jimp = require('jimp')
const metadata = require('./metadata.js')

class Filesystem {
  constructor() {}

  find_cards(folder, base) {
    base = base || folder
    folder = folder.replace(base, '.')

    const list = {}
    list[folder] = []

    for (const file of fs.readdirSync(path.join(base, folder))) {
      const fsurl = path.join(base, folder, file)
      const stat = fs.statSync(fsurl)

      // handle hidden files and folders
      if (file.length > 1 && file.startsWith('.')) {
        continue
      } else if (stat.isDirectory()) {
        Object.assign(list, this.find_cards(fsurl, base))
        continue
      }

      // parse filenames and detect cards
      const parse = file.match(/(.*?) ?\[(.*)\]/i)
      if (parse && parse[2]) {
        let name = parse[1] === '' ? 'Unknown' : parse[1]
        const meta = parse[2].split('.')

        // don't proceed on invalid files'
        if (!meta[0] || !meta[1] || !meta[2])
          continue

        // push card data
        list[folder].push({
          name: name.replaceAll('|', '/'),

          edition: meta[0],
          number: meta[1],
          language: meta[2],
          foil: meta[3] !== undefined,

          folder: folder,
          file: file,

          fsurl: fsurl
        })
      }
    }

    return list
  }

  async get_backside() {
    const backgroundDev = path.join(__dirname, '..', '..', 'assets', 'cards', 'background.jpg')
    const backgroundProd = path.join(process.resourcesPath, '..', '..', 'assets', 'cards', 'foil.jpg')
    const image = fs.existsSync(backgroundDev) ? backgroundDev : backgroundProd
    return image
  }

  async get_image(card, preview) {
    // do not go into previews without metadata
    if(preview && Object.keys(card.metadata).length === 0) {
      return this.get_backside()
    }

    const fileHQ = path.join(shared.userdir, 'images', `full_[${card.edition}.${card.number}.${card.language}${card.foil ? '.f' : ''}].jpg`)
    if (fs.existsSync(fileHQ)) return fileHQ

    const file = path.join(shared.userdir, 'images', `${preview ? 'preview' : 'full'}_[${card.edition}.${card.number}.${card.language}${card.foil ? '.f' : ''}].jpg`)
    if (fs.existsSync(file)) return file

    const [ artwork, ] = await this.get_artwork(card, preview)

    if (card.foil) {
      const imgdata = await jimp.read(artwork)

      const foilDev = path.join(__dirname, '..', '..', 'assets', 'cards', 'foil.png')
      const foilProd = path.join(process.resourcesPath, '..', '..', 'assets', 'cards', 'foil.png')
      let foil = await jimp.read(fs.existsSync(foilDev) ? foilDev : foilProd)

      foil = foil.resize(imgdata.bitmap.width, imgdata.bitmap.height)

      imgdata.composite(foil, 0, 0, {
        mode: jimp.BLEND_SOURCE_OVER,
        opacityDest: 1,
        opacitySource: 0.4
      })

      await imgdata.writeAsync(file)
    } else if (artwork !== file) {
      fs.copyFileSync(artwork, file)
    }

    return file
  }


  async get_artwork(card, preview, fallback) {
    const fileHQ = path.join(shared.userdir, 'images', `full_[${card.edition}.${card.number}.${card.language}].jpg`)
    if (fs.existsSync(fileHQ)) return [ fileHQ, fallback ]

    const file = path.join(shared.userdir, 'images', `${preview ? 'preview' : 'full'}_[${card.edition}.${card.number}.${card.language}].jpg`)
    if (fs.existsSync(file)) return [ file, fallback ]

    const name = card.metadata ? card.metadata.name : false
    const identifier = `${card.edition}.${card.number}.${card.language}`.toUpperCase()

    const download_notifier = (status, size, downloaded, file, url, real_url, queue) => {
      const percent = size > 0 ? (100.0 * downloaded / size).toFixed() : 0

      const output = {
        title: name ? `${name} [${identifier}]` : identifier,
        text: `${shared.byteUnits(downloaded)} of ${shared.byteUnits(size)} (${percent}%)`,
        percent: percent,
      }

      if (fallback)
        output.title = `${output.title} (english)`

      if (queue && queue.tasks && queue.tasks.length > 1)
        output.title = `[${queue.tasks.length}] ${output.title}`

      if (status === -1) {
        output.text = `${output.text} [ERR]`
      } else if (percent === 0) {
        output.text = `Connecting...`
      }

      shared.window.webContents.send('set-popup', "artwork-download", output.title, output.text, output.percent)
    }

    const language = fallback ? 'en' : card.language
    const size = preview ? 'small' : 'border_crop'
    const url = `https://api.scryfall.com/cards/${card.edition}/${card.number}/${language}?format=image&version=${size}`
    console.log(`fetch ${fallback ? 'fallback' : 'normal'} of ${card.number}\n  ${url}`)

    await downloader.queue(
      url, file, download_notifier, false, preview ? 'scryfall_preview' : 'scryfall_image'
    )

    if (fs.existsSync(file))
      return [ file, fallback ]

    if (!fallback) {
      const [ fallback_file, fallback_state ] = await this.get_artwork(card, preview, true)
      return [ fallback_file, fallback_state ]
    }

    return [ await this.get_backside(), fallback ]
  }
}

module.exports = new Filesystem()
