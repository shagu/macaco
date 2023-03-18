const frontend = { path: '.', db: {}, dom: {} }

const config = {
  combine: true,
  showEmpty: true
}

frontend.languages = {
  'Ancient Greek': ['grc'],
  Arabic: ['ar'],
  'Chinese Simplified': ['zhs', 'cs'],
  'Chinese Traditional': ['zht', 'ct'],
  English: ['en'],
  French: ['fr'],
  German: ['de'],
  Hebrew: ['he'],
  Italian: ['it'],
  Japanese: ['ja', 'jp'],
  Korean: ['ko', 'kr'],
  Latin: ['la'],
  Phyrexian: ['ph'],
  'Portuguese (Brazil)': ['pt'],
  Russian: ['ru'],
  Sanskrit: ['sa'],
  Spanish: ['es', 'sp']
}

frontend.getLocale = (card, entry) => {
  let retval = ''

  const langShort = card.language
  for (const [language, abbreviations] of Object.entries(frontend.languages)) {
    if (abbreviations.includes(langShort)) {
      retval = card.locales && card.locales[language] ? card.locales[language][entry] : false
      retval = retval || (card.locales && card.locales.English[entry])
    }
  }

  return retval
}

frontend.objcompare = (a, b, o) => {
  if (!a || !b) return false
  if (!o) return a === b
  for (const e of o) if (a[e] !== b[e]) return false
  return true
}

frontend.getFolderDetails = (content, stats) => {
  stats.types = stats.types || { /* creature: 0, enchantment: 0, .. */ }
  stats.price = stats.price || { num: 0, sum: 0, min: 0, max: 0, avg: 0 }
  stats.mana = stats.mana || { num: 0, sum: 0, min: 0, max: 0, avg: 0 }

  for (const card of content) {
    if (card.types) {
      for (const type of card.types) {
        stats.types[type] = stats.types[type] || 0
        stats.types[type] = stats.types[type]++
      }
    }

    if (card.price) {
      stats.price.num++
      stats.price.sum += card.price
      stats.price.min = Math.min(stats.price.min, card.price)
      stats.price.max = Math.max(stats.price.max, card.price)
      stats.price.avg = (stats.price.sum / stats.price.num).toFixed(2)
    }

    if (card.cmc && card.cmc > 0) {
      stats.mana.num++
      stats.mana.sum += card.cmc
      stats.mana.min = Math.min(stats.mana.min, card.cmc)
      stats.mana.max = Math.max(stats.mana.max, card.cmc)
      stats.mana.avg = (stats.mana.sum / stats.mana.num).toFixed(2)
    }

    stats.cards = stats.cards || 0
    stats.cards++
  }
}

frontend.getCollectionDetails = () => {
  const details = { collection: {}, current: {}, view: {} }

  // scan library
  for (const [, content] of Object.entries(frontend.db)) {
    frontend.getFolderDetails(content, details.collection)
    details.collection.lists = details.collection.lists || 0
    if (content.length > 0) details.collection.lists++
  }

  // scan current folder
  frontend.getFolderDetails(frontend.db[frontend.path], details.current)

  // scan current view
  frontend.getFolderDetails(frontend.view, details.view)

  return details
}

