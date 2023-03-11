import { html, css } from './m-template.js'

export default class MCard extends HTMLElement {
  static shadow = null
  static observer = null

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

  static click(ev) {
    frontend.set_preview(this.data, true)
    frontend.reload_view_selection()
    ev.stopPropagation()
  }

  static dragstart(ev) {
    ev.dataTransfer.setData("text/plain", JSON.stringify(ev.target.data))
  }

  state(state) {
    this.className = state || "normal"
  }

  disconnectedCallback() {
    MCard.observer.unobserve(this)
  }

  connectedCallback() {
    MCard.observer = MCard.observer || new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.populate()
          observer.unobserve(entry.target)
        }
      })
    }, {
      root: this.parentNode,
      rootMargin: "1080px",
    })

    MCard.observer.observe(this)
  }

  populate() {
    const card = this.data
    const identifier = `[${card.set}.${card.number}.${card.language}${card.foil ? '.f' : ''}]`

    const image = document.createElement('img')
    image.setAttribute("id", "image")
    image.setAttribute('src', card.file)
    this.shadow.appendChild(image)

    const title = document.createElement('div')
    title.setAttribute("id", "title")
    title.innerHTML = frontend.get_locale(card, "name") || identifier
    this.shadow.appendChild(title)

    const count = document.createElement('div')
    count.setAttribute("id", "count")
    count.innerHTML = `${card.count}x`
    this.shadow.appendChild(count)

    const price = document.createElement('div')
    price.setAttribute("id", "price")
    if(card.price) {
      price.innerHTML = `${card.price.toFixed(2)}€`
    } else {
      price.innerHTML = `N/A`
    }

    this.shadow.appendChild(price)

    if ( this.combine ) {
      count.style.display = "inline-block"
    } else {
      count.style.display = "none"
    }

    if ( card.price ) {
      if ( card.price > 10.0 ) {
        price.style = "color: #f55;"
      } else if ( card.price > 1.0 ) {
        price.style = "color: #fa5;"
      } else {
        price.style = "color: #fff;"
      }
    } else {
      price.style = "color: #555;"
    }

    this.setAttribute("draggable", true)
    this.ondragstart = MCard.dragstart
    this.onclick = MCard.click
  }

  constructor() {
    super()

    this.shadow = this.attachShadow({ mode: "open" })
    this.shadow.adoptedStyleSheets = [MCard.style]
    this.shadow.append(document.importNode(MCard.template, true))
  }
}

customElements.define("m-card", MCard)