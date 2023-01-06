let filters = { tags: { } }

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
  str = str.toLowerCase()

  for (const [name, parser] of Object.entries(filters.tags)) {
    let match = parser.pattern.exec(str)
    if (match && match[1]) {
      str = str.replace(parser.pattern, "")
      if(!parser.matched(card, match)) return false
    }
  }

  return card.name.toLowerCase().includes(str.trim())
}
