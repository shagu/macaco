import { html, css } from '../widgets/m-template.js'

export default class UIWindowOverlayDialog extends HTMLElement {
  static shadow = null

  static template = html`
    <m-grid vertical="1">
      <m-grid vertical="1">
        <div id='title'>TITLE</div>
      </m-grid>
      <hr/>
      <m-grid vertical="1">
        <div id='label'>TEXT</div>
      </m-grid>
      <hr/>
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

    #title {
      font-size: larger;
    }

    hr {
      height: 0px;
      background-color: var(--border-light);
      border: none;
      margin: 5px;
    }

    #label {
      color: var(--font-light);
      max-width: 320px;
      overflow: auto;
    }
  `

  dom = {}

  set (parent, dialog) {
    this.dom.title.innerHTML = dialog.title || 'Warning'
    this.dom.label.innerHTML = dialog.label || 'Would you like to proceed?'
    this.dom.btnYes.innerHTML = dialog.yes.label || 'Yes'
    this.dom.btnNo.innerHTML = dialog.no.label || 'No'

    this.dom.btnYes.onclick = (ev) => {
      dialog.yes && dialog.yes.function && dialog.yes.function(ev)
      parent.hide()
    }

    this.dom.btnNo.onclick = (ev) => {
      dialog.no && dialog.no.function && dialog.no.function(ev)
      parent.hide()
    }

    macaco.events.invoke('update-overlay-dialog', dialog)
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
