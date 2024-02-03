import { html, css } from '../widgets/m-template.js'

export default class UIWindowOverlay extends HTMLElement {
  static shadow = null

  static template = html`
    <m-button id='close'>${macaco.icons.close}</m-button>
    <div id="popup"></div>
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
      box-shadow: 0px 0px 20px #000;

      visibility: hidden;
      opacity: 0;
      width: auto;
    }

    :host(.visible) {
      visibility: visible;
      opacity: 1;
    }

    #close {
      position: absolute;
      top: 2px;
      right: 2px;

      aspect-ratio: 1/1;

      display: grid;
      justify-items: center;
      align-items: center;

      min-height: 22px !important;
      min-width: 22px !important;
      padding: 2px;
    }
  `

  dom = {}

  set (mode, data, ...args) {
    // ignore other events during dialog mode
    if (mode !== 'dialog' && this.mode === 'dialog') return

    if (mode && data) {
      // change visibility
      this.show()

      // create and set content element
      const content = document.createElement(`ui-window-overlay-${mode}`)
      this.dom.popup.appendChild(content)
      content.set(this, data, ...args)
    } else {
      this.hide()
    }

    // save current mode
    this.mode = mode
  }

  show () {
    this.dom.popup.innerHTML = ''
    this.classList = 'visible'
  }

  hide () {
    this.mode = false
    this.dom.popup.innerHTML = ''
    this.classList = ''
  }

  constructor () {
    super()

    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.adoptedStyleSheets = [this.constructor.style]
    this.shadow.append(document.importNode(this.constructor.template, true))

    for (const e of this.shadow.querySelectorAll('*')) {
      if (e.id) this.dom[e.id] = this.shadow.getElementById(e.id)
    }

    this.classList = 'invisible'

    document.addEventListener('keydown', (event) => {
      if (document.activeElement.tagName !== 'BODY') return
      if (event.code === 'Escape') this.hide()
    })

    this.dom.close.onclick = (ev) => { this.hide() }

    macaco.events.register('set-overlay-image', (ev, path) => {
      this.lastImage = path !== this.lastImage || !this.mode ? path : false
      this.set('image', this.lastImage)
    })

    macaco.events.register('set-overlay-dialog', (ev, dialog) => {
      this.set('dialog', dialog)
    })

    macaco.events.register('set-overlay-draw', (ev, cards) => {
      this.set('draw', cards)
    })
  }
}

customElements.define('ui-window-overlay', UIWindowOverlay)
