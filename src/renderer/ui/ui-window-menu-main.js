import { html, css } from '../widgets/m-template.js'

export default class UIWindowMenuMain extends HTMLElement {
  static shadow = null

  static template = html`
    <m-button id="metadata">Update Macaco Metadata</m-button>
    <m-button id="importDelver" disabled>Import DelverLens Backup</m-button>
    <m-button id="importTextFile" disabled>Import Text File</m-button>
    <m-button id="exportTextFile" disabled>Export Text File</m-button>
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

    this.dom.importDelver.onclick = (e) => {
      macaco.ipc.invoke('import-delver')
    }

    this.dom.importTextFile.onclick = (e) => {
      macaco.ipc.invoke('import-textfile', macaco.collection.folder)
    }

    this.dom.exportTextFile.onclick = (e) => {
      const dialog = {
        title: 'Export Text File',
        label: 'Would you like to export the current folder or the entire collection?',
        yes: {
          label: 'Collection',
          function: (ev) => { macaco.ipc.invoke('export-textfile', macaco.collection.contents) }
        },
        no: {
          label: 'Folder',
          function: (ev) => { macaco.ipc.invoke('export-textfile', macaco.collection.contents[macaco.collection.folder]) }
        }
      }

      macaco.events.invoke('set-overlay-dialog', dialog)
    }

    // disable delver import button while nothing is loaded
    macaco.events.register('update-collection-contents', (ev, contents) => {
      this.dom.importDelver.disabled = false
      this.dom.importTextFile.disabled = false
      this.dom.exportTextFile.disabled = false
    })
  }
}

customElements.define('ui-window-menu-main', UIWindowMenuMain)
