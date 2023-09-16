import { html, css } from '../widgets/m-template.js'

export default class UIWindowFooter extends HTMLElement {
  static shadow = null

  static template = html`
    <b>Macaco</b> <small>- The <b>ma</b>gic <b>ca</b>rd <b>co</b>llection</small>
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
  }
}

customElements.define('ui-window-footer', UIWindowFooter)