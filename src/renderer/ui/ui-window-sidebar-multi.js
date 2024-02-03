import { html, css } from '../widgets/m-template.js'

export default class UIWindowSidebarMulti extends HTMLElement {
  static shadow = null

  static template = html`
    <div id='cards'></div>
  `

  static style = css`
    :host {
    }

    #cards {
      margin: 8px;
    }

    #cards .frame {
      margin: 0px 2px 2px;
      padding: 4px;
      border: 1px var(--border-normal) solid;
    }

    #cards .frame:hover {
      box-shadow: inset 0 0 32px 32px rgba(255, 255, 255, 0.25);
    }

    .title {
      padding: 3px;
      text-align: left;
      width: 100%;

      overflow:hidden;
      text-overflow: ellipsis;
      white-space:nowrap;

      color: black;
    }

    .mana img {
      padding: 1px;
      width: 12px;
      aspect-ratio: 1/1;
    }

    .count {
      background-color: rgba(0,0,0,.65);
      margin: 1px;
      padding: 1px;
      width: 24px;
      color: white;
    }
  `

  dom = {}

  constructor () {
    super()

    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.adoptedStyleSheets = [this.constructor.style]
    this.shadow.append(document.importNode(this.constructor.template, true))

    for (const e of this.shadow.querySelectorAll('*')) {
      if (e.id) this.dom[e.id] = this.shadow.getElementById(e.id)
    }

    const colormap = {
      W: '#f8f6d8',
      B: '#948d88',
      U: '#c1d7e9',
      R: '#e49977',
      G: '#a3c095',
      M: '#CFAC5E',
      C: '#ccc2c0',
      E: '#E55055'
    }

    macaco.events.register('update-collection-selection', (ev, selection) => {
      if (selection.length < 2) return

      this.dom.cards.innerHTML = ''

      const merged = {}

      for (const card of selection) {
        let id = `[${card.edition}.${card.number}.${card.language}${card.foil ? '.f' : ''}]`
        if (macaco.combine === 'name' && card.data && card.data.name) { id = `${card.data.name}` }

        if (merged[id]) {
          merged[id].push(card)
        } else {
          merged[id] = [card]
        }
      }

      for (const [, cards] of Object.entries(merged)) {
        const card = cards[0]
        const meta = card.metadata

        const count = cards.length
        const color = meta.color ? meta.color.length === 0 ? colormap.C : meta.color.length > 1 ? colormap.M : colormap[meta.color[0]] : colormap.E
        const name = macaco.getLocale(card, 'name')

        const element = document.createElement('m-grid')
        element.classList = 'frame'
        element.setAttribute('horizontal', '2')

        const ecount = document.createElement('div')
        ecount.classList = 'count'
        ecount.innerHTML = count

        const etitle = document.createElement('div')
        etitle.classList = 'title'
        etitle.innerHTML = name || 'Unknown Card'

        const emana = document.createElement('div')
        emana.classList = 'mana'
        emana.innerHTML = macaco.getTextHtml(meta.mana)

        element.style.backgroundColor = color
        element.appendChild(ecount)
        element.appendChild(etitle)
        element.appendChild(emana)

        element.onclick = (ev) => {
          macaco.events.invoke('set-overlay-image', card.fsurl)
        }

        this.dom.cards.appendChild(element)
      }
    })
  }
}

customElements.define('ui-window-sidebar-multi', UIWindowSidebarMulti)
