let frontend = { path: ".", db: {}, dom: {} }

let config = {
  combine: false,
  show_empty: true
}

frontend.languages = {
  "Ancient Greek": ["grc"],
  "Arabic": ["ar"],
  "Chinese Simplified": [ "zhs", "cs" ],
  "Chinese Traditional": [ "zht", "ct" ],
  "English": [ "en" ],
  "French": ["fr"],
  "German": ["de"],
  "Hebrew": [ "he" ],
  "Italian": [ "it" ],
  "Japanese": [ "ja", "jp" ],
  "Korean": [ "ko", "kr" ],
  "Latin": [ "la" ],
  "Phyrexian": [ "ph" ],
  "Portuguese (Brazil)": [ "pt" ],
  "Russian": [ "ru" ],
  "Sanskrit": [ "sa" ],
  "Spanish": [ "es", "sp" ]
}

frontend.get_locale = (card, entry) => {
  let retval = ""

  const lang_short = card.language
  for (const [language, abbreviations] of Object.entries(frontend.languages)) {
    if (abbreviations.includes(lang_short)) {
      retval = card.locales && card.locales[language] ? card.locales[language][entry] : false
      retval = retval ? retval : card.locales && card.locales["English"][entry]
    }
  }

  return retval
}

frontend.objcompare = (a, b, o) => {
  if(!a || !b) return false
  if(!o) return a == b
  for (const e of o) if(a[e] != b[e]) return false
  return true
}

frontend.reload_sidebar = () => {
  let div_sidebar = document.getElementById('sidebar')
  div_sidebar.innerHTML = ""

  /* add new folder button */
  let folder_input = document.createElement("input")
  folder_input.setAttribute('type', 'text')
  folder_input.setAttribute('id', "folder-input")
  div_sidebar.appendChild(folder_input)

  const input_enable = function() {
    folder_input.classList.add("active")
    folder_input.value = ""
  }

  const input_disable = function() {
    folder_input.classList.remove("active")
    folder_input.value = "Create New Folder"
    folder_input.blur()
  }

  folder_input.onfocus = input_enable
  folder_input.onblur = input_disable
  folder_input.onkeydown = function(e) {
    if (e.key === 'Enter') {
      frontend.invoke["new-folder"](folder_input.value)
      input_disable()
    }

    if (e.key === 'Escape') {
      input_disable()
    }
  }

  input_disable()

  /* add spacer */
  let spacer_top = document.createElement("hr")
  div_sidebar.appendChild(spacer_top)

  /* add folder buttons */
  for (const [folder, content] of Object.entries(frontend.db)) {
    if (!config.show_empty && content.length == 0) continue

    let div_folder = document.createElement("div")
    const caption = "<b>🗀</b> " + (folder == "." ? "Library" : folder)

    div_folder.setAttribute('id', "folder")

    if (folder == frontend.path) {
      div_folder.classList.add("active")
    }

    div_sidebar.appendChild(div_folder)

    div_folder.div_title = document.createElement("div")
    div_folder.div_title.setAttribute('id', 'folder-title')

    div_folder.div_title.innerHTML = caption
    div_folder.appendChild(div_folder.div_title)

    div_folder.div_count = document.createElement("div")
    div_folder.div_count.setAttribute('id', 'folder-count')
    div_folder.div_count.innerHTML = content ? filters.create_view(content).length : 0
    div_folder.appendChild(div_folder.div_count)

    div_folder.ondragenter = function(e) {
      e.preventDefault()
      e.target.classList.add("drag")
    }

    div_folder.ondragover = function(e) {
      e.preventDefault()
    }

    div_folder.ondragleave = function(e) {
      e.preventDefault()
      e.target.classList.remove('drag')
    }

    div_folder.ondrop = function(e) {
      e.preventDefault()
      e.target.classList.remove('drag')

      const data = e.dataTransfer.getData("text/plain")

      try {
        const card = JSON.parse(data)
        frontend.invoke["move-card"](card, folder)
      } catch(e) {
        console.log("Can't handle drop input")
        return
      }
    }

    div_folder.onclick = function() {
      frontend.path = folder
      frontend.reload()
    }
  }

  /* add spacer */
  let spacer_bottom = document.createElement("hr")
  div_sidebar.appendChild(spacer_bottom)

  /* add show empty checkbox */
  let show_empty_container = document.createElement("div")
  show_empty_container.classList.add("hbox")
  show_empty_container.setAttribute('id', "folder")
  div_sidebar.appendChild(show_empty_container)

  let show_empty_label = document.createElement("div")
  show_empty_label.innerHTML = "Show Empty Folders"
  show_empty_label.style.textAlign = "left"
  show_empty_container.appendChild(show_empty_label)

  let show_empty_input = document.createElement("input")
  show_empty_input.checked = config.show_empty
  show_empty_input.type = "checkbox"
  show_empty_input.style.textAlign = "right"
  show_empty_input.onclick = () => {
    config.show_empty = !config.show_empty
    frontend.reload_sidebar()
  }

  show_empty_container.appendChild(show_empty_input)

  /* add combine same checkbox */
  let combine_same_container = document.createElement("div")
  combine_same_container.classList.add("hbox")
  combine_same_container.setAttribute('id', "folder")
  div_sidebar.appendChild(combine_same_container)

  let combine_same_label = document.createElement("div")
  combine_same_label.innerHTML = "Combine Same Cards"
  combine_same_label.style.textAlign = "left"
  combine_same_container.appendChild(combine_same_label)

  let combine_same_input = document.createElement("input")
  combine_same_input.checked = config.combine
  combine_same_input.type = "checkbox"
  combine_same_input.style.textAlign = "right"
  combine_same_input.onclick = () => {
    config.combine = !config.combine
    frontend.reload()
  }

  combine_same_container.appendChild(combine_same_input)
}

