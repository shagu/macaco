import { html, css } from '../widgets/m-template.js'

export default class UIWindowSidebar extends HTMLElement {
  static shadow = null

  static template = html`
    <div id='container-box'>
      <ui-window-sidebar-single id="single"></ui-window-sidebar-single>
      <ui-window-sidebar-multi id="multi"></ui-window-sidebar-multi>
    </div>
  `

  static style = css`
    :host {
    }

    #single {
      min-width: 280px;
    }

    #multi {
      min-width: 280px;
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

    this.dom['container-box'].style.display = 'none'
    macaco.events.register('update-collection-contents', (ev, contents) => {
      this.dom['container-box'].style.display = 'block'
    })

    macaco.events.register('update-collection-selection', (ev, selection) => {
      /* change visibility based on selection contents */
      if (selection.length === 0 || (selection.length === 1)) {
        this.dom.single.style.display = 'block'
        this.dom.multi.style.display = 'none'
      } else {
        this.dom.single.style.display = 'none'
        this.dom.multi.style.display = 'block'
      }
    })
  }
}

customElements.define('ui-window-sidebar', UIWindowSidebar)
