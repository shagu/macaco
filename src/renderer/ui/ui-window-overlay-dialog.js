import { html, css } from '../widgets/m-template.js'

export default class UIWindowOverlayDialog extends HTMLElement {
  static shadow = null

  static template = html`
    <m-grid vertical="1">
      <m-grid vertical="1">
        <div id='label'>TEXT</div>
      </m-grid>

      <m-grid horizontal="1">
        <m-button id='btnYes'>Yes</m-button>
        <m-button id='btnNo'>No</m-button>
      </m-grid>
    </m-grid>
  `

  static style = css`
    m-grid {
      padding: 8px;
    }

    m-button {
      min-width: 100px;
    }

    #label {
      color: var(--font-light);
    }
  `

  dom = {}

  set (parent, text, yes, no) {
    this.dom.label.innerHTML = text

    this.dom.btnYes.onclick = () => {
      yes && yes()
      parent.hide()
    }

    this.dom.btnNo.onclick = () => {
      no && no()
      parent.hide()
    }

    macaco.events.invoke('update-overlay-dialog', text, yes, no)
  }

  constructor () {
    super()

    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.adoptedStyleSheets = [this.constructor.style]
    this.shadow.append(document.importNode(this.constructor.template, true))

    for (const e of this.shadow.querySelectorAll('*')) {
      if (e.id) this.dom[e.id] = this.shadow.getElementById(e.id)
    }
  }
}

customElements.define('ui-window-overlay-dialog', UIWindowOverlayDialog)
