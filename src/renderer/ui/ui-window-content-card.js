import { html, css } from '../widgets/m-template.js'

export default class UIWindowContentCard extends HTMLElement {
  static shadow = null
  static observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.populate()
        observer.unobserve(entry.target)
      }
    })
  })

  static template = html`
  `

  static style = css`
    :host {
      display: inline-block;
      margin: 4px;
      padding: 8px;
      overflow: hidden;
      width: 128px;
      min-height: 200px;
      border: 1px rgba(0,0,0,0) solid;
      position: relative;
      z-index: 1;
      opacity: 0;
      transition: opacity 0.25s ease-in;
    }

    :host(:hover) {
      background: var(--color-hover);
    }

    :host(.active), :host(.active:hover) {
      background: var(--color-accent);
    }

    :host(.new) {
      background: var(--color-hover);
      border: 1px var(--color-notify) solid;
    }

    * {
      pointer-events: none;
    }

    #title {
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      text-align: center;
      font-size: 10pt;
      width: 100%;
    }

    #image {
      width: 128px;
      height: 176px;
    }

    #price {
      display: inline-block;
      background-color: rgba(0, 0, 0, 0.75);
      position: absolute;
      text-align: right;
      font-size: small;
      padding: 5px 10px;
      right: 8px;
      top: 25px;
    }

    #count {
      background-color: rgba(0, 0, 0, 0.75);
      position: absolute;
      font-size: large;
      padding: 5px 10px;
      margin-left: auto;
      margin-right: auto;
      width: min-content;
      color: #fff;
      left: 0;
      right: 0;
      bottom: 50px;
      text-align: center;
    }
  `

  static dragstart (ev) {
    ev.dataTransfer.setData('text/plain', JSON.stringify(ev.target.data))
  }

  state (state) {
    this.className = state || 'normal'
  }

  disconnectedCallback () {
    UIWindowContentCard.observer.unobserve(this)
  }

  connectedCallback () {
    UIWindowContentCard.observer.observe(this)
  }

  populate () {
    // abort here on missing card data
    if (!this.cards || !this.cards[0]) return

    const card = this.cards[0]
    const amount = this.cards.length

    const identifier = `[${card.edition}.${card.number}.${card.language}${card.foil ? '.f' : ''}]`

    const image = document.createElement('img')
    image.setAttribute('id', 'image')
    image.setAttribute('src', card.fsurl)
    this.shadow.appendChild(image)

    const title = document.createElement('div')
    title.setAttribute('id', 'title')
    title.innerHTML = macaco.getLocale(card, 'name') || identifier
    this.shadow.appendChild(title)

    const count = document.createElement('div')
    count.setAttribute('id', 'count')
    count.innerHTML = `${amount}x`
    this.shadow.appendChild(count)

    if (amount > 0) {
      count.style.display = 'inline-block'
    } else {
      count.style.display = 'none'
    }

    const price = document.createElement('div')
    price.setAttribute('id', 'price')

    let worth = "N/A"
    if (card.metadata && card.metadata.prices) {
      worth = card.metadata.prices[2] || card.metadata.prices[0]
      if (card.foil) worth = card.metadata.prices[3] || card.metadata.prices[1]
    }

    if (worth !== "N/A") {
      price.innerHTML = `${worth.toFixed(2)}€`

      if (worth > 10.0) {
        price.style = 'color: #f55;'
      } else if (worth > 1.0) {
        price.style = 'color: #fa5;'
      } else {
        price.style = 'color: #fff;'
      }
    } else {
      price.innerHTML = worth
      price.style = 'color: #555;'
    }

    this.shadow.appendChild(price)

    this.setAttribute('draggable', true)
    this.style.opacity = 1

    this.ondragstart = UIWindowContentCard.dragstart
    this.onclick = (ev) => {
      if (!ev.ctrlKey) {
        macaco.collection.selection = []
      }

      for (const card of this.cards) {
        if (macaco.collection.selection.includes(card)) {
          macaco.collection.selection.splice(macaco.collection.selection.indexOf(card), 1)
        } else {
          macaco.collection.selection.push(card)
        }
      }

      macaco.events.invoke('update-collection-selection', macaco.collection.selection)
      ev.stopPropagation()
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
  }
}

customElements.define('ui-window-content-card', UIWindowContentCard)
