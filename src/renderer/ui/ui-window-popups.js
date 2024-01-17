import { html, css } from '../widgets/m-template.js'

export default class UIWindowPopups extends HTMLElement {
  static shadow = null

  static template = html`
  `

  static style = css`
    :host {
      position: fixed;
      bottom: 24px;

      left: 50%;
      transform: translate(-50%, 0);
      width: 250px;

      pointer-events: none;
      z-index: 128;
    }

    #popup {
      display: grid;
      grid-auto-flow: row;
      justify-content: stretch;
      align-items: center;
      text-align: left;

      width: 100%;
      overflow: hidden;

      gap: 2px;
      margin: 8px;
      padding: 8px;

      box-sizing: border-box;
      border: 1px rgba(0,0,0,.95);
      border-radius: 8px;
      box-shadow: 0px 0px 8px #000;

      color: rgba(255,255,255,1);
      background: rgba(0,0,0,.85);

      transition: opacity 1s linear;
    }

    #popup:hover {
      visibility: 0;
    }

    #title {
      font-weight: bold;
    }

    #text {
    }

    #small {
      font-size: small;
    }

    #progress {
      width: 100%;
      accent-color: var(--color-accent);
    }
  `

  dom = {}
  popups = []

  popup (title, text, small, progress) {
    // try to reuse existing popup
    let popup = this.popups.filter(obj => {
      return obj.title === title
    })

    popup = popup && popup[0]

    // create a new object if nothing is found
    if (!popup) {
      popup = { }
      popup.dom = document.createElement('div')
      popup.dom.setAttribute('id', 'popup')
      this.popups.push(popup)
    }

    // update existing values
    popup.title = title
    popup.text = text
    popup.small = small
    popup.progress = progress
    popup.time = Date.now()

    // update ui
    this.render()
  }

  render () {
    // clear current popups
    this.shadow.innerHTML = ''
    for (const popup of this.popups) {
      popup.dom.innerHTML = ''

      const title = document.createElement('div')
      title.setAttribute('id', 'title')
      title.innerHTML = popup.title
      popup.dom.appendChild(title)

      if (popup.text) {
        const text = document.createElement('div')
        text.setAttribute('id', 'text')
        text.innerHTML = popup.text
        popup.dom.appendChild(text)
      }

      if (popup.small) {
        const small = document.createElement('div')
        small.setAttribute('id', 'small')
        small.innerHTML = popup.small
        popup.dom.appendChild(small)
      }

      if (popup.progress) {
        const progress = document.createElement('progress')
        progress.setAttribute('id', 'progress')
        progress.value = popup.progress / 100
        popup.dom.appendChild(progress)
      }

      this.shadow.appendChild(popup.dom)
    }
  }

  constructor () {
    super()

    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.adoptedStyleSheets = [this.constructor.style]
    this.shadow.append(document.importNode(this.constructor.template, true))

    for (const e of this.shadow.querySelectorAll('*')) {
      if (e.id) this.dom[e.id] = this.shadow.getElementById(e.id)
    }

    setInterval(() => {
      // remove and fade popups based on their remaining time
      for (const popup of this.popups) {
        if (popup.time + 4000 < Date.now()) {
          // remove popup after 4 seconds
          this.popups.splice(this.popups.indexOf(popup), 1)
          this.render()
        } else if (popup.time + 3000 < Date.now()) {
          // start popup fading after 3 seconds
          popup.dom.style.opacity = '0'
        } else {
          // keep every other popup visible
          popup.dom.style.opacity = '1'
        }
      }
    }, 100)

    // register for backend popups
    macaco.ipc.register('set-popup', (ev, title, text, small, progress) => {
      this.popup(title, text, small, progress)
      macaco.events.invoke('update-popup', title, text, small, progress)
    })

    // register for frontend popups
    macaco.events.register('set-popup', (ev, title, text, small, progress) => {
      this.popup(title, text, small, progress)
      macaco.events.invoke('update-popup', title, text, small, progress)
    })
  }
}

customElements.define('ui-window-popups', UIWindowPopups)
