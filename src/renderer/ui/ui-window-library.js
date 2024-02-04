import { html, css } from '../widgets/m-template.js'

export default class UIWindowLibrary extends HTMLElement {
  static shadow = null

  static template = html`
    <div id='container-box'>
      <input type='text' id='folder-input' value='Create New Folder'/>
      <hr/>
      <div id="folders"></div>
    </div>
  `

  static style = css`
    :host {
    }

    hr {
      height: 1px;
      background-color: var(--border-light);
      border: none;
      margin: 5px;
    }

    #container-box {
      padding: 5px;
      max-width: 550px;
    }

    #folder-input {
      display: block;
      box-sizing: border-box;
      cursor: default;

      margin: 1px;
      padding: 6px;
      text-overflow: ellipsis;
      border: 1px var(--window-light) solid;
      background-color: var(--window-light);

      width: Calc(100% - 2px);
    }

    #folder-input:hover {
      background: var(--color-hover);
      border: 1px var(--color-hover) solid;
    }

    #folder-input.active {
      background: var(--widget-normal);
      border: 1px var(--color-notify) solid;
      cursor: text;
      outline: none;
      color: var(--font-normal);
    }
  `

  dom = {}
  folders = []

  constructor () {
    super()

    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.adoptedStyleSheets = [this.constructor.style]
    this.shadow.append(document.importNode(this.constructor.template, true))

    for (const e of this.shadow.querySelectorAll('*')) {
      if (e.id) this.dom[e.id] = this.shadow.getElementById(e.id)
    }

    this.dom['container-box'].style.display = 'none'

    this.dom['folder-input'].onfocus = (e) => {
      this.dom['folder-input'].classList.add('active')
      this.dom['folder-input'].value = ''
    }

    this.dom['folder-input'].onblur = (e) => {
      this.dom['folder-input'].classList.remove('active')
      this.dom['folder-input'].value = 'Create New Folder'
      this.dom['folder-input'].blur()
    }

    this.dom['folder-input'].onkeydown = (e) => {
      if (e.key === 'Enter') {
        const folder = this.dom['folder-input'].value
        macaco.ipc.invoke('create-new-folder', folder)
        this.dom['folder-input'].onblur(e)
      }

      if (e.key === 'Escape') {
        this.dom['folder-input'].onblur(e)
      }
    }

    macaco.events.register('update-statistics-folder', (ev, counts) => {
      for (const element of this.folders) {
        const real = element.cards.length > 0 ? element.cards.length : ''
        const filtered = counts[element.path] ? counts[element.path] : 0

        if (filtered <= 0 || filtered === real) {
          element.dom.count.innerHTML = `${real}`
        } else {
          element.dom.count.innerHTML = `${real} [<b>${filtered}</b>]`
        }
      }
    })

    macaco.events.register('update-collection-folder', (ev, folder) => {
      for (const element of this.folders) {
        if (folder === element.path) {
          element.dom.folder.classList.add('active')
        } else {
          element.dom.folder.classList.remove('active')
        }

        // detect recent change
        if (macaco.collection.diff.includes(element.path)) {
          element.dom.folder.classList.add('recent')
        } else {
          element.dom.folder.classList.remove('recent')
        }
      }
    })

    macaco.events.register('update-collection-contents', (ev, contents) => {
      this.dom.folders.innerHTML = ''
      this.folders = []

      this.dom['container-box'].style.display = 'block'

      for (const [path, cards] of Object.entries(contents)) {
        const element = document.createElement('ui-window-library-folder')
        element.cards = cards
        element.path = path
        this.dom.folders.appendChild(element)
        this.folders.push(element)
      }
    })
  }
}

customElements.define('ui-window-library', UIWindowLibrary)
