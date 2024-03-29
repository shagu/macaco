/* ============================ Collection =======================================
 * An abstraction of filesystem and metadata, providing a collection object
 * in the format that is needed by the frontend, while also providing functions
 * to add, move and remove cards aswell as other types of collection interactions
 * ===============================================================================
 */

const filesystem = require('./filesystem.js')
const metadata = require('./metadata.js')
const delver = require('./delver.js')
const textfile = require('./textfile.js')
const shared = require('./shared.js')

class Collection {
  static collection = {}
  static folder = ''

  /* set collection to a folder */
  async set (folder, force) {
    if (!force && folder === this.folder) return

    const foldername = folder.match(/([^/]*)\/*$/)[1]

    shared.popup('Open Collection', `Folder: ${foldername}`, 'Scanning Files')

    // load collection of file and folder names
    const files = await filesystem.find(folder)
    this.collection = files
    this.folder = folder

    // initialize progression data
    let [percent, count, sum] = [0, 0, 0]
    for (const [, cards] of Object.entries(this.collection)) {
      sum = sum + cards.length
    }

    // add metadata to each file
    for (const [, cards] of Object.entries(this.collection)) {
      for (const card of cards) {
        count += 1
        percent = (100.0 * count / sum).toFixed()
        const small = `${count} of ${sum} Cards`
        shared.popup('Open Collection', `Folder: ${foldername}`, small, percent)

        card.metadata = await metadata.query(card)
      }
    }
  }

  async metadata (force) {
    await metadata.reload(force)
    await this.set(this.folder)
  }

  async reload (card, oldurl) {
    // find and remove previous card from collection
    if (oldurl) {
      for (const [folder, contents] of Object.entries(this.collection)) {
        for (const card of contents) {
          if (card.fsurl === oldurl) this.collection[folder].splice(this.collection[folder].indexOf(card), 1)
        }
      }
    }

    // add updated card to the collection
    this.collection[card.folder].push(card)
  }

  /* add card to current collection */
  async write (card, keep) {
    // cheatcode to download all card images of a set
    if (card.number === '*') {
      for (const number of await metadata.edition(card.edition)) {
        const qcard = structuredClone(card)
        qcard.number = number
        filesystem.artwork(qcard)
      }

      return card
    }

    // read previous fsurl if existing
    const request = card
    const oldurl = card.fsurl

    // write current collection path
    card.collection = this.folder

    // load card metadata
    card.metadata = await metadata.query(card)

    // write card updates to filesystem
    card = await filesystem.write(card, keep)

    // reload collection and return card
    if (card) await this.reload(card, oldurl)

    // return updated card
    return card || request
  }

  async delete (card) {
    // abort on invalid card
    if (!card.fsurl) return

    // delete from filesystem
    await filesystem.delete(card)

    // remove card from collection cache to skip full rescan
    for (const [folder, contents] of Object.entries(this.collection)) {
      for (const entry of contents) {
        if (entry.fsurl === card.fsurl) this.collection[folder].splice(this.collection[folder].indexOf(entry), 1)
      }
    }
  }

  /* create new folder in library */
  async mkdir (folder) {
    await filesystem.mkdir(this.folder, folder)
    this.collection[folder] = this.collection[folder] || []
  }

  async preview (card) {
    // query image and metadata
    const preview = structuredClone(card)
    preview.metadata = await metadata.query(preview)
    preview.preview = await filesystem.image(preview, true)

    return preview
  }

  async importDelver (file) {
    // abort if no collection is loaded
    if (!this.folder || this.folder === '') return

    const cards = await delver.import(file)

    for (const card of cards) {
      card.collection = this.folder
      card.metadata = await metadata.query(card)
      await filesystem.write(card)
    }

    await this.set(this.folder, true)
  }

  async importTextFile (file, folder) {
    // abort if no collection is loaded
    if (!this.folder || this.folder === '') return

    const cards = await textfile.import(file, folder)

    for (const card of cards) {
      card.collection = this.folder
      card.metadata = await metadata.query(card)
      await filesystem.write(card)
    }

    await this.set(this.folder, true)
  }

  async exportTextFile (file, contents) {
    textfile.export(file, contents)
  }
}

module.exports = new Collection()
