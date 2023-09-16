import { html, css } from '../widgets/m-template.js'

export default class UIWindowSidebarSingle extends HTMLElement {
  static shadow = null

  static template = html`
    <m-grid vertical=1>
      <div>
        <img id="image" src="../../assets/cards/background.jpg" />
      </div>

      <div>
        <m-button id="add-card">Add Card</m-button>
      </div>

      <m-grid horizontal=1>
        <div class="left" id="edition-label">Edition:</div>
        <div class="right"><m-input id="edition-input" type="text" placeholder="Edition (e.g: MH2)"/></div>
      </m-grid>

      <m-grid horizontal=1>
        <div class="left" id="number-label">Number:</div>
        <div class="right"><m-input id="number-input" type="text" placeholder="Number (e.g: 123)" /></div>
      </m-grid>

      <m-grid horizontal=1>
        <div class="left" id="language-label">Language:</div>
        <div class="right">
          <select id="language-input" name="language" id="language">
            <option value="grc">Ancient Greek</option>
            <option value="ar">Arabic</option>
            <option value="zhs">Chinese Simplified</option>
            <option value="zht">Chinese Traditional</option>
            <option value="en">English</option>
            <option value="fr">French</option>
            <option value="de" selected="selected">German</option>
            <option value="he">Hebrew</option>
            <option value="it">Italian</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
            <option value="la">Latin</option>
            <option value="ph">Phyrexian</option>
            <option value="pt">Portuguese (Brazil)</option>
            <option value="ru">Russian</option>
            <option value="sa">Sanskrit</option>
            <option value="es">Spanish</option>
          </select>
        </div>
      </m-grid>

      <m-grid horizontal=1>
        <div class="left" id="foil-label">Foil:</div>
        <div class="right">
          <input id="foil-input" type="checkbox" />
        </div>
      </m-grid>

      <m-grid horizontal=1>
        <div class="left" id="price-cm-label">Card Market</div>
        <div class="right" id="price-cm-value">N/A</div>
      </m-grid>

      <m-grid horizontal=1>
        <div class="left" id="price-ck-label">Card Kingdom</div>
        <div class="right" id="price-ck-value">N/A</div>
      </m-grid>

      <div id="metadata"></div>

    </m-grid>
  `

  static style = css`
    :host {
    }

    #image {
      width: 100%;
      aspect-ratio: 2.5/3.5;
      border: 1px var(--border-normal) solid;
      box-sizing: border-box;
    }

    #metadata {
      overflow: auto;
      border: 1px var(--border-normal) solid;
      background: var(--window-dark);
      padding: 4px;
      line-height: 20px;
      text-align: left;
      margin: 4px 0px;
    }

    #metadata img {
      height: 14px;
      vertical-align: middle;
      margin: 0px 1px;
    }

    #metadata small img {
      height: 12px;
      vertical-align: middle;
      margin: 0px 1px;
    }

    #metadata #quote {
      font-style: italic;
      color: var(--font-dark);

      border-top: 1px var(--border-normal) solid;
      padding: 2px 0px;
      margin: 4px 0px;
    }

    #metadata #type {
      border-bottom: 1px var(--border-normal) solid;
      padding: 2px 0px;
      margin: 4px 0px;
    }

    #metadata div.vspacer {
      height: 8px;
    }

    #metadata-mana {
      float: right;
    }

    #metadata-mana img {
      height: 16px;
    }


    #edition-input::part(input) {
      text-transform: uppercase;
    }

    #edition-input::part(input)::placeholder {
      text-transform: none;
    }

    m-grid[vertical] {
      padding: 8px;
    }

    m-grid[horizontal] {
      padding: 4px 0px;
    }

    m-button {
      width: 100%;
      margin: 4px 0px;
    }

    m-input::part(input) {
      text-align: right;
    }

    m-input, select {
      box-sizing: border-box;
      text-align: right;
      width: 180px;
    }

    select {
      background: var(--widget-light);
      border: 1px var(--border-normal) solid;
      padding: 6px;
    }

    select:hover {
      background: var(--widget-normal);
    }

    select:active {
      background: var(--widget-dark);
    }

    select:focus {
      outline: none;
    }

    input[type=checkbox] {
      width: 16px;
      height: 18px;
    }

    .left {
      text-align: left;
    }

    .right {
      text-align: right;
    }
  `

  dom = {}
  folder = "."

  get_card = () => {
    return {
      folder: this.folder,
      edition: this.dom['edition-input'].value,
      number: this.dom['number-input'].value,
      language: this.dom['language-input'].value,
      foil: this.dom['foil-input'].checked,
      fsurl: this.card.fsurl || undefined
    }
  }

