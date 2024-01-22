class Filter {
  min = 1

  json = {}

  rarity = [
    'common',
    'uncommon',
    'rare',
    'special',
    'mythic'
  ]

  tags = {
    cmc: (card, values) => {
      for (const entry of values) {
        if (entry.includes('+')) {
          if (card.metadata.cmc >= parseInt(entry.replaceAll('+', ''))) return true
        } else if (entry.includes('-')) {
          if (card.metadata.cmc <= parseInt(entry.replaceAll('-', ''))) return true
        } else {
          if (card.metadata.cmc === parseInt(entry)) return true
        }
      }

      return false
    },
    rarity: (card, values) => {
      for (const entry of values) { if (card.metadata.rarity === entry) return true }
      return false
    },
    type: (card, values) => {
      for (const entry of values) {
        const match = card.metadata.types && card.metadata.types.find(e => {
          return e.toLowerCase() === entry.toLowerCase()
        })

        if (match) return true
      }

      return false
    },
    edition: (card, values) => {
      for (const entry of values) { if (card.edition === entry.toLowerCase()) return true }
      return false
    },
    color: (card, values) => {
      let multicolorEnforced = false
      let atleastOne = false
      let mismatch = false

      for (const entry of values) {
        if (entry === 'm') {
          if (card.metadata.color && card.metadata.color.length > 1) {
            multicolorEnforced = true
            atleastOne = true
          } else {
            return false
          }
        } else if (entry === 'c') {
          if (!card.metadata.color || card.metadata.color.length === 0) atleastOne = true
        } else {
          if (card.metadata.color && card.metadata.color.includes(entry.toUpperCase())) {
            atleastOne = true
          } else {
            mismatch = true
          }
        }
      }

      // special case if multicolor search is enforced
      // only return multicolor cards if the color selection
      // is also a full match
      if (multicolorEnforced && mismatch) return false
      return atleastOne
    },

    // dummy functions to keep sort tags present
    sort: () => { return true },
    order: () => { return true }
  }

  sort (attributes, order = 1) {
    const attribute = attributes && attributes[0] ? attributes[0] : 'name'

    return (a, b) => {
      if (attribute === 'rarity') {
        // special sorting for card rarity
        const aVal = this.rarity.indexOf(a.metadata.rarity) + 1
        const bVal = this.rarity.indexOf(b.metadata.rarity) + 1

        if (aVal !== bVal) {
          return aVal < bVal ? order : -1 * order
        }
      } else {
        // generic sorting algorithm
        if ((a[attribute] || 0) !== (b[attribute] || 0)) {
          return a[attribute] < b[attribute] ? order : -1 * order
        }

        // metadata sorting algorithm
        if ((a.metadata[attribute] || 0) !== (b.metadata[attribute] || 0)) {
          return a.metadata[attribute] < b.metadata[attribute] ? order : -1 * order
        }
      }

      // sort by name as fallback on identical values
      if (a.metadata.name && b.metadata.name && a.metadata.name !== b.metadata.name) {
        return a.metadata.name < b.metadata.name ? order : -1 * order
      }

      return 0
    }
  }

  get (entry, value) {
    if (entry === 'text') {
      let string = ''

      for (const [tag, elements] of Object.entries(this.json)) {
        if (tag !== 'text' && elements.length > 0) string += `${tag}=${elements.toString()} `
      }

      string += this.json.text || ''

      return string.trim()
    } else {
      if (this.json[entry] && this.json[entry].includes(value)) {
        return true
      } else {
        return false
      }
    }
  }

  set (entry, value, state) {
    if (entry === 'text') {
      // initialize new search object
      this.json = {}

      // build keyword attributes from string
      for (const [pattern] of Object.entries(this.tags)) {
        const entries = []
        const regex = new RegExp(`\\b${pattern}=([^ ]+)`, 'i')
        const match = regex.exec(value)

        if (!match) continue

        for (const entry of match[1].split(',')) {
          entries.push(entry)
        }

        // clear matching tag from string
        this.json[pattern] = entries
        value = value.replace(match[0], '')
      }

      // add fulltext search attribute
      this.json.text = value.trim()
    } else {
      this.json[entry] = this.json[entry] || []

      if (entry === 'sort' || entry === 'order') {
        // single tags (sort=asc)
        if (!state) {
          this.json[entry] = []
        } else {
          this.json[entry] = [value]
        }
      } else {
        // tag lists (color=w,c,u,b)
        if (!state) {
          this.json[entry].splice(this.json[entry].indexOf(value), 1)
          if (this.json[entry].length === 0) delete this.json[entry]
        } else {
          this.json[entry] = this.json[entry] || []
          this.json[entry].push(value)
        }
      }
    }
  }

  check (card) {
    // iterate over all attributes and break on mismatch
    for (const [attribute, values] of Object.entries(this.json)) {
      if (this.tags[attribute] && !this.tags[attribute](card, values)) {
        return false
      }
    }

    let text = this.json.text || ''
    text = text.toLowerCase()

    // perform fulltext search over the remaining card
    if (card.name && card.name.toLowerCase().includes(text)) return true
    if (!card.metadata.locales) return false

    for (const [, locale] of Object.entries(card.metadata.locales)) {
      if (locale.name && locale.name.toString().toLowerCase().includes(text)) return true
      if (locale.text && locale.text.toString().toLowerCase().includes(text)) return true
      if (locale.type && locale.type.toString().toLowerCase().includes(text)) return true
    }

    return false
  }

  view (db) {
    // abort on invalid data
    if (!db) return false

    // always return unfiltered on empty strings
    const str = this.get('text')
    if (str.length < this.min) return db

    // filter results
    const result = db.filter(card => this.check(card))

    // sort view
    const order = this.json.order && this.json.order.includes('asc') ? -1 : 1
    result.sort(this.sort(this.json.sort, order))

    return result
  }
}

module.exports = new Filter()
