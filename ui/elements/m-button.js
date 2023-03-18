import { html, css } from './m-template.js'

export default class MButton extends HTMLElement {
  static observedAttributes = ['disabled', 'checked']
  static shadow = null

  static template = html`
    <slot></slot>
  `

  static style = css`
    :host {
      display: inline-block;

      width: fit-content;
      height: fit-content;
      box-sizing: border-box;

      background: var(--widget-light);
      border: 1px var(--border-normal) solid;
      padding: 6px;
    }

    :host(:hover) {
      background: var(--widget-normal);
    }

    :host(:active) {
      background: var(--widget-dark);
    }

    :host(:focus) {
      outline: none;
    }

    :host(.checked) {
      background: var(--widget-dark);
    }

    :host(:disabled), :host([disabled]) {
      pointer-events: none;
      background: var(--widget-dark);
      border: 1px var(--border-light) solid;
      filter: grayscale(75%);
      color: var(--font-dark);
    }

    ::slotted(svg) {
      fill: var(--font-normal);
      stroke: none;
      pointer-events: none;
      height: 100%;
    }

    ::slotted(svg path) {
      fill: var(--font-normal);
    }
  `
  get disabled () {
    return this.hasAttribute('disabled')
  }

  set disabled (disabled) {
    disabled ? this.setAttribute('disabled', '') : this.removeAttribute('disabled')
  }

  get checked () {
    return this.classList.contains('checked')
  }

  set checked (state) {
    if (state) {
      this.classList.add('checked')
    } else {
      this.classList.remove('checked')
    }
  }

  constructor () {
    super()

    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.adoptedStyleSheets = [MButton.style]
    this.shadow.append(document.importNode(MButton.template, true))
  }
}

customElements.define('m-button', MButton)
