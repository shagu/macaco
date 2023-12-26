/* ============================ Collection =======================================
 * An abstraction of filesystem and metadata, providing a collection object
 * in the format that is needed by the frontend, while also providing functions
 * to add, move and remove cards aswell as other types of collection interactions
 * ===============================================================================
 */

const filesystem = require('./filesystem.js')
const metadata = require('./metadata.js')

class Collection {
  static collection = {}
  static folder = ""

  constructor() {}

  /* set collection to a folder */
  async set(folder) {
    if(folder === this.folder) return

    // load collection of file and folder names
    const files = await filesystem.find(folder)
    this.collection = files
    this.folder = folder

    // add metadata to each file
    for(const [path, cards] of Object.entries(this.collection)) {
      for(const card of cards) card.metadata = await metadata.query(card)
    }
  }

  async reload(card, oldurl) {
    // same file, doesn't need a reload
    if (oldurl && card.fsurl == oldurl) return

    // add new card to the collection
    this.collection[card.folder].push(card)

    // only clean obsolete if old file exists
    if (!oldurl) return

    // remove old card (if exists)
    for (const [folder, contents] of Object.entries(this.collection)) {
      for (const card of contents) {
        if (card.fsurl == oldurl) this.collection[folder].splice(this.collection[folder].indexOf(card), 1)
      }
    }
  }

  /* add card to current collection */
  async write(card) {
    // cheatcode to download all card images of a set
    if (card.number === '*') {
      for(const number of await metadata.edition(card.edition)) {
        const qcard = structuredClone(card)
        qcard.number = number
        filesystem.artwork(qcard)
      }

      return card
    }

    // read previous fsurl if existing
    const oldurl = card.fsurl

    // write current collection path
    card.collection = this.folder

    // load card metadata
    card.metadata = await metadata.query(card)

    // write card updates to filesystem
    card = await filesystem.write(card, true)

    // reload collection and return card
    await this.reload(card, oldurl)
    return card
  }

  async preview(card) {
    // query image and metadata
    const preview = structuredClone(card)
    preview.metadata = await metadata.query(preview)
    preview.preview = await filesystem.image(preview, true)

    return preview
  }
}

module.exports = new Collection()
