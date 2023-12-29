import { html, css } from '../widgets/m-template.js'

export default class UIWindowHeader extends HTMLElement {
  static shadow = null

  static template = html`
    <div> <!-- toolbar main buttons -->
      <m-button id="open-collection">${macaco.icons.open}</m-button>
    </div>

    <div> <!-- mana icon buttons -->
      <m-button class="mana" id="button-color-w" disabled>${macaco.icons.white}</m-button>
      <m-button class="mana" id="button-color-u" disabled>${macaco.icons.blue}</m-button>
      <m-button class="mana" id="button-color-b" disabled>${macaco.icons.black}</m-button>
      <m-button class="mana" id="button-color-r" disabled>${macaco.icons.red}</m-button>
      <m-button class="mana" id="button-color-g" disabled>${macaco.icons.green}</m-button>
      <m-button class="mana" id="button-color-c" disabled>${macaco.icons.colorless}</m-button>
      <m-button class="mana" id="button-color-m" disabled>${macaco.icons.multicolor}</m-button>
    </div>

    <div> <!-- toolbar search -->
      <m-input id="search" type="text" placeholder="Search..." disabled/>
    </div>

    <div> <!-- toolbar menu buttons -->
      <m-button class="menu-button" id="menu-filter" disabled>${macaco.icons.filter}</m-button>
      <m-button class="menu-button" id="menu-statistics" disabled>${macaco.icons.details}</m-button>
      <m-button class="menu-button" id="menu-main">${macaco.icons.menu}</m-button>
    </div>

    <div id="window-buttons"> <!-- window controls -->
      <m-button id="window-minimize">${macaco.icons.minimize}</m-button>
      <m-button id="window-maximize">${macaco.icons.maximize}</m-button>
      <m-button id="window-close">${macaco.icons.close}</m-button>
    </div>
  `

  static style = css`
    :host {
      grid-area: header;
      background: var(--window-normal);
      padding: 6px;
      display: grid;
      grid-template-columns: auto auto 1fr auto auto;
      gap: 24px;
      border-bottom: 1px var(--border-dark) solid;

      height: 36px;
      -webkit-app-region: drag;
    }

    m-button, m-input {
      -webkit-app-region: no-drag;
    }

    #search {
      box-sizing: border-box;
      width: 100%;
    }

    div {
      height: 34px;
    }

    m-input {
      height: 100%;
    }

    m-button {
      height: 100%;
      aspect-ratio: 1/1;
    }

    #button-color-w.checked { background: #f8f6d8; }
    #button-color-u.checked { background: #c1d7e9; }
    #button-color-b.checked { background: #bab1ab; }
    #button-color-r.checked { background: #e49977; }
    #button-color-g.checked { background: #a3c095; }
    #button-color-c.checked { background: #ccc2c0; }
    #button-color-m.checked { background: #CFAC5E; }
    .mana.checked svg path { fill: #000 !important; }

    #window-buttons {
      grid-template-columns: auto auto auto;
      display: grid;
      justify-items: center;
      align-items: center;
    }

    #window-buttons m-button {
      height: 26px !important;
      width: 26px !important;

      display: grid;
      justify-items: center;
      align-items: center;
      margin: auto 4px;
    }
  `

  dom = {}

  constructor () {
    super()

    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.adoptedStyleSheets = [this.constructor.style]
    this.shadow.append(document.importNode(this.constructor.template, true))

    for (const e of this.shadow.querySelectorAll('*')) {
      if(e.id) this.dom[e.id] = this.shadow.getElementById(e.id)
    }

    // enable all inputs when collection gets loaded
    macaco.events.register('update-collection-contents', (ev, contents) => {
      const uiLock = [
        'button-color-w', 'button-color-u', 'button-color-b', 'button-color-r',
        'button-color-g', 'button-color-c', 'button-color-m', 'search',
        'menu-filter', 'menu-statistics', 'menu-main'
      ]

      for (const element of uiLock) {
        this.dom[element].disabled = false
      }
    })

    // add events to dom
    this.dom['open-collection'].addEventListener('click', (ev) => {
      macaco.ipc.invoke('set-collection')
    })

    this.dom['window-minimize'].addEventListener('click', (ev) => {
      macaco.ipc.invoke('window-minimize')
    })

    this.dom['window-maximize'].addEventListener('click', (ev) => {
      macaco.ipc.invoke('window-maximize')
    })

    this.dom['window-close'].addEventListener('click', (ev) => {
      macaco.ipc.invoke('window-close')
    })

    this.dom['menu-filter'].addEventListener('click', (ev) => {
      macaco.events.invoke('set-menu', 'filter', this.dom['menu-filter'])
    })

    this.dom['menu-statistics'].addEventListener('click', (ev) => {
      macaco.events.invoke('set-menu', 'statistics', this.dom['menu-statistics'])
    })

    this.dom['menu-main'].addEventListener('click', (ev) => {
      macaco.events.invoke('set-menu', 'main', this.dom['menu-main'])
    })

    // filters: color
    for (const color of ['w', 'u', 'b', 'r', 'g', 'c', 'm']) {
      this.dom[`button-color-${color}`].onclick = (ev) => {
        const state = !this.dom[`button-color-${color}`].checked
        macaco.events.invoke('set-filter', 'color', color, state)
      }

      macaco.events.register(`update-filter`, (ev, filter) => {
        const state = filter.get('color', color)
        this.dom[`button-color-${color}`].checked = state
      })
    }

    // filters: text
    this.dom['search'].onkeyup = (ev) => {
      if (this.dom['search'].value === this.dom['search'].previous) return
      this.dom['search'].previous = this.dom['search'].value
      macaco.events.invoke('set-filter', 'text', this.dom['search'].value)
    }

    macaco.events.register(`update-filter`, (ev, filter) => {
      const text = filter.get('text')

      // do not remove whitespaces at the end while typing
      if(this.dom['search'].value.trim() !== text) {
        this.dom['search'].previous = text
        this.dom['search'].value = text
      }
    })
  }
}

customElements.define('ui-window-header', UIWindowHeader)
