let collection = { path: ".", db: {}, dom: {} }

collection.objcompare = (a, b, o) => {
  if(!a || !b) return false
  if(!o) return a == b
  for (const e of o) if(a[e] != b[e]) return false
  return true
}

collection.reload_sidebar = () => {
  let div_sidebar = document.getElementById('sidebar')
  div_sidebar.innerHTML = ""

  for (const [folder, content] of Object.entries(collection.db)) {
    let div_folder = document.createElement("div")
    div_folder.setAttribute('id', "folder")

    if (folder == collection.path) {
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
      collection.path = folder
      collection.reload()
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
      collection.invoke["new-folder"](folder_input.value)
      input_disable()
    }

    if (e.key === 'Escape') {
      input_disable()
    }
  }

  input_disable()
}

collection.reload_statusbar = () => {
  let [num_cards, num_lists] = [0, 0]
  let div_footer = document.getElementById('footer')

  for (const [folder, content] of Object.entries(collection.db)) {
    num_cards += content.length
    num_lists++
  }

  div_footer.innerHTML = `<b>${num_cards}</b> Cards | <b>${num_lists}</b> Folders`
}

collection.reload_view_selection = () => {
  if (!collection.dom.cards) return

  for (const div of collection.dom.cards) {
    if (collection.selection &&  div.data.file == collection.selection.file) {
      if (collection.selection.current_file) {
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

collection.reload_view = () => {
  let view = collection.db[collection.path]
  let div_content = document.getElementById('content')

  div_content.onclick = function(e) {
    collection.reset_preview()
    collection.reload_view_selection()
    e.stopPropagation()
  }

  div_content.innerHTML = ""
  collection.dom.cards = []


  for (const card of view) {
    let div_card = document.createElement("div")
    collection.dom.cards.push(div_card)

    div_card.data = card
    div_card.onclick = function(e) {
      collection.set_preview(this.data, true)
      collection.reload_view_selection()
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

  collection.reload_view_selection()
}

collection.text_to_html = (str) => {
  if(!str) return ""

  const icons = /{(.+?)}/gi
  str = str.replace(icons, "<img src='img/icons/$1.png' alt='$1'>")

  const small = /\((.+?)\)/gi
  str = str.replace(small, "<small><i>($1)</i></small>")

  str = str.replaceAll("\n", "<div class='vspacer'></div>")
  return str
}

collection.reload_preview = () => {
  collection.dom.preview.panel.style = "display: grid;"
  if(!collection.selection) collection.reset_preview()
}

collection.reload = () => {
  collection.reload_sidebar()
  collection.reload_statusbar()
  collection.reload_view()
  collection.reload_preview()
}

collection.reset_preview = () => {
  collection.set_preview({
    set: "", number: "",
    foil: false, language: "en",
    unknown: true, path: collection.path,
  })
}

collection.set_preview = (card, existing) => {
  collection.selection = card

  // write current file if preview is an existing one
  if (existing) card.current_file = card.file

  if (card.unknown) {
    // write a dummy card & disable button
    collection.dom.preview.info.innerHTML = "Unknown Card"
    collection.selection.file = "./img/card-background.jpg"
    collection.dom.preview.button.disabled = true
  } else {
    collection.dom.preview.info.innerHTML = `
      <span id="preview-metadata-mana">
        ${collection.text_to_html(collection.selection.manacost)}
      </span>
      <b>${collection.selection.name ? collection.selection.name : ''}</b><br/>
      <div id=type>${collection.selection.type ? collection.selection.type : ''}</div>
      ${collection.text_to_html(collection.selection.text)}
      ${card.flavor ? `<div id=quote>${card.flavor}</div>` : ''}
    `

    collection.dom.preview.button.disabled = false
  }

  // adjust button label
  if (card.current_file) {
    collection.dom.preview.button.innerHTML = "Update Card"
  } else {
    collection.dom.preview.button.innerHTML = "New Card"
  }

  // update preview
  collection.dom.preview.edition.value  = collection.selection.set
  collection.dom.preview.number.value   = collection.selection.number
  collection.dom.preview.language.value = collection.selection.language
  collection.dom.preview.foil.checked   = collection.selection.foil
  collection.dom.preview.preview.src    = collection.selection.file

  // prices
  const cardmarket = collection.selection.foil ? collection.selection.price_foil_cardmarket : collection.selection.price_normal_cardmarket
  const cardkingdom = collection.selection.foil ? collection.selection.price_foil_cardkingdom : collection.selection.price_normal_cardkingdom
  if(cardmarket) {
    collection.dom.preview.cardmarket.innerHTML = `CardMarket<span id=right>${cardmarket.toFixed(2)}€</span>`
    let color = cardmarket > 10 ? "#f00" : cardmarket > 1 ? '#f50' : '#000'
    collection.dom.preview.cardmarket.style = `display: block; color: ${color};`
  } else {
    collection.dom.preview.cardmarket.style = "display: none;"
  }

  if(cardkingdom) {
    collection.dom.preview.cardkingdom.innerHTML  = `CardKingdom<span id=right>${cardkingdom.toFixed(2)}$</span>`
    let color = cardkingdom > 10 ? "#f00" : cardkingdom > 1 ? '#f50' : '#000'
    collection.dom.preview.cardkingdom.style = `display: block; color: ${color};`
  } else {
    collection.dom.preview.cardkingdom.style = "display: none;"
  }
}

collection.update_preview = () => {
  // read available data from input fields
  collection.selection = collection.selection || { }
  collection.selection.set = collection.dom.preview.edition.value.toLowerCase()
  collection.selection.number = collection.dom.preview.number.value
  collection.selection.language = collection.dom.preview.language.value
  collection.selection.foil = collection.dom.preview.foil.checked ? true : false
  collection.selection.path = collection.path

  // change ui to loading mode and invoke a card update
  collection.dom.preview.info.innerHTML = "Please Wait..."
  collection.dom.preview.preview.src = "./img/card-background.jpg"
  collection.dom.preview.button.disabled = true

  collection.invoke['load-card'](collection.selection)
}

collection.new_card = async () => {
  if(!collection.selection) return

  const ui_card = collection.selection
  const identifier = `[${ui_card.set}.${ui_card.number}.${ui_card.language}${ui_card.foil ? '.f' : ''}]`

  popups.show(`${ui_card.name}`, identifier, 0)
  const new_card = await collection.invoke['add-card'](ui_card)
  popups.show(`${ui_card.name}`, identifier, 1)
}

collection.invoke = {
  'add-card':  (data) => { /* dummy */ },
  'load-card': (data) => { /* dummy */ }
}

collection.event = {
 'update-collection': (event, data) => {
    collection.db = data
    collection.reload()
  },
  'add-card-update': (event, card) => {
    // only update if current selection is still the same
    const ui_card = collection.selection
    if(collection.objcompare(ui_card, card, ["set", "number", "foil", "language"])) {
      collection.set_preview(card)
    }
  }
}

collection.init = () => {
  collection.dom.preview = {
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

  collection.dom.headerbar = {
    open: document.getElementById('open-button'),
    import: document.getElementById('import-button'),
    metadata: document.getElementById('download-button'),
  }

  // add current card to library
  collection.dom.preview.edition.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') collection.new_card()
  })

  collection.dom.preview.number.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') collection.new_card()
  })

  collection.dom.preview.button.addEventListener('click', async() => {
    collection.new_card()
  })

  // refresh card (metadata and artwork) on each keypress
  collection.dom.preview.edition.addEventListener("input", collection.update_preview)
  collection.dom.preview.number.addEventListener("input", collection.update_preview)
  collection.dom.preview.foil.addEventListener("input", collection.update_preview)
  collection.dom.preview.language.addEventListener("input", collection.update_preview)

  collection.dom.headerbar.open.addEventListener('click', async () => {
    collection.invoke['open-folder']()
  })

  collection.dom.headerbar.import.addEventListener('click', async () => {
    collection.invoke['import-backup'](collection.path)
  })

  collection.dom.headerbar.metadata.addEventListener('click', async () => {
    collection.invoke['download-metadata'](collection.path)
  })
}

window.addEventListener('DOMContentLoaded', collection.init)
