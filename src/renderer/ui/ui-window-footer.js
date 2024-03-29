import { html, css } from '../widgets/m-template.js'

export default class UIWindowFooter extends HTMLElement {
  static shadow = null

  static template = html`
    <b>Macaco</b> <small>- Manage Your <b>Ma</b>gic <b>Ca</b>rd <b>Co</b>llection</small>
  `

  static style = css`
    :host {
      padding: 4px;
      text-align: center;
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

    macaco.events.register('update-statistics-contents', (ev, statistics) => {
      const string = `Collection with <b>${statistics.cards}</b> cards in <b>${statistics.folders}</b> folders worth <b>${statistics.price.sum.toFixed(2)}€</b>.`
      this.shadow.innerHTML = string
    })
  }
}

customElements.define('ui-window-footer', UIWindowFooter)
