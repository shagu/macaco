let filters = { tags: { }, min: 1 }

// converted mana cost
filters.tags["cmc"] = {
  pattern: /\bcmc=([^ ]+)/i,
  matched: (card, match) => {
    let atleast_one = false
    for(const cmc of match[1].split(",")) {
      if(card.manavalue == cmc) atleast_one = true
    }

    return atleast_one
  }
}

// color
filters.tags["c"] = {
  pattern: /\bc=([^ ]+)/i,
  matched: (card, match) => {
    let multicolor_enforced = false
    let atleast_one = false
    let mismatch = false

    for(const color of match[1].split(",")) {
      if(color == "m") {
        if(card.colors.length > 1) {
          multicolor_enforced = true
        } else {
          return false
        }
      } else if (color=="c") {
        if(card.colors.length == 0) atleast_one = true
      } else {
        if(card.colors.includes(color.toUpperCase())) {
          atleast_one = true
        } else {
          mismatch = true
        }
      }
    }

    // special case if multicolor search is enforced
    // only return multicolor cards if the color selection
    // is also a full match
    if(multicolor_enforced && !mismatch) return true

    return atleast_one
  }
}

filters.visible = (card, str) => {
  // always return true on empty strings
  if(str.length < filters.min) return true

  // only scan for tags when string is > 2
  if(str.length > 2) {
    for (const [name, parser] of Object.entries(filters.tags)) {
      let match = parser.pattern.exec(str)
      if (match && match[1]) {
        str = str.replace(parser.pattern, "")
        if(!parser.matched(card, match)) return false
      }
    }
  }

  // perform the fulltext search
  const search = str.trim()
  if(card.text && card.text.toLowerCase().includes(search)) return true
  if(card.name && card.name.toLowerCase().includes(search)) return true
  return false
}