frontend.reload_statusbar = () => {
  let [num_cards, num_lists, price] = [0, 0, 0]
  let div_footer = document.getElementById('footer')

  for (const [folder, content] of Object.entries(frontend.db)) {
    for (const card of content) {
      price += card.price || 0
      num_cards++
    }

    if(content.length > 0) {
      num_lists++
    }
  }

  div_footer.innerHTML = `Collection with <b>${num_cards}</b> cards in <b>${num_lists}</b> folders worth <b>${price.toFixed(2)}€</b>.`
}

frontend.reload_view_selection = () => {
  if (!frontend.dom.cards) return

  for (const div of frontend.dom.cards) {
    if (frontend.selection &&  div.data.file == frontend.selection.file) {
      if (frontend.selection.current_file) {
        div.classList.add("selection")
      } else {
        div.classList.add("new")
        document.getElementById('content').scrollTop = div.offsetTop - 100
      }
    } else {
      div.classList.remove("selection")
      div.classList.remove("new")
    }
  }
}

frontend.dom_build_card = (div_card) => {
  const card = div_card.data

  div_card.setAttribute('id', 'card')
  div_card.setAttribute("draggable", true)

  div_card.onclick = function(e) {
    frontend.set_preview(this.data, true)
    frontend.reload_view_selection()
    e.stopPropagation()
  }

  div_card.ondragstart = function(e) {
    e.dataTransfer.setData("text/plain", JSON.stringify(e.target.data))
  }

  div_card.image = document.createElement("img")
  div_card.image.setAttribute('src', card.file)
  div_card.appendChild(div_card.image)

  div_card.div_title = document.createElement("div")
  div_card.div_title.setAttribute('id', 'card-title')
  div_card.div_title.innerHTML = frontend.get_locale(card, "name")
  div_card.appendChild(div_card.div_title)

  div_card.div_pricetag = document.createElement("div")
  div_card.div_pricetag.setAttribute('id', 'card-pricetag')
  div_card.appendChild(div_card.div_pricetag)

  if (config.combine) {
    div_card.div_count = document.createElement("div")
    div_card.div_count.setAttribute('id', 'card-count')
    div_card.div_count.innerHTML = `${card.count}x`
    div_card.appendChild(div_card.div_count)
  }

  if ( card.price ) {
    div_card.div_pricetag.innerHTML = `${card.price.toFixed(2)}€`

    if ( card.price > 10.0 ) {
      div_card.div_pricetag.style = "color: #f55;"
    } else if ( card.price > 1.0 ) {
      div_card.div_pricetag.style = "color: #fa5;"
    } else {
      div_card.div_pricetag.style = "color: #fff;"
    }
  } else {
    div_card.div_pricetag.innerHTML = `N/A`
    div_card.div_pricetag.style = "color: #555;"
  }
}

