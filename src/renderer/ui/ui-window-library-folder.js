import { html, css } from '../widgets/m-template.js'

export default class UIWindowLibraryFolder extends HTMLElement {
  static shadow = null

  static template = html`
    <div id="folder">
      <div id="caption">
        <img id="icon"/>
        <div id="label"></div>
        <div id="count"></div>
      </div>
    </div>
  `

  static style = css`
    #folder {
      margin: 1px;
      padding: 6px;
      text-overflow: ellipsis;
      border: 1px var(--window-light) solid;

      display: grid;
      grid-template-columns: 1fr auto;
      grid-template-areas: 'title count';
      align-items: center;
      white-space: nowrap;
    }

    #folder:hover {
      background: var(--color-hover);
      border: 1px var(--color-hover) solid;
    }

    #folder.active {
      background: var(--color-select);
      border: 1px var(--color-select) solid;
    }

    #folder.drag {
      background: var(--color-accent);
      border: 1px var(--color-accent) solid;
    }

    #caption {
      grid-area: title;
      display: grid;
      grid-template-columns: auto 1fr;
      grid-template-areas: 'icon label count';
      justify-content: center;
      align-items: center;
      pointer-events: none;
    }

    #icon {
      height: 16px;
      aspect-ratio: 1/1;
      margin-right: 4px;
      grid-area: icon;
    }

    #label {
      text-align: left;
      grid-area: label;
    }

    #count {
      grid-area: count;
      font-size: small;
      text-align: right;
      color: var(--font-dark);
      padding-left: 4px;
      margin-left: 4px;
      pointer-events: none;
    }

    :host {
    }
  `

  dom = {}

  constructor () {
    super()

    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.adoptedStyleSheets = [this.constructor.style]
    this.shadow.append(document.importNode(this.constructor.template, true))

    for (const e of this.shadow.querySelectorAll('*')) {
      if(e.id) this.dom[e.id] = this.shadow.getElementById(e.id)
    }

    macaco.events.register('update-collection-folder', (ev, folder) => {
      if (folder == this.path) {
        this.dom.folder.classList.add('active')
      } else {
        this.dom.folder.classList.remove('active')
      }
    })

    this.dom.folder.onclick = (ev) => {
      // set view to this path
      macaco.events.invoke("set-collection-folder", this.path)
      ev.stopPropagation()
    }

    this.dom.folder.ondragover = (ev) => {
      // required to all drops on this element
      ev.preventDefault()
    }

    this.dom.folder.ondragenter = (ev) => {
      // set drag highlight
      ev.preventDefault()
      ev.target.classList.add('drag')
    }

    this.dom.folder.ondragleave = (ev) => {
      // remove drag highlight
      ev.preventDefault()
      ev.target.classList.remove('drag')
    }

    this.dom.folder.ondrop = (ev) => {
      // remove drag highlight
      ev.preventDefault()
      ev.target.classList.remove('drag')

      // merge all cards into this path
      macaco.ipc.invoke('set-card-folder', macaco.collection.selection, this.path)
    }
  }

  connectedCallback () {
    const paths = this.path.split("/")
    let string = ""

    if(paths.length === 1) {
      string = "Library"
    } else {
      for (let i = 1; i < paths.length; i++) {
        if (i == paths.length - 1) {
          string = `${string}${paths[i]}`
          //string = `${string}<b>${paths[i]}</b>`
        } else if (i == paths.length - 2){
          string = `${string}${paths[i]}/`
          // string = `${string} ► `
        } else {
          string = `${string}${paths[i]}/`
          // string = `${string}   `
        }
      }
    }

    this.dom.label.innerHTML = string
    this.dom.count.innerHTML = this.cards.length > 0 ? this.cards.length : ""
    this.dom.icon.src = `../../assets/mana/${macaco.statistics.icon(this.cards)}.png`
  }
}

customElements.define('ui-window-library-folder', UIWindowLibraryFolder)