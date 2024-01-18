class Statistics {
  icon (cards) {
    const icons = [
      'BG', 'BR', 'GU', 'GW', 'RG',
      'RW', 'UB', 'UR', 'WB', 'WU'
    ]

    const colors = {}
    const identity = []

    for (const card of cards) {
      if (!card.metadata || !card.metadata.color) continue

      for (const color of card.metadata.color) {
        colors[color] = colors[color] ? colors[color] + 1 : 1
      }
    }

    for (const [color, count] of Object.entries(colors)) {
      if (count / cards.length >= 0.10) {
        identity.push(color)
      }
    }

    const identityStr = identity.toString().toUpperCase()
    if (identity.length === 1) {
      return identityStr
    } else if (identity.length === 2) {
      for (const icon of icons) {
        if (identityStr.includes(icon.charAt(0)) && identityStr.includes(icon.charAt(1))) {
          return icon
        }
      }
    } else if (identity.length > 2) {
      return 'M'
    } else {
      return 'C'
    }
  }

  read (cards, folder = 'Unknown', template) {
    const stats = template || {
      types: { /* creature: 0, enchantment: 0, .. */ },
      price: { num: 0, sum: 0, min: 0, max: 0, avg: 0 },
      mana: { num: 0, sum: 0, min: 0, max: 0, avg: 0, values: {} },

      folders: 0,
      cards: 0
    }

    stats.icon = this.icon(cards)
    stats.title = folder === '.' ? 'Collection' : folder

    for (const card of cards) {
      if (card.metadata.types) {
        for (const type of card.metadata.types) {
          stats.types[type] = stats.types[type] || 0
          stats.types[type]++
        }
      }

      if (card.metadata.price) {
        stats.price.num++
        stats.price.sum += card.metadata.price
        stats.price.min = stats.price.min === 0 ? card.metadata.price : Math.min(stats.price.min, card.metadata.price)
        stats.price.max = Math.max(stats.price.max, card.metadata.price)
        stats.price.avg = stats.price.sum / stats.price.num
      }

      if (card.metadata.cmc && card.metadata.cmc > 0) {
        stats.mana.num++
        stats.mana.sum += card.metadata.cmc
        stats.mana.min = stats.price.min === 0 ? card.metadata.cmc : Math.min(stats.mana.min, card.metadata.cmc)
        stats.mana.max = Math.max(stats.mana.max, card.metadata.cmc)
        stats.mana.avg = stats.mana.sum / stats.mana.num

        stats.mana.values[card.metadata.cmc] = stats.mana.values[card.metadata.cmc] || 0
        stats.mana.values[card.metadata.cmc]++
      }

      stats.cards++
    }

    return stats
  }
}

module.exports = new Statistics()
