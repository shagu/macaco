import { html, css } from '../widgets/m-template.js'

export default class UIWindowLibrary extends HTMLElement {
  static shadow = null

  static template = html`
    <div id="folders"></div>
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

    macaco.events.register('update-collection-contents', (ev, contents) => {
      this.dom.folders.innerHTML = ""

      for(const [path, cards] of Object.entries(contents)) {
        const element = document.createElement('ui-window-library-folder')
        element.cards = cards
        element.path = path
        this.dom.folders.appendChild(element)
      }
    })
  }
}

customElements.define('ui-window-library', UIWindowLibrary)