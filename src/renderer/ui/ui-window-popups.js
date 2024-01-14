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
      width: 200px;

      pointer-events: none;
      z-index: 128;
    }

    #popup {
      border: 1px rgba(0,0,0,.95);
      border-radius: 8px;

      color: rgba(255,255,255,1);

      background: rgba(0,0,0,.85);
      box-sizing: border-box;

      margin: 4px;
      padding: 16px 16px 4px 16px;

      transition: opacity 1s linear;
    }

    #popup:hover {
      visibility: 0;
    }

    #title {
      font-weight: bold;
    }

    #info {
      font-size: small;
    }

    #progress {
      width: 100%;
      accent-color: var(--color-accent);
    }
  `

  dom = {}
  popups = []

  popup(id, title, info, progress) {
    // try to reuse existing popup
    let popup = this.popups.filter(obj => {
      return obj.id === id
    })

    popup = popup && popup[0] || false

    // create a new object if nothing is found
    if(!popup) {
      popup = {
        id: id,
        title: "N/A",
        info: "N/A",
        progress: 0,
        time: 0,
        dom: document.createElement('div'),
      }

      popup.dom.setAttribute('id', 'popup')
      this.popups.push(popup)
    }

    // update values
    popup.title = title !== undefined ? title : popup.title
    popup.info = info !== undefined ? info : popup.info
    popup.progress = progress !== undefined ? progress : popup.progress
    popup.time = Date.now()

    // update ui
    this.render()
  }

  render() {
    // clear current popups
    this.shadow.innerHTML = ''
    for (const popup of this.popups) {
      popup.dom.innerHTML = ''

      const title = document.createElement('div')
      title.setAttribute('id', 'title')
      title.innerHTML = popup.title
      popup.dom.appendChild(title)

      const info = document.createElement('div')
      info.setAttribute('id', 'info')
      info.innerHTML = popup.info
      popup.dom.appendChild(info)

      const progress = document.createElement('progress')
      progress.setAttribute('id', 'progress')
      progress.value = popup.progress
      progress.style.visibility = popup.progress ? 'visible' : 'hidden'
      popup.dom.appendChild(progress)

      this.shadow.appendChild(popup.dom)
    }
  }

  constructor () {
    super()

    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.adoptedStyleSheets = [this.constructor.style]
    this.shadow.append(document.importNode(this.constructor.template, true))

    for (const e of this.shadow.querySelectorAll('*')) {
      if(e.id) this.dom[e.id] = this.shadow.getElementById(e.id)
    }

    setInterval(() => {
      // remove and fade popups based on their state and remaining time
      for (const popup of this.popups) {
        if (popup.progress == 100 && popup.time + 3000 < Date.now()) {
          // remove popup after 3 seconds
          this.popups.splice(this.popups.indexOf(popup), 1)
          this.render()
        } else if (popup.progress == 100 && popup.time + 2000 < Date.now()) {
          // start popup fading after 2 seconds
          popup.dom.style.opacity = "0"
        } else {
          // keep every other popup visible
          popup.dom.style.opacity = "1"
        }
      }
    }, 100)

    macaco.ipc.register("set-popup", (ev, id, title, info, progress) => {
      this.popup(id, title, info, progress)
      macaco.events.invoke("update-popup", id, title, info, progress)
    })

    macaco.events.register("set-popup", (ev, id, title, info, progress) => {
      this.popup(id, title, info, progress)
      macaco.events.invoke("update-popup", id, title, info, progress)
    })
  }
}

customElements.define('ui-window-popups', UIWindowPopups)
