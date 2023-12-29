const filter = { min: 1, json: {} }

filter.rarity = [
  'common',
  'uncommon',
  'rare',
  'special',
  'mythic'
]

// all tag based filter checks
filter.tags = {
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

// generic sort function
filter.sort = (attributes, order = 1) => {
  const attribute = attributes && attributes[0] || 'name'

  return (a, b) => {
    if (attribute === 'rarity') {
      // special sorting for card rarity
      const aVal = filter.rarity.indexOf(a.metadata.rarity) + 1
      const bVal = filter.rarity.indexOf(b.metadata.rarity) + 1

      if (aVal !== bVal) {
        return aVal < bVal ? order : -1 * order
      }
    } else {
      // generic sorting algorithm
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

// get current filter attribute
filter.get = (entry, value) => {
  if (entry === 'text') {
    let string = ''

    for (const [tag, elements] of Object.entries(filter.json)) {
      if (tag !== 'text' && elements.length > 0) string += `${tag}=${elements.toString()} `
    }

    string += filter.json.text || ""

    return string.trim()
  } else {
    if (filter.json[entry] && filter.json[entry].includes(value)) {
      return true
    } else {
      return false
    }
  }
}

// set current filter attribute
filter.set = (entry, value, state) => {
  if (entry === 'text') {
    // initialize new search object
    filter.json = {}

    // build keyword attributes from string
    for (const [pattern] of Object.entries(filter.tags)) {
      const entries = []
      const regex = new RegExp(`\\b${pattern}=([^ ]+)`, 'i')
      const match = regex.exec(value)

      if (!match) continue

      for (const entry of match[1].split(',')) {
        entries.push(entry)
      }

      filter.json[pattern] = entries
    }

    // clear all tags from string
    const pattern = /\b([^ ]+)=([^ ]+)/gi
    const text = value.replace(pattern, '')

    // add fulltext search attribute
    filter.json.text = text.trim()
  } else {
    filter.json[entry] = filter.json[entry] || []

    if (entry === 'sort' || entry === 'order') {
      // single tags (sort=asc)
      if (!state) {
        filter.json[entry] = []
      } else {
        filter.json[entry] = [value]
      }
    } else {
      // tag lists (color=w,c,u,b)
      if (!state) {
        filter.json[entry].splice(filter.json[entry].indexOf(value), 1)
        if (filter.json[entry].length === 0) delete filter.json[entry]
      } else {
        filter.json[entry] = filter.json[entry] || []
        filter.json[entry].push(value)
      }
    }
  }
}

// check an individual card to be visible
filter.check = (card) => {
  // iterate over all attributes and break on mismatch
  for (const [attribute, values] of Object.entries(filter.json)) {
    if (filter.tags[attribute] && !filter.tags[attribute](card, values)) {
      return false
    }
  }

  let text = filter.json.text || ""
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

filter.view = (db) => {
  // abort on invalid data
  if (!db) return false

  // always return unfiltered on empty strings
  const str = filter.get('text')
  if (str.length < filter.min) return db

  // filter results
  const result = db.filter(card => filter.check(card))

  // sort view
  const order = filter.json.order && filter.json.order.includes('asc') ? -1 : 1
  result.sort(filter.sort(filter.json.sort, order))

  return result
}

module.exports = filter