const fs = require('fs')

class TextFile {
  identifier (card) {
    let id = `${card.edition}.${card.number}.${card.language}`
    id = card.foil ? `${id}.f` : id
    return id
  }

  sort (a, b) {
    if ((a.edition || 0) !== (b.edition || 0)) {
      return a.edition < b.edition ? -1 : 1
    }

    const as = a.number; const bs = b.number
    return as.localeCompare(bs, undefined, { numeric: true })
  }

  cards (cards, folder) {
    let string = ''

    const duplicates = { }
    const list = cards.sort(this.sort)

    // detect duplicates
    for (const card of list) {
      const id = this.identifier(card)
      duplicates[id] = duplicates[id] || []
      duplicates[id].push(card)
    }

    for (const card of list) {
      const id = this.identifier(card)
      if (duplicates[id]) {
        if (folder) {
          string += `${folder.replace(':', '\\:')}: ${duplicates[id].length}x ${card.name} [${this.identifier(card)}]\r\n`
        } else {
          string += `${duplicates[id].length}x ${card.name} [${this.identifier(card)}]\r\n`
        }

        delete duplicates[id]
      }
    }

    return string
  }

  meta (string) {
    if (!string) return []

    const meta = string.split('.')
    return [meta[0], meta[1], meta[2], !!meta[3]]
  }

  parse (line, dir) {
    line = line.replaceAll('\\:', '_!COLON!_')
    const collection = line.match(/(.*?): (.*?)x (.*?) ?\[(.*)\]/i)
    const decklist = line.match(/(.*?)x (.*?) ?\[(.*)\]/i)

    let card = {}

    if (collection && collection[1]) {
      const [edition, number, language, foil] = this.meta(collection[4])
      const folder = collection[1].replaceAll('_!COLON!_', ':')
      const amount = collection[2]
      const name = collection[3].replaceAll('_!COLON!_', ':')
      card = { folder, amount, name, edition, number, language, foil }
    } else if (decklist && decklist[1]) {
      const [edition, number, language, foil] = this.meta(decklist[3])
      const folder = dir
      const amount = decklist[1]
      const name = decklist[2].replaceAll('_!COLON!_', ':')
      card = { folder, amount, name, edition, number, language, foil }
    } else if (line.length !== 0 || line !== '') {
      console.log(`ERROR: Could not parse line: "${line.replaceAll('_!COLON!_', ':')}"`)
    }

    return card
  }

  async export (file, contents) {
    let string = ''

    if (Array.isArray(contents)) {
      string += this.cards(contents)
    } else {
      for (const [folder, cards] of Object.entries(contents)) {
        string += this.cards(cards, folder)
      }
    }

    fs.writeFileSync(file, string)
  }

  async import (file, folder) {
    const contents = fs.readFileSync(file, 'utf-8')
    const lines = contents.split(/\r?\n/)

    const cards = []

    for (const line of lines) {
      const card = this.parse(line, folder)

      for (let i = 1; i <= card.amount; i++) {
        cards.push({
          edition: card.edition,
          number: card.number,
          foil: card.foil,
          language: card.language,
          folder: card.folder
        })
      }
    }

    return cards
  }
}

module.exports = new TextFile()
