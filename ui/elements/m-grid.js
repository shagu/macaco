import { html, css } from './m-template.js'

export default class MGrid extends HTMLElement {
  static observedAttributes = ['horizontal', 'vertical', 'gap']
  static shadow = null

  static template = html`
    <slot></slot>
  `

  static style = css`
    :host {
      display: grid;
      justify-content: center;
      align-items: center;
      text-align: center;
    }
  `

  get gap () {
    return this.getAttribute('gap')
  }

  set gap (size) {
    this.setAttribute('gap', size)
    this.style.gap = size
  }

  get horizontal () {
    return this.getAttribute('horizontal')
  }

  set horizontal (index) {
    const position = index === '' ? 1 : index || null
    if (position === null) {
      this.removeAttribute('horizontal')
    } else {
      this.setAttribute('horizontal', index)
      this.style.gridTemplateColumns = `${'auto '.repeat(position - 1)}1fr`
      this.style.gridAutoFlow = 'column'
    }
  }

  get vertical () {
    return this.getAttribute('vertical')
  }

  set vertical (index) {
    const position = index === '' ? 1 : index || null
    if (position === null) {
      this.removeAttribute('vertical')
    } else {
      this.setAttribute('vertical', index)
      this.style.gridTemplateRows = `${'auto '.repeat(position - 1)}1fr`
      this.style.gridAutoFlow = 'row'
    }
  }

  connectedCallback () {
    if (this.hasAttribute('gap')) {
      this.gap = this.getAttribute('gap')
    }

    if (this.hasAttribute('horizontal')) {
      this.horizontal = this.getAttribute('horizontal')
    }

    if (this.hasAttribute('vertical')) {
      this.vertical = this.getAttribute('vertical')
    }
  }

  constructor () {
    super()

    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.adoptedStyleSheets = [MGrid.style]
    this.shadow.append(document.importNode(MGrid.template, true))
  }
}

customElements.define('m-grid', MGrid)
