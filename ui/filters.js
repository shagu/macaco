let filters = { min: 1, cache: {} }

// all tag based filter checks
filters.tags = {
  ["cmc"]: (card, values) => {
    for (const entry of values)
      if (card.cmc == entry) return true
    return false
  },
  ["rarity"]: (card, values) => {
    for (const entry of values)
      if (card.rarity == entry) return true
    return false
  },
  ["color"]: (card, values) => {
    let multicolor_enforced = false
    let atleast_one = false
    let mismatch = false

    for (const entry of values) {
      if(entry == "m") {
        if(card.color && card.color.length > 1) {
          multicolor_enforced = true
          atleast_one = true
        } else {
          return false
        }
      } else if (entry=="c") {
        if (!card.color || card.color.length == 0) atleast_one = true
      } else {
        if(card.color && card.color.includes(entry.toUpperCase())) {
          atleast_one = true
        } else {
          mismatch = true
        }
      }
    }

    // special case if multicolor search is enforced
    // only return multicolor cards if the color selection
    // is also a full match
    if(multicolor_enforced && mismatch) return false
    return atleast_one
  }
}

// create search object from given string
filters.get_object = (str) => {
  // return cache if still valid
  if(filters.cache.str == str && filters.cache.object) {
    return filters.cache.object
  }

  // initialize new search object
  const result = {}

  // build keyword attributes from string
  for (const [pattern, check] of Object.entries(filters.tags)) {
    const entries = []
    const regex = new RegExp(`\\b${pattern}=([^ ]+)`, 'i')
    const match = regex.exec(str)

    if (!match) continue

    for(const entry of match[1].split(",")) {
      entries.push(entry)
    }

    result[pattern] = entries
  }

  // clear all tags from string
  let pattern = /\b([^ ]+)=([^ ]+)/gi
  let search  = str.replace(pattern, "")

  // add fulltext search attribute
  result["search"] = search.trim()

  // save cache
  filters.cache["str"] = str
  filters.cache["object"] = result

  return result
}

filters.visible = (card, str) => {
  // always return true on empty strings
  if(str.length < filters.min) return true

  // obtain search object from string
  const query = filters.get_object(str)

  // iterate over all attributes and break on mismatch
  for (const [filter, values] of Object.entries(query)) {
    if(filters.tags[filter] && !filters.tags[filter](card, values)) {
      return false
    }
  }

  // perform fulltext search over the remaining card
  if (card.name && card.name.toLowerCase().includes(query.search)) return true
  if (!card.locales) return false

  for (const [language, locale] of Object.entries(card.locales)) {
    if(locale.name && locale.name.toLowerCase().includes(query.search)) return true
    if(locale.text && locale.text.toLowerCase().includes(query.search)) return true
    if(locale.type && locale.type.toLowerCase().includes(query.search)) return true
  }

  return false
}
