import { html, css } from '../widgets/m-template.js'

export default class UIWindowContent extends HTMLElement {
  static shadow = null

  static template = html`
    <div id="cards"></div>
  `

  static style = css`
    #cards {
      min-width: 100%;
      min-height: 100%;
    }
  `

  dom = {}
  cards = {}

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
        macaco.collection.view.forEach((card) => macaco.collection.selection.push(card))
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
      for (const [, element] of Object.entries(this.cards)) {
        element.classList.remove('active')
        element.classList.remove('recent')
      }

      // add active class to selected groups
      for (const [, element] of Object.entries(this.cards)) {
        for (const selected of macaco.collection.selection) {
          if (element.cards.includes(selected)) { element.classList.add('active') }
        }
      }

      // add recent class to recently changed groups
      for (const [, element] of Object.entries(this.cards)) {
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
      this.cards = {}

      // add card for each entry in view
      for (const card of macaco.collection.view) {
        let id = `${card.fsurl}`
        if (macaco.combine === 'id') {
          id = `[${card.edition}.${card.number}.${card.language}${card.foil ? '.f' : ''}]`
        } else if (macaco.combine === 'name' && card.metadata) {
          id = `[${card.metadata.name}]`
        }

        if (this.cards[id]) {
          this.cards[id].cards.push(card)
        } else {
          this.cards[id] = document.createElement('ui-window-content-card')
          this.cards[id].cards = [card]
          this.dom.cards.appendChild(this.cards[id])
        }
      }

      // update selected cards
      updateSelection()
    }

    macaco.events.register('update-collection-selection', updateSelection)
    macaco.events.register('update-collection-view', updateView)
  }
}

customElements.define('ui-window-content', UIWindowContent)
