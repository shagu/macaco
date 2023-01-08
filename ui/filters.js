let filters = { tags: { }, min: 1 }

filters.tags["cmc"] = {
  pattern: /\s?cmc=([^ ]+)/i,
  matched: (card, match) => {
    let atleast_one = false
    for(const cmc of match[1].split(",")) {
      if(card.manavalue == cmc) atleast_one = true
    }

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

  // perform the name search
  return card.name.toLowerCase().includes(str.trim())
}
