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
  groups = {}

  constructor () {
    super()

    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.adoptedStyleSheets = [this.constructor.style]
    this.shadow.append(document.importNode(this.constructor.template, true))

    for (const e of this.shadow.querySelectorAll('*')) {
      if(e.id) this.dom[e.id] = this.shadow.getElementById(e.id)
    }

    document.addEventListener('keydown', (event) => {
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

    const update_selection = (ev, selection) => {
      // remove previous selections
      for (const [identifier, element] of Object.entries(this.groups)) {
        element.classList.remove('active')
      }

      // add active class to selected groups
      for (const [identifier, element] of Object.entries(this.groups)) {
        for(const selected of macaco.collection.selection) {
          if(element.cards.includes(selected))
            element.classList.add('active')
        }
      }
    }

    const update_view = (ev, view) => {
      // clear current view
      this.dom.cards.innerHTML = ""

      // cache dom object of same cards
      this.groups = {}

      // add card for each entry in view
      for(const card of macaco.collection.view) {
        let id = `[${card.edition}.${card.number}.${card.language}${card.foil ? '.f' : ''}]`
        if (macaco.config.byname && card.data && card.data.name) { id = `${card.data.name}` }

        if(this.groups[id]) {
          this.groups[id].cards.push(card)
        } else {
          this.groups[id] = document.createElement('ui-window-content-card')
          this.groups[id].cards = [card]
          this.dom.cards.appendChild(this.groups[id])
        }
      }

      // update selected cards
      update_selection()
    }

    macaco.events.register('update-collection-selection', update_selection)
    macaco.events.register('update-collection-view', update_view)
  }
}

customElements.define('ui-window-content', UIWindowContent)
