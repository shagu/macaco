import { html, css } from '../widgets/m-template.js'

export default class UIWindowSidebar extends HTMLElement {
  static shadow = null

  static template = html`
    <ui-window-sidebar-single id="single"></ui-window-sidebar-single>
    <ui-window-sidebar-multi id="multi"></ui-window-sidebar-multi>
  `

  static style = css`
    :host {
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

    macaco.events.register('update-collection-selection', (ev, selection) => {
      /* detect if multi selection has same cards */
      let combined = true
      let current = false

      for(const card of selection) {
        let id = `[${card.edition}.${card.number}.${card.language}${card.foil ? '.f' : ''}]`
        if (!current || current === id) {
          current = id
        } else {
          combined = false
          break
        }
      }

      /* change visibility based on selection contents */
      if(selection.length === 0 || (selection.length === 1 || combined)) {
        this.dom.single.style.display = "block"
        this.dom.multi.style.display = "none"
      } else {
        this.dom.single.style.display = "none"
        this.dom.multi.style.display = "block"
      }
    })
  }
}

customElements.define('ui-window-sidebar', UIWindowSidebar)