const filters = { min: 1, cache: {}, dom: {} }

// all clickable check buttons
filters.checkButtons = [
  'color',
  'cmc',
  'rarity',
  'type',
  'sort',
  'order'
]

filters.rarity = [
  'common',
  'uncommon',
  'rare',
  'special',
  'mythic'
]

// all tag based filter checks
filters.tags = {
  cmc: (card, values) => {
    for (const entry of values) {
      if (entry.includes('+')) {
        if (card.cmc >= entry.replaceAll('+', '')) return true
      } else if (entry.includes('-')) {
        if (card.cmc <= entry.replaceAll('-', '')) return true
      } else {
        if (card.cmc === entry) return true
      }
    }

    return false
  },
  rarity: (card, values) => {
    for (const entry of values) { if (card.rarity === entry) return true }
    return false
  },
  type: (card, values) => {
    for (const entry of values) {
      const match = card.types && card.types.find(e => {
        return e.toLowerCase() === entry.toLowerCase()
      })

      if (match) return true
    }

    return false
  },
  set: (card, values) => {
    for (const entry of values) { if (card.set === entry.toLowerCase()) return true }
    return false
  },
  color: (card, values) => {
    let multicolorEnforced = false
    let atleastOne = false
    let mismatch = false

    for (const entry of values) {
      if (entry === 'm') {
        if (card.color && card.color.length > 1) {
          multicolorEnforced = true
          atleastOne = true
        } else {
          return false
        }
      } else if (entry === 'c') {
        if (!card.color || card.color.length === 0) atleastOne = true
      } else {
        if (card.color && card.color.includes(entry.toUpperCase())) {
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
filters.sort = (attribute = 'name', order = 1) => {
  return (a, b) => {
    if (attribute === 'rarity') {
      // special sorting for card rarity
      const aVal = filters.rarity.indexOf(a.rarity) + 1
      const bVal = filters.rarity.indexOf(b.rarity) + 1

      if (aVal !== bVal) {
        return aVal < bVal ? order : -1 * order
      }
    } else {
      // generic sorting algorithm
      if ((a[attribute] || 0) !== (b[attribute] || 0)) {
        return a[attribute] < b[attribute] ? order : -1 * order
      }
    }

    // sort by name as fallback on identical values
    if (a.name && b.name && a.name !== b.name) {
      return a.name < b.name ? order : -1 * order
    }

    return 0
  }
}

// create search json object from given string
filters.getJson = (str) => {
  // return cache if still valid
  if (filters.cache.str === str && filters.cache.object) {
    return filters.cache.object
  }

  // initialize new search object
  const result = {}

  // build keyword attributes from string
  for (const [pattern] of Object.entries(filters.tags)) {
    const entries = []
    const regex = new RegExp(`\\b${pattern}=([^ ]+)`, 'i')
    const match = regex.exec(str)

    if (!match) continue

    for (const entry of match[1].split(',')) {
      entries.push(entry)
    }

    result[pattern] = entries
  }

  // clear all tags from string
  const pattern = /\b([^ ]+)=([^ ]+)/gi
  const search = str.replace(pattern, '')

  // add fulltext search attribute
  result.search = search.trim()

  // save cache
  filters.cache.str = str
  filters.cache.object = result

  return result
}

// create search string from given json object
filters.getString = (json) => {
  let string = ''

  for (const [tag, elements] of Object.entries(json)) {
    if (tag !== 'search' && elements.length > 0) string += `${tag}=${elements.toString()} `
  }

  string += json.search

  return string.trim()
}

// check an individual card to be visible
filters.check = (card, query) => {
  // iterate over all attributes and break on mismatch
  for (const [filter, values] of Object.entries(query)) {
    if (filters.tags[filter] && !filters.tags[filter](card, values)) {
      return false
    }
  }

  // perform fulltext search over the remaining card
  if (card.name && card.name.toLowerCase().includes(query.search)) return true
  if (!card.locales) return false

  for (const [, locale] of Object.entries(card.locales)) {
    if (locale.name && locale.name.toLowerCase().includes(query.search)) return true
    if (locale.text && locale.text.toLowerCase().includes(query.search)) return true
    if (locale.type && locale.type.toLowerCase().includes(query.search)) return true
  }

  return false
}

// returns a filtered array based on search query
filters.createView = (db) => {
  // abort on invalid data
  if (!db) return false

  // always return unfiltered on empty strings
  const str = filters.dom.search.value
  if (str.length < filters.min) return db

  // obtain search query object from string
  const query = filters.getJson(str)

  // return filtered view
  const result = db.filter(card => filters.check(card, query))

  // sort view
  const order = query.order === 'asc' ? -1 : 1
  result.sort(filters.sort(query.sort, order))

  return result
}

// initial setup of dom caches and click events
filters.uiInit = () => {
  // cache dom element shortcuts
  filters.dom = {
    search:
      document.getElementById('card-search'),

    color: {
      w: document.getElementById('button-color-w'),
      u: document.getElementById('button-color-u'),
      b: document.getElementById('button-color-b'),
      r: document.getElementById('button-color-r'),
      g: document.getElementById('button-color-g'),
      c: document.getElementById('button-color-c'),
      m: document.getElementById('button-color-m')
    },

    cmc: {
      0: document.getElementById('filter-mana-0'),
      1: document.getElementById('filter-mana-1'),
      2: document.getElementById('filter-mana-2'),
      3: document.getElementById('filter-mana-3'),
      4: document.getElementById('filter-mana-4'),
      5: document.getElementById('filter-mana-5'),
      6: document.getElementById('filter-mana-6'),
      7: document.getElementById('filter-mana-7'),
      8: document.getElementById('filter-mana-8'),
      '9+': document.getElementById('filter-mana-9')
    },

    rarity: {
      common: document.getElementById('filter-rarity-common'),
      uncommon: document.getElementById('filter-rarity-uncommon'),
      rare: document.getElementById('filter-rarity-rare'),
      mythic: document.getElementById('filter-rarity-mythic')
    },

    type: {
      instant: document.getElementById('filter-type-instant'),
      sorcery: document.getElementById('filter-type-sorcery'),
      creature: document.getElementById('filter-type-creature'),
      enchantment: document.getElementById('filter-type-enchantment'),
      artifact: document.getElementById('filter-type-artifact'),
      planeswalker: document.getElementById('filter-type-planeswalker'),
      land: document.getElementById('filter-type-land')
    },

    sort: {
      name: document.getElementById('sort-name'),
      color: document.getElementById('sort-color'),
      cmc: document.getElementById('sort-mana'),
      rarity: document.getElementById('sort-rarity'),
      price: document.getElementById('sort-price'),
      count: document.getElementById('sort-count'),
      set: document.getElementById('sort-set')
    },

    order: {
      asc: document.getElementById('sort-mode-asc'),
      desc: document.getElementById('sort-mode-desc')
    }
  }

  // add keyup handler to search bar
  filters.dom.search.addEventListener('keyup', (e) => {
    if (e.target.value === e.target.lastValue) return
    e.target.lastValue = e.target.value
    filters.uiReload()
  })

  // add click handler to filter buttons
  for (const keyword of filters.checkButtons) {
    for (const [attribute, button] of Object.entries(filters.dom[keyword])) {
      button.addEventListener('click', (e) => {
        const query = filters.getJson(filters.dom.search.value)

        if (keyword === 'sort' || keyword === 'order') {
          // single-select buttons
          if (query[keyword] && query[keyword].includes(attribute)) {
            query[keyword] = []
          } else {
            query[keyword] = [attribute]
          }
        } else {
          // multi-select buttons
          if (query[keyword] && query[keyword].includes(attribute)) {
            query[keyword].splice(query[keyword].indexOf(attribute), 1)
          } else {
            query[keyword] = query[keyword] || []
            query[keyword].push(attribute)
          }
        }

        // update search query
        filters.dom.search.value = filters.getString(query)

        // update all ui buttons
        filters.uiReload()
      })
    }
  }
}

// reload ui elements to match the current search string
filters.uiReload = () => {
  // get current string
  const query = filters.getJson(filters.dom.search.value)

  // update clickable filter buttons
  for (const attribute of filters.checkButtons) {
    for (const [name, button] of Object.entries(filters.dom[attribute])) {
      if (query && query[attribute] && query[attribute].includes(name)) {
        button.classList.add('checked')
      } else {
        button.classList.remove('checked')
      }
    }
  }

  // reload whole frontend
  frontend.reload()
}

// register the init function
window.addEventListener('DOMContentLoaded', filters.uiInit)
