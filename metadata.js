const fs = require('fs')
const path = require('path')
const jimp = require('jimp')
const zlib = require('zlib')

const { chain }  = require('stream-chain')
const { parser } = require('stream-json')
const { pick }   = require('stream-json/filters/Pick')
const { ignore } = require('stream-json/filters/Ignore')
const { streamValues } = require('stream-json/streamers/StreamValues')

const database_file = path.join(core.data_directory, "db", "database.json")
const printings_file = path.join(core.data_directory, "db", "mtgjson-printings.json.gz")
const prices_file = path.join(core.data_directory, "db", "mtgjson-prices.json.gz")

let language_map = {
  "Ancient Greek": ["grc"],
  "Arabic": ["ar"],
  "Chinese Simplified": [ "zhs", "cs" ],
  "Chinese Traditional": [ "zht", "ct" ],
  "English": [ "en" ],
  "French": ["fr"],
  "German": ["de"],
  "Hebrew": [ "he" ],
  "Italian": [ "it" ],
  "Japanese": [ "ja", "jp" ],
  "Korean": [ "ko", "kr" ],
  "Latin": [ "la" ],
  "Phyrexian": [ "ph" ],
  "Portuguese (Brazil)": [ "pt" ],
  "Russian": [ "ru" ],
  "Sanskrit": [ "sa" ],
  "Spanish": [ "es", "sp" ]
}

let get_language = (query) => {
  if (language_map[query]) {
    return { full: query, short: language_map[query][0] }
  }

  for (const [language, values] of Object.entries(language_map)) {
    for (const abrv of values) {
      if (abrv == query) {
        return { full: language, short: language_map[language][0] }
      }
    }
  }

  return { full: false, short: false }
}

