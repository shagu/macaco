import { html, css } from '../widgets/m-template.js'

export default class UIWindowMenu extends HTMLElement {
  static shadow = null
  static background = null
  static popovers = []
  static buttons = []
  static current = false

  static template = html`
    <m-popover>
      <ui-window-menu-filter id="filter"></ui-window-menu-filter>
      <ui-window-menu-statistics id="statistics"></ui-window-menu-statistics>
      <ui-window-menu-main id="main"></ui-window-menu-main>
    </m-popover>
  `
  static style = css`
    :host {
    }
  `

  constructor () {
    super()

    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.adoptedStyleSheets = [this.constructor.style]
    this.shadow.append(document.importNode(this.constructor.template, true))
  }
}

customElements.define('ui-window-menu', UIWindowMenu)
