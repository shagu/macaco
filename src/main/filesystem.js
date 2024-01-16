const fs = require('fs')
const path = require('path')

const shared = require('./shared.js')
const downloader = require('./downloader.js')

const jimp = require('jimp')

class Filesystem {
  async filename (card) {
    let suffix = `${card.edition}.${card.number}.${card.language}`
    suffix = card.foil ? `${suffix}.f` : suffix

    let count = 1
    let filename = `[${suffix}](${count}).jpg`

    while (fs.existsSync(path.join(card.collection, card.folder, filename))) {
      /* keep current filename if existing and matching */
      if (card.fsurl && card.fsurl === path.join(card.collection, card.folder, filename)) break

      /* try next available filename */
      filename = `[${suffix}](${count}).jpg`
      count++
    }

    // generate new fsurl filename
    const fsurl = path.join(card.collection, card.folder, filename)

    return [filename, fsurl]
  }

  async backside () {
    const backgroundDev = path.join(__dirname, '..', '..', 'assets', 'cards', 'background.jpg')
    const backgroundProd = path.join(process.resourcesPath, '..', '..', 'assets', 'cards', 'foil.jpg')
    const image = fs.existsSync(backgroundDev) ? backgroundDev : backgroundProd
    return image
  }

  async image (card, preview) {
    // do not go into previews without metadata
    if (preview && Object.keys(card.metadata).length === 0) {
      return this.backside()
    }

    const fileHQ = path.join(shared.userdir, 'images', `full_[${card.edition}.${card.number}.${card.language}${card.foil ? '.f' : ''}].jpg`)
    if (fs.existsSync(fileHQ)) return fileHQ

    const file = path.join(shared.userdir, 'images', `${preview ? 'preview' : 'full'}_[${card.edition}.${card.number}.${card.language}${card.foil ? '.f' : ''}].jpg`)
    if (fs.existsSync(file)) return file

    const [artwork] = await this.artwork(card, preview)

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

  async artwork (card, preview, fallback) {
    const fileHQ = path.join(shared.userdir, 'images', `full_[${card.edition}.${card.number}.${card.language}].jpg`)
    if (fs.existsSync(fileHQ)) return [fileHQ, fallback]

    const file = path.join(shared.userdir, 'images', `${preview ? 'preview' : 'full'}_[${card.edition}.${card.number}.${card.language}].jpg`)
    if (fs.existsSync(file)) return [file, fallback]

    const name = card.metadata ? card.metadata.name : false
    const identifier = `${card.edition}.${card.number}.${card.language}`.toUpperCase()

    const notifier = (status, size, downloaded, file, url, real, queue) => {
      const percent = size > 0 ? (100.0 * downloaded / size).toFixed() : 0

      const output = {
        title: name ? `${name} [${identifier}]` : identifier,
        text: `${shared.unit(downloaded)} of ${shared.unit(size)} (${percent}%)`,
        percent
      }

      if (fallback) { output.title = `${output.title} (english)` }

      if (queue && queue.tasks && queue.tasks.length > 1) { output.title = `[${queue.tasks.length}] ${output.title}` }

      if (status === -1) {
        output.text = `${output.text} [ERR]`
      } else if (percent === 0) {
        output.text = 'Connecting...'
      }

      shared.window.webContents.send('set-popup', 'artwork-download', output.title, output.text, output.percent)
    }

    let language = fallback ? 'en' : card.language

    // scryfall locales are different to the printed ones
    language = language === 'sp' ? 'es' : language
    language = language === 'jp' ? 'ja' : language
    language = language === 'kr' ? 'ko' : language
    language = language === 'cs' ? 'zhs' : language
    language = language === 'ct' ? 'zht' : language

    const size = preview ? 'small' : 'border_crop'
    const url = `https://api.scryfall.com/cards/${card.edition}/${card.number}/${language}?format=image&version=${size}`
    console.log(`fetch ${fallback ? 'fallback' : 'normal'} of ${card.number}\n  ${url}`)

    await downloader.queue(
      url, file, notifier, false, preview ? 'scryfall_preview' : 'scryfall_image'
    )

    if (fs.existsSync(file)) { return [file, fallback] }

    if (!fallback) {
      console.log('try fallback')
      const [fallbackFile, fallbackState] = await this.artwork(card, preview, true)
      return [fallbackFile, fallbackState]
    }

    return [await this.backside(), fallback]
  }

  async find (folder, base) {
    base = base || folder
    folder = path.join(folder.replace(base, '.'))

    const list = {}
    list[folder] = []

    for (const file of fs.readdirSync(path.join(base, folder))) {
      const fsurl = path.join(base, folder, file)
      const stat = fs.statSync(fsurl)

      // handle hidden files and folders
      if (file.length > 1 && file.startsWith('.')) {
        continue
      } else if (stat.isDirectory()) {
        const cards = await this.find(fsurl, base)
        Object.assign(list, cards)
        continue
      }

      // parse filenames and detect cards
      const parse = file.match(/(.*?) ?\[(.*)\]/i)
      if (parse && parse[2]) {
        const name = parse[1] === '' ? 'Unknown' : parse[1]
        const meta = parse[2].split('.')

        // don't proceed on invalid files'
        if (!meta[0] || !meta[1] || !meta[2]) { continue }

        // push card data
        list[folder].push({
          name: name.replaceAll('|', '/'),

          edition: meta[0],
          number: meta[1],
          language: meta[2],
          foil: meta[3] !== undefined,

          collection: base,
          folder,
          file,

          fsurl
        })
      }
    }

    return list
  }

  async write (card, keepImage) {
    /* get the preferred filename for the card */
    const [, fsurl] = await this.filename(card)

    /* create required directories */
    fs.mkdirSync(path.dirname(fsurl), { recursive: true })

    /* check if the card is an existing one */
    if (card.fsurl && fs.existsSync(card.fsurl)) {
      /* move the card to a new location/filename */
      const image = keepImage ? card.fsurl : await this.image(card)
      fs.renameSync(image, fsurl)
    } else if (card.image) {
      /* write imagedata from json object to fsurl */
      const fd = fs.openSync(fsurl, 'a')
      fs.writeSync(fd, card.image)
      fs.closeSync(fd)

      delete card.image
    } else {
      /* create a new card on the new location/filename */
      const image = await this.image(card)
      fs.copyFileSync(image, fsurl)
    }

    // update card file data
    card.fsurl = fsurl
    return card
  }

  async mkdir (collection, folder) {
    fs.mkdirSync(path.join(collection, folder), { recursive: true })
  }
}

module.exports = new Filesystem()
