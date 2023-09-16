import { html, css } from './m-template.js'

export default class MInput extends HTMLElement {
  static observedAttributes = [ 'disabled', 'maxlength', 'placeholder', 'readonly', 'type', 'value' ]
  static shadow = null

  static template = html`
    <input part="input" id='input'></input>
  `

  static style = css`
    :host {
      display: inline-block;
    }

    input::placeholder, input:disabled::placeholder {
      color: var(--font-dark);
    }

    input:disabled {
      pointer-events: none;
      background: var(--widget-dark);
      border: 1px var(--border-light) solid;
      filter: grayscale(75%);
      color: var(--font-dark);
    }

    input {
      box-sizing: border-box;
      border: 1px var(--border-normal) solid;
      background: var(--widget-normal);
      padding: 6px;
      width: 100%;
      height: 100%;
    }

    input:focus {
      border: 1px var(--color-notify) solid;
      outline: none;
    }
  `

  get type() {
    return this.hasAttribute("type") ? this.getAttribute("type") : "text"
  }

  set type(type) {
    this.setAttribute("type", type)
  }

  get value() {
    return this.input.value
  }

  set value(value) {
    this.input.value = value
  }

  get placeholder() {
    return this.input.placeholder
  }

  set placeholder(value) {
    this.setAttribute("placeholder", value)
  }

  get maxLength() {
    return this.hasAttribute("maxlength") ? parseInt(this.getAttribute("maxlength")) : Infinity
  }
  set maxLength(maxLength) {
    this.setAttribute("maxlength", maxLength)
  }

  get readOnly() {
    return this.hasAttribute("readonly")
  }

  set readOnly(state) {
    state === true ? this.setAttribute("readonly", state) : this.removeAttribute("readonly")
  }

  get disabled() {
    return this.hasAttribute("disabled")
  }

  set disabled(disabled) {
    disabled ? this.setAttribute("disabled", "") : this.removeAttribute("disabled")
    disabled ? this.input.setAttribute("disabled", "") : this.input.removeAttribute("disabled")
  }

  attributeChangedCallback(name) {
    this.input.setAttribute(name, this.getAttribute(name))
  }

  constructor () {
    super()

    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.adoptedStyleSheets = [MInput.style]
    this.shadow.append(document.importNode(MInput.template, true))

    this.input = this.shadow.getElementById('input')

    this.input.addEventListener("change", (event) => {
      this.dispatchEvent(new CustomEvent("change", {bubbles: true}))
    })

    this.input.addEventListener("input", (event) => {
      event.stopPropagation()
      this.dispatchEvent(new CustomEvent("input", {bubbles: true}))
    })
  }

  connectedCallback() {
  }
}

customElements.define('m-input', MInput)
