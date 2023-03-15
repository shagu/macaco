import { html, css } from './m-template.js'

export default class MSkeleton extends HTMLElement {
  static shadow = null

  static template = html`
    <slot></slot>
  `

  static style = css`
    :host { }
  `

  constructor() {
    super()

    this.shadow = this.attachShadow({ mode: "open" })
    this.shadow.adoptedStyleSheets = [MSkeleton.style]
    this.shadow.append(document.importNode(MSkeleton.template, true))
  }
}

customElements.define("m-skeleton", MSkeleton)