  set_card = (card) => {
    this.card = card || {}

    if (card && card.metadata) {
      this.dom['image'].src = card.preview || card.fsurl

      const name = macaco.getLocale(card, 'name') || 'Unknown Card'
      const type = macaco.getLocale(card, 'type')
      const flavor = macaco.getLocale(card, 'flavor') || false
      const text = macaco.getTextHtml(macaco.getLocale(card, 'text'))
      const mana = macaco.getTextHtml(card.metadata.mana)

      this.dom['metadata'].innerHTML = `
        <span id="metadata-mana">
          ${mana}
        </span>
        <b>${name}</b><br/>
        <div id=type>${type}</div>
        ${text}
        ${flavor && flavor != null ? `<div id=quote>${flavor}</div>` : ''}
      `

      let [ cm, ck, cm_col, ck_col ] = [ "N/A", "N/A", false, false ]

      if (card.metadata.prices) {
        const cm = card.foil ? card.metadata.prices[3] : card.metadata.prices[2]
        const ck = card.foil ? card.metadata.prices[1] : card.metadata.prices[0]

        const cm_col = cm >= 10.0 ? "#f22" : cm >= 5.0 ? "#f62" : cm >= 1.0 ? "#fa2" : "var(--font-normal)"
        const ck_col = ck >= 10.0 ? "#f22" : ck >= 5.0 ? "#f62" : ck >= 1.0 ? "#fa2" : "var(--font-normal)"

        this.dom['price-cm-value'].innerHTML = `${cm.toFixed(2)} €`
        this.dom['price-cm-value'].style.color = cm_col

        this.dom['price-ck-value'].innerHTML = `${ck.toFixed(2)} $`
        this.dom['price-ck-value'].style.color = ck_col
      } else {
        this.dom['price-cm-value'].innerHTML = "N/A"
        this.dom['price-cm-value'].style.color = "var(--font-normal)"

        this.dom['price-ck-value'].innerHTML = "N/A"
        this.dom['price-ck-value'].style.color = "var(--font-normal)"
      }
    } else {
      this.dom['image'].src = '../../assets/cards/background.jpg'
      this.dom['metadata'].innerHTML = ""

      this.dom['price-cm-value'].innerHTML = "N/A"
      this.dom['price-cm-value'].style.color = "var(--font-normal)"

      this.dom['price-ck-value'].innerHTML = "N/A"
      this.dom['price-ck-value'].style.color = "var(--font-normal)"
    }
  }

  compare_card = (card1, card2) => {
    if (card1.edition !== card2.edition) return false
    if (card1.number !== card2.number) return false
    if (card1.language !== card2.language) return false
    if (card1.foil !== card2.foil) return false

    return true
  }

  constructor () {
    super()

    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.adoptedStyleSheets = [this.constructor.style]
    this.shadow.append(document.importNode(this.constructor.template, true))

    for (const e of this.shadow.querySelectorAll('*')) {
      if(e.id) this.dom[e.id] = this.shadow.getElementById(e.id)
    }

    macaco.events.register('update-collection-folder', (ev, folder) => {
      this.folder = folder
    })

    macaco.ipc.register('update-card-preview', (ev, card, query) => {
      const current = this.get_card()
      if (this.compare_card(current, query) === false) return
      this.set_card(card)
    })

    macaco.events.register('update-collection-selection', (ev, selection) => {
      if (selection[0]) {
        this.dom['edition-input'].value = selection[0].edition
        this.dom['number-input'].value = selection[0].number
        this.dom['language-input'].value = selection[0].language
        this.dom['foil-input'].checked = selection[0].foil
        this.dom['add-card'].innerHTML = 'Update Card'
      } else {
        this.dom['edition-input'].value = ""
        this.dom['number-input'].value = ""
        this.dom['foil-input'].checked = false
        this.dom['add-card'].innerHTML = 'Add Card'
      }

      this.set_card(selection[0])
    })

    /* preview and new card */
    this.dom['edition-input'].onkeyup = (ev) => {
      if (ev.key === 'Enter') {
        macaco.ipc.invoke('add-update-card', this.get_card())
      } else {
        macaco.ipc.invoke('set-card-preview', this.get_card())
      }
    }

    this.dom['number-input'].onkeyup = (ev) => {
      if (ev.key === 'Enter') {
        macaco.ipc.invoke('add-update-card', this.get_card())
      } else {
        macaco.ipc.invoke('set-card-preview', this.get_card())
      }
    }

    this.dom['language-input'].onchange = (ev) => {
      macaco.ipc.invoke('set-card-preview', this.get_card())
    }

    this.dom['foil-input'].onchange = (ev) => {
      macaco.ipc.invoke('set-card-preview', this.get_card())
    }

    this.dom['add-card'].onclick = (ev) => {
      macaco.ipc.invoke('add-update-card', this.get_card())
    }

    /* overlay */
    this.dom['image'].onmouseenter = (ev) => {
      macaco.events.invoke('set-overlay-image', this.dom['image'].src)
    }

    this.dom['image'].onmouseleave = (ev) => {
      macaco.events.invoke('set-overlay-image', false)
    }
  }
}

customElements.define('ui-window-sidebar-single', UIWindowSidebarSingle)