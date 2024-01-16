import { html, css } from '../widgets/m-template.js'

export default class UIWindowMenuMain extends HTMLElement {
  static shadow = null

  static template = html`
    <m-button id="metadata">Update Macaco Metadata</m-button>
    <m-button id="delver">Import DelverLens Backup</m-button>
  `

  static style = css`
    :host {
      display: none;

      position: fixed;

      width: min-content;
      max-height: max-content;

      background: var(--window-light);
      border: 1px var(--border-normal) solid;
      box-shadow: 0px 0px 5px var(--border-dark);

      padding: 5px;
      z-index: 16;
    }

    m-button {
      white-space: nowrap;
      min-width: 100%;
      margin: 1px;
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

    this.dom.metadata.onclick = (e) => {
      macaco.ipc.invoke('reload-metadata', true)
    }

    this.dom.delver.onclick = (e) => {
      macaco.ipc.invoke('import-delver')
    }
  }
}

customElements.define('ui-window-menu-main', UIWindowMenuMain)
