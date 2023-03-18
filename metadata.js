const fs = require('fs')
const path = require('path')
const jimp = require('jimp')
const zlib = require('zlib')

const dataFile = path.join(core.dataDirectory, 'db', 'macaco-data.json.gz')
const localesFile = path.join(core.dataDirectory, 'db', 'macaco-locales.json.gz')

const metadata = { }

metadata.fetchData = async (force) => {
  const notify = (status) => {
    const current = core.utils.byteUnits(status.current)
    const maxsize = core.utils.byteUnits(status.size)
    const caption = `${status.url}<br>${current} of ${maxsize} (${status.percent}%)`
    core.utils.popup('Macaco Card Data', caption, status.percent / 100)
  }

  if (!fs.existsSync(dataFile) || force) {
    console.log('Downloading', 'Macaco Card Data')
    await core.fetcher.queue(
      'https://github.com/shagu/macaco-data/releases/latest/download/macaco-data.json.gz',
      dataFile,
      notify, force, 'macaco-locales'
    )
  }
}

metadata.fetchLocales = async (force) => {
  const notify = (status) => {
    const current = core.utils.byteUnits(status.current)
    const maxsize = core.utils.byteUnits(status.size)
    const caption = `${status.url}<br>${current} of ${maxsize} (${status.percent}%)`
    core.utils.popup('Macaco Card Locales', caption, status.percent / 100)
  }

  if (!fs.existsSync(localesFile) || force) {
    console.log('Downloading', 'Macaco Card Locales')
    await core.fetcher.queue(
      'https://github.com/shagu/macaco-data/releases/latest/download/macaco-locales.json.gz',
      localesFile,
      notify, force, 'macaco-locales'
    )
  }
}

metadata.setupMetadata = async (force) => {
  if (metadata.prepare || (metadata.data && metadata.locales && !force)) {
    // if already initialized or preparing return here
    return metadata.prepare
  } else {
    // if uninitialized return a new promise that takes care of setting up things
    metadata.prepare = new Promise(async (resolve, reject) => {
      await Promise.all([metadata.fetchData(force), metadata.fetchLocales(force)])

      // load macaco-metadata
      core.utils.popup('Macaco Card Data', 'Reading File...', null)
      let rawdata = fs.readFileSync(dataFile)
      rawdata = zlib.gunzipSync(rawdata)
      metadata.data = JSON.parse(rawdata)
      core.utils.popup('Macaco Card Data', 'Complete!', 1)

      // load macaco-metadata
      core.utils.popup('Macaco Card Locales', 'Reading File...', null)
      let rawlocales = fs.readFileSync(localesFile)
      rawlocales = zlib.gunzipSync(rawlocales)
      metadata.locales = JSON.parse(rawlocales)
      core.utils.popup('Macaco Card Locales', 'Complete!', 1)

      metadata.prepare = null
      resolve(true)
    })

    return metadata.prepare
  }
}

metadata.updateCard = async (card) => {
  // make sure metadata database is initialized
  await metadata.setupMetadata()

  // flag as unknown
  card.unknown = true

  const edition = card.set ? card.set.toUpperCase() : 'Unknown'
  const number = card.number ? card.number.toString().toUpperCase() : 'Unknown'

  // check for existing metadata
  if (metadata.data && metadata.data[edition] && metadata.data[edition][number]) {
    // get card data from json file
    const jsoncard = metadata.data[edition][number]

    // attach all json data to card
    for (const entry in jsoncard) card[entry] = jsoncard[entry]

    // attach all available locales
    for (const language in jsoncard.locales) {
      const locale = metadata.locales[card.name][language]

      if (locale) {
        const nameId = card.locales[language].name
        const textId = card.locales[language].text
        const typeId = card.locales[language].type
        const flavorId = card.locales[language].flavor

        card.locales[language].name = locale.name[nameId] || locale.name[0]
        card.locales[language].text = locale.text[textId] || locale.text[0]
        card.locales[language].type = locale.type[typeId] || locale.type[0]
        card.locales[language].flavor = locale.flavor[flavorId] || locale.flavor[0]
      }
    }

    // remove unused datasets
    delete card.unknown
    delete card.uuid

    // obtain default price
    card.price = card.prices[2] || card.prices[0]
    if (card.foil) card.price = card.prices[3] || card.prices[1]
  }
}

metadata.getImage = async (card, preview) => {
  const notify = (status) => {
    if (preview) return
    const current = core.utils.byteUnits(status.current)
    const maxsize = core.utils.byteUnits(status.size)
    const caption = `${status.url}<br>${current} of ${maxsize} (${status.percent}%)`
    core.utils.popup(`Scryfall Download: ${card.set}:${card.number}`, caption, status.percent / 100)
  }

  const image = path.join(core.dataDirectory, 'images', `${preview ? 'preview' : 'full'}_[${card.set}.${card.number}.${card.language}${card.foil ? '.f' : ''}].jpg`)
  const fallback = path.join(core.dataDirectory, 'images', `${preview ? 'preview' : 'full'}_[${card.set}.${card.number}.en${card.foil ? '.f' : ''}].jpg`)

  // fetch image
  if (!card.unknown && !fs.existsSync(image)) {
    await core.fetcher.queue(
      `https://api.scryfall.com/cards/${card.set}/${card.number}/${card.language}?format=image&version=${preview ? 'small' : 'border_crop'}`,
      image,
      notify, false, 'mtgjson-cards'
    )

    // try to fetch english version as fallback
    if (!fs.existsSync(image) && !fs.existsSync(fallback)) {
      await core.fetcher.queue(
        `https://api.scryfall.com/cards/${card.set}/${card.number}/en?format=image&version=${preview ? 'small' : 'border_crop'}`,
        fallback,
        notify, false, 'mtgjson-cards-fallback'
      )
    }
  }

  // copy image to collection (or preview cache)
  if (fs.existsSync(image)) {
    fs.copyFileSync(image, card.file)
  } else if (fs.existsSync(fallback)) {
    fs.copyFileSync(fallback, card.file)
  } else if (!preview) {
    fs.copyFileSync(path.join('ui', 'img', 'card-background.jpg'), card.file)
  }

  // make foil
  if (card.foil === true && fs.existsSync(card.file)) {
    const image = await jimp.read(card.file)

    const foilDev = path.join(__dirname, 'foil.png')
    const foilProd = path.join(process.resourcesPath, 'foil.png')
    let foil = await jimp.read(fs.existsSync(foilDev) ? foilDev : foilProd)

    foil = foil.resize(image.bitmap.width, image.bitmap.height)

    image.composite(foil, 0, 0, {
      mode: jimp.BLEND_SOURCE_OVER,
      opacityDest: 1,
      opacitySource: 0.4
    })

    await image.writeAsync(card.file)
  }
}

module.exports = metadata