frontend.reload_view = () => {
  let div_content = document.getElementById('content')
  const observer = new IntersectionObserver(function (entries, observer) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        frontend.dom_build_card(entry.target)
        observer.unobserve(entry.target)
      }
    })
  }, {
    root: div_content,
    rootMargin: "1080px",
  })

  div_content.onclick = function(e) {
    frontend.reset_preview()
    frontend.reload_view_selection()
    e.stopPropagation()
  }

  div_content.innerHTML = ""
  frontend.dom.cards = []
  frontend.duplicates = {}

  if(!frontend.view) return

  for (const card of frontend.view) {
    const id = `${card.set}:${card.number}`

    if(config.combine == false || !frontend.duplicates[id]) {
      let div_card = document.createElement("div")
      div_card.setAttribute('id', 'card-dummy')
      div_card.data = card

      div_content.appendChild(div_card)
      observer.observe(div_card)

      frontend.dom.cards.push(div_card)

      // write duplicate index
      frontend.duplicates[id] = div_card
      frontend.duplicates[id].data.count = 1
    } else {
      // increase duplicate index
      frontend.duplicates[id].data.count += 1
    }
  }

  frontend.reload_view_selection()
}

frontend.text_to_html = (str) => {
  if(!str) return ""

  // multicolor icons, separated by "/"
  const micons = /{(.+?)\/(.+?)}/gi
  str = str.replace(micons, "<img src='img/icons/$1$2.png' alt='$1$2'>")

  // normal icons, same as filename
  const icons = /{(.+?)}/gi
  str = str.replace(icons, "<img src='img/icons/$1.png' alt='$1'>")

  // turn every text in brackets small
  const small = /\((.+?)\)/gi
  str = str.replace(small, "<small><i>($1)</i></small>")

  // add a vertical spacer on each line-break
  str = str.replaceAll("\n", "<div class='vspacer'></div>")
  return str
}

frontend.reload_preview = () => {
  frontend.dom.preview.panel.style = "display: grid;"
  if(!frontend.selection) frontend.reset_preview()
}

frontend.ui_lock = (state) => {
  let ui_lock = [
    "import-button", "menu-filter", "card-search", "button-color-w", "button-color-u",
    "button-color-b", "button-color-r", "button-color-g", "button-color-c", "button-color-m",
  ]

  for (const element of ui_lock) {
    document.getElementById(element).disabled = state
  }
}

frontend.reload = () => {
  // update or reset the current path
  frontend.path = frontend.db[frontend.path] ? frontend.path : "."

  // disable certain ui elements if nothing is loaded
  if(!frontend.db[frontend.path]) {
    frontend.ui_lock(true)
    return
  } else {
    frontend.ui_lock(false)
  }

  // apply filters to current view
  frontend.view = filters.create_view(frontend.db[frontend.path])

  // reload ui panels
  frontend.reload_sidebar()
  frontend.reload_statusbar()
  frontend.reload_view()
  frontend.reload_preview()
}

frontend.reset_preview = () => {
  frontend.set_preview({
    set: "", number: "",
    foil: false, language: "de",
    unknown: true, path: frontend.path,
  })
}