frontend.getColorIcon = (folder) => {
  const icons = [
    'BG', 'BR', 'GU', 'GW', 'RG',
    'RW', 'UB', 'UR', 'WB', 'WU'
  ]

  const colors = {}
  const identity = []

  for (const card of folder) {
    if (!card.color) continue

    for (const color of card.color) {
      colors[color] = colors[color] ? colors[color] + 1 : 1
    }
  }

  for (const [color, count] of Object.entries(colors)) {
    if (count / folder.length >= 0.10) {
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

frontend.reloadSidebar = () => {
  const divSidebar = document.getElementById('sidebar')
  divSidebar.innerHTML = ''

  /* add new folder button */
  const folderInput = document.createElement('input')
  folderInput.setAttribute('type', 'text')
  folderInput.setAttribute('id', 'folder-input')
  divSidebar.appendChild(folderInput)

  const inputEnable = function () {
    folderInput.classList.add('active')
    folderInput.value = ''
  }

  const inputDisable = function () {
    folderInput.classList.remove('active')
    folderInput.value = 'Create New Folder'
    folderInput.blur()
  }

  folderInput.onfocus = inputEnable
  folderInput.onblur = inputDisable
  folderInput.onkeydown = function (e) {
    if (e.key === 'Enter') {
      frontend.invoke['new-folder'](folderInput.value)
      inputDisable()
    }

    if (e.key === 'Escape') {
      inputDisable()
    }
  }

  inputDisable()

  /* add spacer */
  const spacerTop = document.createElement('hr')
  divSidebar.appendChild(spacerTop)

  /* add folder buttons */
  for (const [folder, content] of Object.entries(frontend.db)) {
    if (!config.showEmpty && content.length === 0) continue

    const caption = (folder === '.' ? 'Library' : folder)

    const divFolder = document.createElement('div')
    divFolder.setAttribute('id', 'folder')
    if (folder === frontend.path) {
      divFolder.classList.add('active')
    }
    divSidebar.appendChild(divFolder)

    divFolder.divCaption = document.createElement('div')
    divFolder.divCaption.setAttribute('id', 'folder-caption')
    divFolder.appendChild(divFolder.divCaption)

    divFolder.divIcon = document.createElement('img')
    divFolder.divIcon.setAttribute('id', 'folder-icon')
    divFolder.divIcon.src = `img/icons/${frontend.getColorIcon(content)}.png`
    divFolder.divCaption.appendChild(divFolder.divIcon)

    divFolder.divLabel = document.createElement('div')
    divFolder.divLabel.setAttribute('id', 'folder-label')
    divFolder.divLabel.innerHTML = caption
    divFolder.divCaption.appendChild(divFolder.divLabel)

    divFolder.divCount = document.createElement('div')
    divFolder.divCount.setAttribute('id', 'folder-count')
    divFolder.divCount.innerHTML = content ? filters.createView(content).length : 0
    divFolder.appendChild(divFolder.divCount)

    divFolder.ondragenter = function (e) {
      e.preventDefault()
      e.target.classList.add('drag')
    }

    divFolder.ondragover = function (e) {
      e.preventDefault()
    }

    divFolder.ondragleave = function (e) {
      e.preventDefault()
      e.target.classList.remove('drag')
    }

    divFolder.ondrop = function (e) {
      e.preventDefault()
      e.target.classList.remove('drag')

      const data = e.dataTransfer.getData('text/plain')

      try {
        const card = JSON.parse(data)
        frontend.invoke['move-card'](card, folder)
      } catch (e) {
        console.log("Can't handle drop input")
      }
    }

    divFolder.onclick = function () {
      frontend.path = folder
      frontend.reload()
    }
  }

  /* add spacer */
  const spacerBottom = document.createElement('hr')
  divSidebar.appendChild(spacerBottom)

  /* add show empty checkbox */
  const showEmptyContainer = document.createElement('m-grid')
  showEmptyContainer.setAttribute('horizontal', '')
  showEmptyContainer.setAttribute('id', 'folder')
  divSidebar.appendChild(showEmptyContainer)

  const showEmptyLabel = document.createElement('div')
  showEmptyLabel.innerHTML = 'Show Empty Folders'
  showEmptyLabel.style.textAlign = 'left'
  showEmptyContainer.appendChild(showEmptyLabel)

  const showEmptyInput = document.createElement('input')
  showEmptyInput.checked = config.showEmpty
  showEmptyInput.type = 'checkbox'
  showEmptyInput.style.textAlign = 'right'
  showEmptyInput.onclick = () => {
    config.showEmpty = !config.showEmpty
    frontend.reloadSidebar()
  }

  showEmptyContainer.appendChild(showEmptyInput)

  /* add combine same checkbox */
  const combineSameContainer = document.createElement('div')
  combineSameContainer.classList.add('m-grid')
  combineSameContainer.setAttribute('horizontal', '')
  combineSameContainer.setAttribute('id', 'folder')
  divSidebar.appendChild(combineSameContainer)

  const combineSameLabel = document.createElement('div')
  combineSameLabel.innerHTML = 'Combine Same Cards'
  combineSameLabel.style.textAlign = 'left'
  combineSameContainer.appendChild(combineSameLabel)

  const combineSameInput = document.createElement('input')
  combineSameInput.checked = config.combine
  combineSameInput.type = 'checkbox'
  combineSameInput.style.textAlign = 'right'
  combineSameInput.onclick = () => {
    config.combine = !config.combine
    frontend.reload()
  }

  combineSameContainer.appendChild(combineSameInput)
}

frontend.reloadStatusbar = () => {
  const details = frontend.getCollectionDetails()
  const divFooter = document.getElementById('footer')

  divFooter.innerHTML = `Collection with <b>${details.collection.cards}</b> cards in <b>${details.collection.lists}</b> folders worth <b>${details.collection.price.sum.toFixed(2)}€</b>.`
}

frontend.isSelection = (card, compare) => {
  if (!compare) return false

  if (config.combine === true && card.foil === compare.foil && card.number === compare.number && card.set === compare.set) {
    return true
  } else if (config.combine === false && card.file === compare.file) {
    return true
  } else {
    return false
  }
}

frontend.reloadViewSelection = () => {
  if (!frontend.dom.cards) return

  for (const div of frontend.dom.cards) {
    if (frontend.isSelection(div.data, frontend.selection)) {
      if (frontend.selection.currentFile) {
        div.state('active')
      } else {
        div.state('new')
        document.getElementById('content').scrollTop = div.offsetTop - 100
      }
    } else {
      div.state('normal')
    }
  }
}

frontend.reloadView = () => {
  const divContent = document.getElementById('content')

  divContent.onclick = function (e) {
    frontend.resetPreview()
    frontend.reloadViewSelection()
    e.stopPropagation()
  }

  divContent.innerHTML = ''
  frontend.dom.cards = []
  frontend.duplicates = {}

  if (!frontend.view) return

  for (const card of frontend.view) {
    const id = `${card.set}:${card.number}:${card.foil ? 'f' : ''}`

    if (config.combine === false || !frontend.duplicates[id]) {
      const mcard = document.createElement('m-card')
      mcard.combine = config.combine
      mcard.data = card

      divContent.appendChild(mcard)
      frontend.dom.cards.push(mcard)

      // write duplicate index
      frontend.duplicates[id] = true
    }
  }

  frontend.reloadViewSelection()
}

frontend.textToHtml = (str) => {
  if (!str) return ''

  // multicolor icons, separated by "/"
  const micons = /{(.+?)\/(.+?)}/gi
  str = str.replace(micons, "<img src='img/icons/$1$2.png' alt='$1$2'>")

  // normal icons, same as filename
  const icons = /{(.+?)}/gi
  str = str.replace(icons, "<img src='img/icons/$1.png' alt='$1'>")

  // turn every text in brackets small
  const small = /\((.+?)\)/gi
  str = str.replace(small, '<small><i>($1)</i></small>')

  // add a vertical spacer on each line-break
  str = str.replaceAll('\n', "<div class='vspacer'></div>")
  return str
}

frontend.reloadPreview = () => {
  frontend.dom.preview.panel.style = 'display: grid;'
  if (!frontend.selection) frontend.resetPreview()
}

frontend.uiLock = (state) => {
  const uiLock = [
    'import-button', 'menu-filter', 'card-search', 'button-color-w', 'button-color-u',
    'button-color-b', 'button-color-r', 'button-color-g', 'button-color-c', 'button-color-m'
  ]

  for (const element of uiLock) {
    document.getElementById(element).disabled = state
  }
}

frontend.reload = () => {
  // update or reset the current path
  frontend.path = frontend.db[frontend.path] ? frontend.path : '.'

  // disable certain ui elements if nothing is loaded
  if (!frontend.db[frontend.path]) {
    frontend.uiLock(true)
    return
  } else {
    frontend.uiLock(false)
  }

  // apply filters to current view
  frontend.view = filters.createView(frontend.db[frontend.path])
  frontend.details = frontend.getCollectionDetails()

  // reload ui panels
  frontend.reloadSidebar()
  frontend.reloadStatusbar()
  frontend.reloadView()
  frontend.reloadPreview()
}

frontend.resetPreview = () => {
  frontend.setPreview({
    set: '',
    number: '',
    foil: false,
    language: 'de',
    unknown: true,
    path: frontend.path
  })
}

frontend.setPreview = (card, existing) => {
  frontend.selection = card

  // write current file if preview is an existing one
  if (existing) card.currentFile = card.file

  if (card.unknown && !card.currentFile) {
    // write a dummy card & disable button
    frontend.dom.preview.info.innerHTML = 'Unknown Card'
    frontend.selection.file = './img/card-background.jpg'
  } else {
    const name = frontend.getLocale(card, 'name') || 'Unknown Card'
    const type = frontend.getLocale(card, 'type')
    const flavor = frontend.getLocale(card, 'flavor')
    const text = frontend.textToHtml(frontend.getLocale(card, 'text'))
    const mana = frontend.textToHtml(card.mana)
    if (!name) return

    frontend.dom.preview.info.innerHTML = `
      <span id="preview-metadata-mana">
        ${mana}
      </span>
      <b>${name}</b><br/>
      <div id=type>${type}</div>
      ${text}
      ${flavor ? `<div id=quote>${flavor}</div>` : ''}
    `
  }

  // adjust button label
  if (card.currentFile) {
    frontend.dom.preview.button.innerHTML = 'Update Card'
  } else {
    frontend.dom.preview.button.innerHTML = 'New Card'
  }

  // enable card button
  frontend.dom.preview.button.disabled = false

  // update preview
  frontend.dom.preview.edition.value = frontend.selection.set
  frontend.dom.preview.number.value = frontend.selection.number
  frontend.dom.preview.language.value = frontend.selection.language
  frontend.dom.preview.foil.checked = frontend.selection.foil
  frontend.dom.preview.preview.src = frontend.selection.file

  // prices
  let cardmarket = frontend.selection.prices ? frontend.selection.prices[2] : false
  let cardkingdom = frontend.selection.prices ? frontend.selection.prices[0] : false

  if (frontend.selection.foil && frontend.selection.prices) {
    cardmarket = frontend.selection.prices[3] || frontend.selection.prices[2]
    cardkingdom = frontend.selection.prices[1] || frontend.selection.prices[0]
  }

  if (cardmarket) {
    frontend.dom.preview.cardmarket.innerHTML = `CardMarket<span id=right>${cardmarket.toFixed(2)}€</span>`
    const color = cardmarket > 10 ? '#f00' : cardmarket > 1 ? '#f50' : 'inherit'
    frontend.dom.preview.cardmarket.style = `display: block; color: ${color};`
  } else {
    frontend.dom.preview.cardmarket.style = 'display: none;'
  }

  if (cardkingdom) {
    frontend.dom.preview.cardkingdom.innerHTML = `CardKingdom<span id=right>${cardkingdom.toFixed(2)}$</span>`
    const color = cardkingdom > 10 ? '#f00' : cardkingdom > 1 ? '#f50' : 'inherit'
    frontend.dom.preview.cardkingdom.style = `display: block; color: ${color};`
  } else {
    frontend.dom.preview.cardkingdom.style = 'display: none;'
  }

  // reload element width due to scrollbars
  frontend.dom.preview.panel.style.overflow = 'hidden'
  setTimeout(function () {
    frontend.dom.preview.panel.style.overflow = 'auto'
  }, 1)
}

frontend.updatePreview = () => {
  // read available data from input fields
  frontend.selection = frontend.selection || { }
  frontend.selection.set = frontend.dom.preview.edition.value.toLowerCase()
  frontend.selection.number = frontend.dom.preview.number.value
  frontend.selection.language = frontend.dom.preview.language.value
  frontend.selection.foil = !!frontend.dom.preview.foil.checked
  frontend.selection.path = frontend.path

  // remove bad characters
  frontend.selection.set = frontend.selection.set.replace(/[^a-z0-9]/gi, '')
  frontend.selection.number = frontend.selection.number.replace(/[^a-z0-9]/gi, '')

  // change ui to loading mode and invoke a card update
  frontend.dom.preview.info.innerHTML = 'Please Wait...'
  frontend.dom.preview.preview.src = './img/card-background.jpg'
  frontend.dom.preview.button.disabled = true

  frontend.invoke['load-card'](frontend.selection)
}

frontend.newCard = async () => {
  if (!frontend.selection) return

  const card = frontend.selection
  const identifier = `[${card.set}.${card.number}.${card.language}${card.foil ? '.f' : ''}]`

  popups.show(`${frontend.getLocale(card, 'name')}`, identifier, 0)
  await frontend.invoke['add-card'](card)
  popups.show(`${frontend.getLocale(card, 'name')}`, identifier, 1)
}

frontend.invoke = {
  'add-card': (data) => { /* dummy */ },
  'load-card': (data) => { /* dummy */ }
}

frontend.event = {
  'update-collection': (event, data) => {
    frontend.db = data
    frontend.reload()
  },
  'add-card-update': (event, card) => {
    // only update if current selection is still the same
    const uiCard = frontend.selection
    if (frontend.objcompare(uiCard, card, ['set', 'number', 'foil', 'language'])) {
      frontend.setPreview(card)
    }
  }
}

frontend.init = () => {
  frontend.dom.preview = {
    panel: document.getElementById('preview'),
    info: document.getElementById('preview-metadata'),
    edition: document.getElementById('preview-edition'),
    number: document.getElementById('preview-number'),
    foil: document.getElementById('preview-foil'),
    language: document.getElementById('preview-language'),
    preview: document.getElementById('preview-image'),
    button: document.getElementById('preview-add-card'),
    cardmarket: document.getElementById('preview-cardmarket'),
    cardkingdom: document.getElementById('preview-cardkingdom')
  }

  frontend.dom.headerbar = {
    open: document.getElementById('open-button'),
    import: document.getElementById('import-button'),
    metadata: document.getElementById('download-button')
  }

  frontend.dom.windowcontrols = {
    minimize: document.getElementById('window-minimize'),
    maximize: document.getElementById('window-maximize'),
    close: document.getElementById('window-close')
  }

  // add current card to library
  frontend.dom.preview.edition.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') frontend.newCard()
  })

  frontend.dom.preview.number.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') frontend.newCard()
  })

  frontend.dom.preview.button.addEventListener('click', async () => {
    frontend.newCard()
  })

  // refresh card (metadata and artwork) on each keypress
  frontend.dom.preview.edition.addEventListener('input', frontend.updatePreview)
  frontend.dom.preview.number.addEventListener('input', frontend.updatePreview)
  frontend.dom.preview.foil.addEventListener('input', frontend.updatePreview)
  frontend.dom.preview.language.addEventListener('input', frontend.updatePreview)

  frontend.dom.headerbar.open.addEventListener('click', async () => {
    frontend.invoke['open-folder']()
  })

  frontend.dom.headerbar.import.addEventListener('click', async () => {
    frontend.invoke['import-backup'](frontend.path)
  })

  frontend.dom.headerbar.metadata.addEventListener('click', async () => {
    frontend.invoke['download-metadata'](frontend.path)
  })

  frontend.dom.windowcontrols.minimize.addEventListener('click', frontend.invoke['window-minimize'])
  frontend.dom.windowcontrols.maximize.addEventListener('click', frontend.invoke['window-maximize'])
  frontend.dom.windowcontrols.close.addEventListener('click', frontend.invoke['window-close'])
}

window.addEventListener('DOMContentLoaded', frontend.init)
