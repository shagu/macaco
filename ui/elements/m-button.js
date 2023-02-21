import { html, css } from './m-template.js'

export default class MButton extends HTMLElement {
  static observedAttributes = [ "disabled", "checked" ]
  static shadow = null

  static template = html`
    <button>
      <slot></slot>
    </button>
  `

  static style = css`
    button {
      box-sizing: border-box !important;
      background: var(--widget-light);
      border: 1px var(--border-normal) solid;
      padding: 6px;
    }

    button:hover {
      background: var(--widget-normal);
    }

    button:active {
      background: var(--widget-dark);
    }

    button:focus {
      outline: none;
    }

    button.checked {
      background: var(--widget-dark);
    }

    button:disabled, button[disabled] {
      pointer-events: none;
      background: var(--widget-dark);
      border: 1px var(--border-light) solid;
      filter: grayscale(75%);
      color: var(--font-dark);
    }
  `

  set disabled(state) {
    this.button.setAttribute("disabled", state)
  }

  set checked(state) {
    if (state) {
      this.button.classList.add("checked")
    } else {
      this.button.classList.remove("checked")
    }
  }

  getBoundingClientRect = function() {
    return this.button.getBoundingClientRect()
  }

  constructor() {
    super()

    this.shadow = this.attachShadow({ mode: "open" })
    this.shadow.adoptedStyleSheets = [MButton.style]
    this.shadow.append(document.importNode(MButton.template, true))

    this.button = this.shadow.querySelector("button")
  }
}

customElements.define("m-button", MButton)