const macaco = {
  icons:
    require('../../assets/svg-icons.js'),

  filter:
    require('./filter.js'),

  statistics:
    require('./statistics.js'),

  events:
    require('./events.js'),

  collection: {
    path: '',
    contents: {},
    selection: [],
    folder: '.',
    diff: []
  },

  combine: 'id',

  getLocale: (card, entry) => {
    if (card.language && card.metadata && card.metadata.locales && card.metadata.locales[card.language]) {
      return card.metadata.locales[card.language][entry]
    } else if (card.metadata && card.metadata.locales && card.metadata.locales.en) {
      return card.metadata.locales.en[entry]
    } else {
      return ''
    }
  },

  getTextHtml: (str) => {
    if (!str) return ''

    // remove multicolor icon slash-separator
    const micons = /{(.+?)\/(.+?)}/gi
    str = str.replace(micons, '{$1$2}')

    // convert mana icons to html images
    const icons = /{(.+?)}/gi
    str = str.replace(icons, "<img src='../../assets/mana/$1.png' alt='$1'>")

    // turn every text in brackets small
    const small = /\((.+?)\)/gi
    str = str.replace(small, '<small><i>($1)</i></small>')

    // add a vertical spacer on each line-break
    str = str.replaceAll('\n', "<div class='vspacer'></div>")
    return str
  },

  /* ipc event system: main <=> renderer */
  ipc: {
    register: (ev, callback) => {
      macaco.ipc.on = macaco.ipc.on || {}
      macaco.ipc.on[ev] = macaco.ipc.on[ev] || []
      macaco.ipc.on[ev].push(callback)
    }
  }
}

/* setters */
macaco.events.register('set-collection-folder', (ev, folder) => {
  macaco.collection.folder = folder || macaco.collection.folder
  macaco.events.invoke('update-collection-folder', macaco.collection.folder)
})

macaco.events.register('set-collection-selection', (ev, selection) => {
  macaco.collection.selection = selection
  macaco.events.invoke('update-collection-selection', selection)
})

macaco.events.register('set-collection-view', (ev) => {
  let files = macaco.collection.contents[macaco.collection.folder]

  // scan for card duplicates
  const duplicates = { }
  for (const card of files) {
    let id = `${card.fsurl}`
    if (macaco.combine === 'id') {
      id = `[${card.edition}.${card.number}.${card.language}${card.foil ? '.f' : ''}]`
    } else if (macaco.combine === 'name' && card.metadata) {
      id = `[${card.metadata.name}]`
    }

    if (!duplicates[id]) {
      duplicates[id] = [card]
    } else {
      duplicates[id].push(card)
    }
  }

  // attach card count to each card (required for sorting)
  for (const [, cards] of Object.entries(duplicates)) {
    for (const card of cards) {
      card.count = cards.length
    }

    cards[0]._similar = cards
  }

  // filter and sort all cards in files
  files = macaco.filter.view(files)

  // build a list of sorted card clusters
  const view = []
  for (const card of files) {
    if (card._similar) {
      const cluster = card._similar
      delete card._similar
      view.push(cluster)
    }
  }

  macaco.events.invoke('update-collection-view', view)
})

macaco.events.register('set-filter', (ev, entry, value, state) => {
  macaco.filter.set(entry, value, state)
  macaco.events.invoke('update-filter', macaco.filter, entry)
})

macaco.events.register('set-combine', (ev, state) => {
  macaco.combine = state
  macaco.events.invoke('update-combine', macaco.combine)
})

macaco.events.register('set-statistics-selection', (ev, cards) => {
  const statistics = macaco.statistics.read(cards, 'Selection')
  macaco.events.invoke('update-statistics-selection', statistics)
})

macaco.events.register('set-statistics-view', (ev, view) => {
  const statistics = macaco.statistics.read(macaco.collection.contents[macaco.collection.folder], macaco.collection.folder)
  macaco.events.invoke('update-statistics-view', statistics)
})

macaco.events.register('set-statistics-contents', (ev, contents) => {
  let statistics = false
  for (const [, cards] of Object.entries(contents)) {
    statistics = macaco.statistics.read(cards, 'Collection', statistics)
    statistics.folders += 1
  }

  macaco.events.invoke('update-statistics-contents', statistics)
})

/* bind events to setters: collection updates */
macaco.events.bind('update-collection-folder', 'set-collection-view')
macaco.events.bind('update-filter', 'set-collection-view')
macaco.events.bind('update-combine', 'set-collection-view')

/* bind events to setters: statistic updates */
macaco.events.bind('update-collection-contents', 'set-statistics-contents')
macaco.events.bind('update-collection-view', 'set-statistics-view')
macaco.events.bind('update-collection-selection', 'set-statistics-selection')

/* external ipc events */
macaco.ipc.register('update-collection', (ev, path, contents, diff) => {
  // update and reset recent updates
  macaco.collection.diff = diff || []
  setTimeout(() => {
    if (macaco.collection.diff === diff) {
      macaco.collection.diff = []
    }
  }, 1000)

  // detect library change
  const changed = macaco.collection.path !== path

  // set collection variables
  macaco.collection.path = path
  macaco.collection.contents = contents

  // send update events
  macaco.events.invoke('update-collection-path', path)
  macaco.events.invoke('update-collection-contents', contents)

  // reset folder on library change
  macaco.events.invoke('set-collection-folder', changed && '.')

  // reset non-empty selections after collection updates
  if (macaco.collection.selection.length === 0) return
  macaco.events.invoke('set-collection-selection', [])
})