let metadata = {
  build_database: (printings, prices) => {
    const database = {}

    core.utils.popup("Building Local Database", "Please wait ...", null)

    for (const set in printings) {
      for (const cardid in printings[set].cards) {
        const jsoncard = printings[set].cards[cardid]
        const number = jsoncard.number.toString().toUpperCase()

        // create entries if not existing
        if (!database[set]) database[set] = {}
        if (!database[set][number]) {
          database[set][number] = { locales: {} }
        }

        let card = database[set][number]

        { // assignments of jsoncard data to card object
          const assign = {
            name: "", type: "", text: "", flavor: "flavorText",
            artist: "", types: "", colors: "", rarity: "",
            manacost: "manaCost", manavalue: "manaValue",
            scryfall: "scryfallId", multiverse: "multiverseId",
            uuid: ""
          }

          // update card with assignments
          for ( const index in assign) {
            card[index] = jsoncard[assign[index] == "" ? index : assign[index]]
          }
        }

        { // locales
          for (const locale of jsoncard.foreignData) {
            const language = get_language(locale.language)
            if(language.short) {
              card.locales[language.short] = {
                name: locale.name,
                type: locale.type,
                text: locale.text,
                flavor: locale.flavor,
                multiverse: locale.multiverseId
              }
            }
          }
        }

        { // prices
          { // cardkingdom (normal)
            let index = prices[jsoncard.uuid]?.paper?.cardkingdom?.buylist?.normal
            if(index) card.price_normal_cardkingdom = index[Object.keys(index)[Object.keys(index).length - 1]]
          }

          { // cardkingdom (foil)
            let index = prices[jsoncard.uuid]?.paper?.cardkingdom?.buylist?.foil
            if(index) card.price_foil_cardkingdom = index[Object.keys(index)[Object.keys(index).length - 1]]
          }

          { // cardmarket (normal)
            let index = prices[jsoncard.uuid]?.paper?.cardmarket?.retail?.normal
            if(index) card.price_normal_cardmarket = index[Object.keys(index)[Object.keys(index).length - 1]]
          }

          { // cardmarket (foil)
            let index = prices[jsoncard.uuid]?.paper?.cardmarket?.retail?.foil
            if(index) card.price_foil_cardmarket = index[Object.keys(index)[Object.keys(index).length - 1]]
          }

          // free memory on already processed prices
          prices[jsoncard.uuid] = null
        }

        { // save to database
          database[set] = database[set] || {}
          database[set][number] = card
        }
      }
    }

    core.utils.popup("Building Local Database", "Writing File ...", null)

    printings = null
    prices = null

    fs.writeFileSync(database_file, JSON.stringify(database))

    core.utils.popup("Building Local Database", "Complete!", 1)
  },

  load_printings: (force) => {
    return new Promise(async (resolve, reject) => {
      let printings = {}

      let notify = (status) => {
        const current = core.utils.byte_units(status.current)
        const maxsize = core.utils.byte_units(status.size)
        const caption = `${status.url}<br>${current} of ${maxsize} (${status.percent}%)`
        core.utils.popup("MTGJSON Printings", caption, status.percent/100)
      }

      if (!fs.existsSync(prices_file) || force) {
        console.log("Downloading", "MTGJSON Printings")
        await core.fetcher.queue(
          "https://mtgjson.com/api/v5/AllPrintings.json.gz",
          printings_file,
          notify, false, "mtgjson-printings"
        )
      }

      core.utils.popup("MTGJSON Printings", "Reading File...<br/>This can take up to 5 minutes.", null)

      const pipeline = chain([
        fs.createReadStream(printings_file),
        zlib.createGunzip(),
        parser(),
        pick({filter: 'data'}),
        streamValues()
      ]);

      pipeline.on('data', (data) => {
        printings = data.value
      })

      pipeline.on('end', () => {
        core.utils.popup("MTGJSON Printings", "Complete!", 1)
        resolve(printings)
      })
    })
  },

  load_prices: (force) => {
    return new Promise(async (resolve, reject) => {
      let prices = {}

      let notify = (status) => {
        const current = core.utils.byte_units(status.current)
        const maxsize = core.utils.byte_units(status.size)
        const caption = `${status.url}<br>${current} of ${maxsize} (${status.percent}%)`
        core.utils.popup("MTGJSON Prices", caption, status.percent/100)
      }

      if (!fs.existsSync(prices_file) || force) {
        console.log("Downloading", "MTGJSON Prices")
        await core.fetcher.queue(
          "https://mtgjson.com/api/v5/AllPrices.json.gz",
          prices_file,
          notify, false, "mtgjson-prices"
        )
      }

      core.utils.popup("MTGJSON Prices", "Reading File...<br/>This can take up to 10 minutes.", null)

      const pipeline = chain([
        fs.createReadStream(prices_file),
        zlib.createGunzip(),
        parser(),
        pick({filter: 'data'}),
        // less ram usage (?), increase parsing time by 2 minutes:
        ignore({filter: /\bpaper.tcgplayer\b|\bpaper.cardkingdom.retail\b|\bpaper.cardmarket.buylist\b|\bpaper.tcgplayer\b|\bpaper.tcgplayer\b|\bpaper.cardsphere\b|\bmtgo\b/i}),
        streamValues()
      ]);

      pipeline.on('data', (data) => {
        prices = data.value
      })

      pipeline.on('end', () => {
        core.utils.popup("MTGJSON Prices", "Complete!", 1)
        resolve(prices)
      })
    })
  },

  load_database: () => {
    return new Promise(async (resolve, reject) => {
      // return if database is already loaded or does not exist
      if (metadata.database || !fs.existsSync(database_file)) {
        resolve(true)
        return
      }

      // read existing database from disk
      let rawdata = fs.readFileSync(database_file)
      metadata.database = JSON.parse(rawdata)

      resolve(true)
    })
  },

  setup_metadata: async (force) => {
    if(metadata.prepare || ( metadata.database) && !force) {
      // if already initialized or preparing return here
      return metadata.prepare
    } else {
      // if uninitialized return a new promise that takes care of setting up things
      metadata.prepare = new Promise(async (resolve, reject) => {
        if (!fs.existsSync(database_file) || force) {
          const [ printings, prices ] = await Promise.all([ metadata.load_printings(force), metadata.load_prices(force) ])
          metadata.build_database(printings, prices)
          console.log("build database complete")
        }

        await metadata.load_database()
        metadata.prepare = null
        resolve(true)
      })

      return metadata.prepare
    }
  },

  update_card: async (card) => {
    // make sure metadata database is initialized
    await metadata.setup_metadata()

    const edition = card.set.toUpperCase()
    const number = card.number.toString().toUpperCase()

    // check for existing metadata
    if (metadata.database && metadata.database[edition][number]) {
      // get card data from json file
      const jsoncard = metadata.database[edition][number]

      // attach all json data to card
      for(entry in jsoncard) card[entry] = jsoncard[entry]

      card.price = card.price_normal_cardmarket || card.price_normal_cardkingdom
      if(card.foil) card.price = card.price_foil_cardmarket || card.price_foil_cardkingdom || card.price

      // overwrite values with localized entries
      const language = get_language(card.language)
      if(language.short && jsoncard.locales && jsoncard.locales[language.short]) {
        const locale = jsoncard.locales[language.short]
        card.name = locale.name || card.name
        card.type = locale.type || card.type
        card.text = locale.text || card.text
        card.flavor = locale.flavor || card.flavor
        card.multiverse = locale.multiverse || card.multiverse
      }

      card.unknown = null
    } else {
      card.unknown = true
    }
  },

  get_image: async (card, preview) => {
    let notify = (status) => {
      if (preview) return
      const current = core.utils.byte_units(status.current)
      const maxsize = core.utils.byte_units(status.size)
      const caption = `${status.url}<br>${current} of ${maxsize} (${status.percent}%)`
      core.utils.popup(`Scryfall Download: ${card.set}:${card.number}`, caption, status.percent/100)
    }

    const image = path.join(core.data_directory, "images", `${preview ? 'preview' : 'full'}_[${card.set}.${card.number}.${card.language}${card.foil ? '.f' : ''}].jpg`)
    const fallback = path.join(core.data_directory, "images", `${preview ? 'preview' : 'full'}_[${card.set}.${card.number}.en${card.foil ? '.f' : ''}].jpg`)

    // fetch image
    if(!fs.existsSync(image)) {
      await core.fetcher.queue(
        `https://api.scryfall.com/cards/${card.set}/${card.number}/${card.language}?format=image&version=${preview ? 'small' : 'border_crop'}`,
        image,
        notify, false, "mtgjson-cards"
      )

      // try to fetch english version as fallback
      if(!fs.existsSync(image) && !fs.existsSync(fallback)) {
        await core.fetcher.queue(
          `https://api.scryfall.com/cards/${card.set}/${card.number}/en?format=image&version=${preview ? 'small' : 'border_crop'}`,
          fallback,
          notify, false, "mtgjson-cards-fallback"
        )
      }
    }

    // copy cached image to collection
    if(fs.existsSync(image)) {
      fs.copyFileSync(image, card.file)
    } else if (fs.existsSync(fallback)) {
      fs.copyFileSync(fallback, card.file)
    }

    // make foil
    if (card.foil == true && fs.existsSync(card.file)) {
      let image = await jimp.read(card.file)
      let foil = await jimp.read('./foil.png')

      foil = foil.resize(image.bitmap.width, image.bitmap.height)

      image.composite(foil, 0, 0, {
        mode: jimp.BLEND_SOURCE_OVER,
        opacityDest: 1,
        opacitySource: 0.4
      })

      await image.writeAsync(card.file)
    }
  }
}

module.exports = metadata
