let frontend = { path: ".", db: {}, dom: {} }

frontend.objcompare = (a, b, o) => {
  if(!a || !b) return false
  if(!o) return a == b
  for (const e of o) if(a[e] != b[e]) return false
  return true
}

frontend.reload_sidebar = () => {
  let div_sidebar = document.getElementById('sidebar')
  div_sidebar.innerHTML = ""

  for (const [folder, content] of Object.entries(frontend.db)) {
    let div_folder = document.createElement("div")
    div_folder.setAttribute('id', "folder")

    if (folder == frontend.path) {
      div_folder.classList.add("active")
    }

    div_sidebar.appendChild(div_folder)

    div_folder.div_title = document.createElement("div")
    div_folder.div_title.setAttribute('id', 'folder-title')

    div_folder.div_title.innerHTML = "<b>🗀</b> " + (folder == "." ? "Library" : folder)
    div_folder.appendChild(div_folder.div_title)

    div_folder.div_count = document.createElement("div")
    div_folder.div_count.setAttribute('id', 'folder-count')
    div_folder.div_count.innerHTML = content.length
    div_folder.appendChild(div_folder.div_count)

    div_folder.onclick = function() {
      frontend.path = folder
      frontend.reload()
    }
  }

  /* add folder button */
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
    folder_input.value = "New Folder"
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
}

frontend.reload_statusbar = () => {
  let [num_cards, num_lists] = [0, 0]
  let div_footer = document.getElementById('footer')

  for (const [folder, content] of Object.entries(frontend.db)) {
    num_cards += content.length
    num_lists++
  }

  div_footer.innerHTML = `<b>${num_cards}</b> Cards | <b>${num_lists}</b> Folders`
}

frontend.reload_view_selection = () => {
  if (!frontend.dom.cards) return

  for (const div of frontend.dom.cards) {
    if (frontend.selection &&  div.data.file == frontend.selection.file) {
      if (frontend.selection.current_file) {
        div.classList.add("selection")
      } else {
        div.classList.add("new")
      }
    } else {
      div.classList.remove("selection")
      div.classList.remove("new")
    }
  }
}

frontend.reload_view = () => {
  let view = frontend.db[frontend.path]
  let div_content = document.getElementById('content')

  div_content.onclick = function(e) {
    frontend.reset_preview()
    frontend.reload_view_selection()
    e.stopPropagation()
  }

  div_content.innerHTML = ""
  frontend.dom.cards = []


  for (const card of view) {
    let div_card = document.createElement("div")
    frontend.dom.cards.push(div_card)

    div_card.data = card
    div_card.onclick = function(e) {
      frontend.set_preview(this.data, true)
      frontend.reload_view_selection()
      e.stopPropagation()
    }

    div_card.setAttribute('id', 'card')
    div_content.appendChild(div_card)

    div_card.image = document.createElement("img")
    div_card.image.src = card.file
    div_card.appendChild(div_card.image)

    div_card.div_title = document.createElement("div")
    div_card.div_title.setAttribute('id', 'card-title')
    div_card.div_title.innerHTML = card.name
    div_card.appendChild(div_card.div_title)

    div_card.div_pricetag = document.createElement("div")
    div_card.div_pricetag.setAttribute('id', 'card-pricetag')
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

    div_card.appendChild(div_card.div_pricetag)
  }

  frontend.reload_view_selection()
}

frontend.text_to_html = (str) => {
  if(!str) return ""

  const icons = /{(.+?)}/gi
  str = str.replace(icons, "<img src='img/icons/$1.png' alt='$1'>")

  const small = /\((.+?)\)/gi
  str = str.replace(small, "<small><i>($1)</i></small>")

  str = str.replaceAll("\n", "<div class='vspacer'></div>")
  return str
}

frontend.reload_preview = () => {
  frontend.dom.preview.panel.style = "display: grid;"
  if(!frontend.selection) frontend.reset_preview()
}

frontend.reload = () => {
  frontend.path = frontend.db[frontend.path] ? frontend.path : "."

  if(!frontend.db[frontend.path]) {
    frontend.dom.headerbar.import.disabled = true
    return
  } else {
    frontend.dom.headerbar.import.disabled = false
  }

  frontend.reload_sidebar()
  frontend.reload_statusbar()
  frontend.reload_view()
  frontend.reload_preview()
}

frontend.reset_preview = () => {
  frontend.set_preview({
    set: "", number: "",
    foil: false, language: "en",
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
    frontend.dom.preview.info.innerHTML = `
      <span id="preview-metadata-mana">
        ${frontend.text_to_html(frontend.selection.manacost)}
      </span>
      <b>${frontend.selection.name ? frontend.selection.name : ''}</b><br/>
      <div id=type>${frontend.selection.type ? frontend.selection.type : ''}</div>
      ${frontend.text_to_html(frontend.selection.text)}
      ${card.flavor ? `<div id=quote>${card.flavor}</div>` : ''}
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
  const cardmarket = frontend.selection.foil ? frontend.selection.price_foil_cardmarket : frontend.selection.price_normal_cardmarket
  const cardkingdom = frontend.selection.foil ? frontend.selection.price_foil_cardkingdom : frontend.selection.price_normal_cardkingdom
  if(cardmarket) {
    frontend.dom.preview.cardmarket.innerHTML = `CardMarket<span id=right>${cardmarket.toFixed(2)}€</span>`
    let color = cardmarket > 10 ? "#f00" : cardmarket > 1 ? '#f50' : '#000'
    frontend.dom.preview.cardmarket.style = `display: block; color: ${color};`
  } else {
    frontend.dom.preview.cardmarket.style = "display: none;"
  }

  if(cardkingdom) {
    frontend.dom.preview.cardkingdom.innerHTML  = `CardKingdom<span id=right>${cardkingdom.toFixed(2)}$</span>`
    let color = cardkingdom > 10 ? "#f00" : cardkingdom > 1 ? '#f50' : '#000'
    frontend.dom.preview.cardkingdom.style = `display: block; color: ${color};`
  } else {
    frontend.dom.preview.cardkingdom.style = "display: none;"
  }
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

  popups.show(`${ui_card.name}`, identifier, 0)
  const new_card = await frontend.invoke['add-card'](ui_card)
  popups.show(`${ui_card.name}`, identifier, 1)
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
}

window.addEventListener('DOMContentLoaded', frontend.init)
