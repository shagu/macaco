import { html, css } from '../widgets/m-template.js'

export default class UIWindowContentOverlay extends HTMLElement {
  static shadow = null

  static template = html`
    <img id='image'/>
  `

  static style = css`
    :host {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 128;

      background: black;
      box-shadow: 0 0 16px 16px black;
      border-radius: 8px;

      display: block;
      visibility: hidden;
      opacity: 0;

      transition: 500ms ease;
    }

    :host(.visible) {
      visibility: visible;
      opacity: 1;
    }

    #image {
      width: 512px;
      aspect-ratio: 2.5/3.5;
    }
  `

  dom = {}
  groups = {}

  constructor () {
    super()

    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.adoptedStyleSheets = [this.constructor.style]
    this.shadow.append(document.importNode(this.constructor.template, true))

    for (const e of this.shadow.querySelectorAll('*')) {
      if(e.id) this.dom[e.id] = this.shadow.getElementById(e.id)
    }

    this.classList = 'invisible'

    macaco.events.register("set-overlay-image", (ev, path) => {
      if (path !== false) {
        this.classList = 'visible'
        this.dom.image.src = path
      } else {
        this.classList = ''
      }
      
      macaco.events.invoke("update-overlay-image", path)
    })
  }
}

customElements.define('ui-window-content-overlay', UIWindowContentOverlay)