frontend.set_preview = (card, existing) => {
  frontend.selection = card

  // write current file if preview is an existing one
  if (existing) card.current_file = card.file

  if (card.unknown) {
    // write a dummy card & disable button
    frontend.dom.preview.info.innerHTML = "Unknown Card"
    frontend.selection.file = "./img/card-background.jpg"
    frontend.dom.preview.button.disabled = true
  } else {
    const name = frontend.get_locale(card, "name")
    const type = frontend.get_locale(card, "type")
    const flavor = frontend.get_locale(card, "flavor")
    const text = frontend.text_to_html(frontend.get_locale(card, "text"))
    const mana = frontend.text_to_html(card.mana)

    frontend.dom.preview.info.innerHTML = `
      <span id="preview-metadata-mana">
        ${mana}
      </span>
      <b>${name}</b><br/>
      <div id=type>${type}</div>
      ${text}
      ${flavor ? `<div id=quote>${flavor}</div>` : ''}
    `

    frontend.dom.preview.button.disabled = false
  }

  // adjust button label
  if (card.current_file) {
    frontend.dom.preview.button.innerHTML = "Update Card"
  } else {
    frontend.dom.preview.button.innerHTML = "New Card"
  }

  // update preview
  frontend.dom.preview.edition.value  = frontend.selection.set
  frontend.dom.preview.number.value   = frontend.selection.number
  frontend.dom.preview.language.value = frontend.selection.language
  frontend.dom.preview.foil.checked   = frontend.selection.foil
  frontend.dom.preview.preview.src    = frontend.selection.file

  // prices
  let cardmarket = frontend.selection.prices ? frontend.selection.prices[2] : false
  let cardkingdom = frontend.selection.prices ? frontend.selection.prices[0] : false

  if (frontend.selection.foil && frontend.selection.prices) {
    cardmarket = frontend.selection.prices[3] || frontend.selection.prices[2]
    cardkingdom = frontend.selection.prices[1] || frontend.selection.prices[0]
  }

  if(cardmarket) {
    frontend.dom.preview.cardmarket.innerHTML = `CardMarket<span id=right>${cardmarket.toFixed(2)}€</span>`
    let color = cardmarket > 10 ? "#f00" : cardmarket > 1 ? '#f50' : 'inherit'
    frontend.dom.preview.cardmarket.style = `display: block; color: ${color};`
  } else {
    frontend.dom.preview.cardmarket.style = "display: none;"
  }

  if(cardkingdom) {
    frontend.dom.preview.cardkingdom.innerHTML  = `CardKingdom<span id=right>${cardkingdom.toFixed(2)}$</span>`
    let color = cardkingdom > 10 ? "#f00" : cardkingdom > 1 ? '#f50' : 'inherit'
    frontend.dom.preview.cardkingdom.style = `display: block; color: ${color};`
  } else {
    frontend.dom.preview.cardkingdom.style = "display: none;"
  }

  // reload element width due to scrollbars
  frontend.dom.preview.panel.style.overflow = "hidden"
  setTimeout(function() {
    frontend.dom.preview.panel.style.overflow = "auto"
  }, 1)
}

frontend.update_preview = () => {
  // read available data from input fields
  frontend.selection = frontend.selection || { }
  frontend.selection.set = frontend.dom.preview.edition.value.toLowerCase()
  frontend.selection.number = frontend.dom.preview.number.value
  frontend.selection.language = frontend.dom.preview.language.value
  frontend.selection.foil = frontend.dom.preview.foil.checked ? true : false
  frontend.selection.path = frontend.path

  // change ui to loading mode and invoke a card update
  frontend.dom.preview.info.innerHTML = "Please Wait..."
  frontend.dom.preview.preview.src = "./img/card-background.jpg"
  frontend.dom.preview.button.disabled = true

  frontend.invoke['load-card'](frontend.selection)
}

frontend.new_card = async () => {
  if(!frontend.selection) return
  if(frontend.selection.unknown) return

  const ui_card = frontend.selection
  const identifier = `[${ui_card.set}.${ui_card.number}.${ui_card.language}${ui_card.foil ? '.f' : ''}]`

  popups.show(`${frontend.get_locale(ui_card, "name")}`, identifier, 0)
  const new_card = await frontend.invoke['add-card'](ui_card)
  popups.show(`${frontend.get_locale(ui_card, "name")}`, identifier, 1)
}

frontend.invoke = {
  'add-card':  (data) => { /* dummy */ },
  'load-card': (data) => { /* dummy */ }
}

frontend.event = {
 'update-collection': (event, data) => {
    frontend.db = data
    frontend.reload()
  },
  'add-card-update': (event, card) => {
    // only update if current selection is still the same
    const ui_card = frontend.selection
    if(frontend.objcompare(ui_card, card, ["set", "number", "foil", "language"])) {
      frontend.set_preview(card)
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
    cardkingdom: document.getElementById('preview-cardkingdom'),
  }

  frontend.dom.headerbar = {
    open: document.getElementById('open-button'),
    import: document.getElementById('import-button'),
    metadata: document.getElementById('download-button'),
  }

  frontend.dom.windowcontrols = {
    minimize: document.getElementById('window-minimize'),
    maximize: document.getElementById('window-maximize'),
    close: document.getElementById('window-close'),
  }

  // add current card to library
  frontend.dom.preview.edition.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') frontend.new_card()
  })

  frontend.dom.preview.number.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') frontend.new_card()
  })

  frontend.dom.preview.button.addEventListener('click', async() => {
    frontend.new_card()
  })

  // refresh card (metadata and artwork) on each keypress
  frontend.dom.preview.edition.addEventListener("input", frontend.update_preview)
  frontend.dom.preview.number.addEventListener("input", frontend.update_preview)
  frontend.dom.preview.foil.addEventListener("input", frontend.update_preview)
  frontend.dom.preview.language.addEventListener("input", frontend.update_preview)

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
