import { html, css } from '../widgets/m-template.js'

export default class UIWindowOverlayImage extends HTMLElement {
  static shadow = null

  static template = html`
    <img id='image'/>
  `

  static style = css`
    #image {
      margin: 8px;
      max-height: 70vh;
      max-width: 70vw;
      aspect-ratio: 2.5/3.5;
    }
  `

  dom = {}

  set (parent, path) {
    this.dom.image.src = path
    macaco.events.invoke('update-overlay-image', path)
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

customElements.define('ui-window-overlay-image', UIWindowOverlayImage)
