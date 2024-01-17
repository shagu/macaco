import { html, css } from '../widgets/m-template.js'

export default class UIWindowOverlay extends HTMLElement {
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
      z-index: 32;

      background: var(--window-light);
      border: 1px var(--border-normal) solid;
      padding: 4px;

      display: block;
      visibility: hidden;
      opacity: 0;

      max-height: 75%;
      max-width: 75%;
      aspect-ratio: 2.5/3.5;
    }

    :host(.visible) {
      visibility: visible;
      opacity: 1;
    }

    #image {
      width: 100%;
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
      if (e.id) this.dom[e.id] = this.shadow.getElementById(e.id)
    }

    this.classList = 'invisible'

    macaco.events.register('set-overlay-image', (ev, path) => {
      if (path !== false) {
        this.shadow.innerHTML = ''

        const image = document.createElement('img')
        image.setAttribute('id', 'image')
        image.src = path
        this.shadow.appendChild(image)

        this.classList = 'visible'
      } else {
        this.classList = ''
      }

      macaco.events.invoke('update-overlay-image', path)
    })
  }
}

customElements.define('ui-window-overlay', UIWindowOverlay)
