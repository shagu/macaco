import { html, css } from '../widgets/m-template.js'

export default class UIWindowContent extends HTMLElement {
  static shadow = null

  static template = html`
    <div id="cards">
      <div id="welcome">
        <div id="icon">
          <img src="../../icon.png"/>
        </div>
        <div id="header">Magic Card Collection</div>
        <div id="text">
          Open an existing collection folder or create a new folder, where your collection should be stored at.
        </div>
      </div>
    </div>
  `

  static style = css`
    #cards {
      min-width: 100%;
      min-height: 100%;
    }

    #welcome {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);

      display: grid;
      grid-template-areas:
        'icon  header'
        'icon  text'
      ;

      align-items: center;
      justify-content: center;

      gap: 4px;

      color: var(--font-dark);
      width: 50%;
      max-width: 460px;
      height: min-content;
    }

    #welcome #header {
      grid-area: header;
      font-size: 24pt;
    }

    #welcome #text {
      grid-area: text;
      font-size: 12pt;
    }

    #welcome #icon {
      grid-area: icon;
    }

    #welcome #icon img {
      margin: 0px 4px;
      filter: grayscale(0.9) opacity(50%);
      max-height: 80px;
      aspect-ratio: 1/1;
    }
  `

  dom = {}
  cards = []
  view = []

  constructor () {
    super()

    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.adoptedStyleSheets = [this.constructor.style]
    this.shadow.append(document.importNode(this.constructor.template, true))

    for (const e of this.shadow.querySelectorAll('*')) {
      if (e.id) this.dom[e.id] = this.shadow.getElementById(e.id)
    }

    document.addEventListener('keydown', (event) => {
      /* ignore if any element or input has focus */
      if (document.activeElement.tagName !== 'BODY') return

      if (event.ctrlKey && event.code === 'KeyA') {
        macaco.collection.selection = []
        for (const cluster of this.view) {
          cluster.forEach((card) => macaco.collection.selection.push(card))
        }
        macaco.events.invoke('update-collection-selection', macaco.collection.selection)
      } else if (event.code === 'Escape') {
        macaco.collection.selection = []
        macaco.events.invoke('update-collection-selection', macaco.collection.selection)
      }
    })

    this.dom.cards.onclick = (ev) => {
      macaco.collection.selection = []
      macaco.events.invoke('update-collection-selection', macaco.collection.selection)
    }

    const updateSelection = (ev, selection) => {
      // remove previous selections
      for (const element of this.cards) {
        element.classList.remove('active')
        element.classList.remove('recent')
      }

      // add active class to selected groups
      for (const element of this.cards) {
        for (const selected of macaco.collection.selection) {
          if (element.cards.includes(selected)) {
            element.classList.add('active')
          }
        }
      }

      // add recent class to recently changed groups
      for (const element of this.cards) {
        for (const card of element.cards) {
          if (macaco.collection.diff.includes(card.fsurl)) {
            element.classList.add('recent')
          }
        }
      }
    }

    const updateView = (ev, view) => {
      // clear current view
      this.dom.cards.innerHTML = ''

      // cache dom object of same cards
      this.cards = []
      this.view = view

      // add card for each entry in view
      for (const cluster of view) {
        const element = document.createElement('ui-window-content-card')
        element.cards = cluster
        this.dom.cards.appendChild(element)
        this.cards.push(element)
      }

      // update selected cards
      updateSelection()
    }

    macaco.events.register('update-collection-selection', updateSelection)
    macaco.events.register('update-collection-view', updateView)
  }
}

customElements.define('ui-window-content', UIWindowContent)
