const macaco = {
  config: {
    byname: false,
  },

  icons:
    require('../../assets/svg-icons.js'),

  filter:
    require('./filter.js'),

  collection: {
    path: "",
    contents: {}
  },

  getLocale: (card, entry) => {
    if (card.language && card.metadata && card.metadata.locales && card.metadata.locales[card.language]) {
      return card.metadata.locales[card.language][entry]
    } else {
      return ""
    }
  },

  getColorIcon: (cards) => {
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
  },

  getTextHtml: (str) => {
    if (!str) return ''

    // multicolor icons, separated by "/"
    const micons = /{(.+?)\/(.+?)}/gi
    str = str.replace(micons, "<img src='../../assets/mana/$1$2.png' alt='$1$2'>")

    // normal icons, same as filename
    const icons = /{(.+?)}/gi
    str = str.replace(icons, "<img src='../../assets/mana/$1.png' alt='$1'>")

    // turn every text in brackets small
    const small = /\((.+?)\)/gi
    str = str.replace(small, '<small><i>($1)</i></small>')

    // add a vertical spacer on each line-break
    str = str.replaceAll('\n', "<div class='vspacer'></div>")
    return str
  },

  /* macaco.events:

    The events are usually the name of the macaco variable that is accesed.
    It is also prefixed with a `set-` if the registered function is supposed
    to set the variable, or with an `update-` if the registered function is
    supposed to update based on the value of the variable.

    set-x-y: The receiver is expected to set the value of `macaco.x.y` and
            also to trigger the required update events.

    update-x-y: The receiver is expected to update itself based on the
                value of the variable `macaco.x.y`
  */
  events: {
    on: {},

    register: (ev, callback) => {
      macaco.events.on[ev] = macaco.events.on[ev] || []
      macaco.events.on[ev].push(callback)
    },

    invoke: (ev, ...args) => {
      macaco.events.on[ev] = macaco.events.on[ev] || []
      for (const callback of macaco.events.on[ev]) {
        callback(ev, ...args)
      }
    }
  },

  /* ipc event system: main <=> renderer */
  ipc: {
    register: (ev, callback) => {
      macaco.ipc.on = macaco.ipc.on || {}
      macaco.ipc.on[ev] = macaco.ipc.on[ev] || []
      macaco.ipc.on[ev].push(callback)
    },
  },
}

/* external events */
macaco.ipc.register('update-collection', (ev, path, contents) => {
  if (path !== macaco.collection.path) {
    /* set new received collection data */
    macaco.collection.path = path
    macaco.collection.folder = "."
    macaco.collection.contents = contents
    macaco.collection.view = macaco.filter.view(macaco.collection.contents[macaco.collection.folder])
    macaco.collection.selection = []

    /* send update events for all variables that did change */
    macaco.events.invoke("update-collection-path", macaco.collection.path)
    macaco.events.invoke("update-collection-contents", macaco.collection.contents)
    macaco.events.invoke("update-collection-view", macaco.collection.view)
    macaco.events.invoke("update-collection-selection", macaco.collection.selection)
    macaco.events.invoke("update-collection-folder", macaco.collection.folder)
  } else {
    /* set new received collection data */
    macaco.collection.contents = contents
    macaco.collection.view = macaco.filter.view(macaco.collection.contents[macaco.collection.folder])

    /* send update events for all variables that did change */
    macaco.events.invoke("update-collection-contents", macaco.collection.contents)
    macaco.events.invoke("update-collection-view", macaco.collection.view)
  }
})

/* internal events */
macaco.events.register("set-collection-folder", (ev, folder) => {
  folder = macaco.collection.contents[folder] ? folder : "."
  const view = macaco.collection.contents[folder]

  macaco.collection.view = macaco.filter.view(view)
  macaco.collection.folder = folder

  /* send update events for all variables that did change */
  macaco.events.invoke("update-collection-view", macaco.collection.view)
  macaco.events.invoke("update-collection-folder", macaco.collection.folder)
})

macaco.events.register("set-filter", (ev, entry, value, state) => {
  macaco.filter.set(entry, value, state)
  macaco.events.invoke("update-filter", macaco.filter)
})

macaco.events.register("update-filter", (ev, filter) => {
  const view = macaco.collection.contents[macaco.collection.folder]
  macaco.collection.view = macaco.filter.view(view)
  macaco.events.invoke("update-collection-view", macaco.collection.view)
})
