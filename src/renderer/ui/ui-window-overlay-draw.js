import { html, css } from '../widgets/m-template.js'

export default class UIWindowOverlayDraw extends HTMLElement {
  static shadow = null

  static template = html`
    <m-grid vertical="1">
      <m-grid vertical="1">
        <div id='label'>Draw Seven</div>
      </m-grid>

      <m-grid horizontal="1">
        <m-grid class="card" vertical="1" id="slot-1">
          <img src="" id="slot-1-image"/>
          <div id="slot-1-name"></div>
        </m-grid>

        <m-grid class="card" vertical="1" id="slot-2">
          <img src="" id="slot-2-image"/>
          <div id="slot-2-name"></div>
        </m-grid>

        <m-grid class="card" vertical="1" id="slot-3">
          <img src="" id="slot-3-image"/>
          <div id="slot-3-name"></div>
        </m-grid>

        <m-grid class="card" vertical="1" id="slot-4">
          <img src="" id="slot-4-image"/>
          <div id="slot-4-name"></div>
        </m-grid>
      </m-grid>

      <m-grid horizontal="1">
        <m-grid class="card" vertical="1" id="slot-5">
          <img src="" id="slot-5-image"/>
          <div id="slot-5-name"></div>
        </m-grid>

        <m-grid class="card" vertical="1" id="slot-6">
          <img src="" id="slot-6-image"/>
          <div id="slot-6-name"></div>
        </m-grid>

        <m-grid class="card" vertical="1" id="slot-7">
          <img src="" id="slot-7-image"/>
          <div id="slot-7-name"></div>
        </m-grid>

        <m-grid class="card" vertical="1" id="slot-8">
          <img src="" id="slot-8-image"/>
          <div id="slot-8-name"></div>
        </m-grid>
      </m-grid>
      <m-grid horizontal="1">
        <m-button id=mulligan>Mulligan</m-button>
        <m-button id=close>Close</m-button>
      </m-grid>

    </m-grid>
  `

  static style = css`
    m-grid {
      padding: 8px;
      justify-content: center;
      align-items: center;
    }

    m-grid.card {
      margin: 0px 4px;
      padding: 4px;
      background-color: var(--widget-normal);
      border: 1px var(--border-normal) solid;
    }

    m-button {
      min-width: 100px;
    }

    m-grid img {
      margin: 5px;

      max-width: 15vw;
      max-height: 30vh;

      aspect-ratio: 2.5/3.5;
    }

    #label {
      font-size: large;
      color: var(--font-light);
    }
  `

  dom = {}

  shuffle (cards) {
    let copy = cards.slice(0)

    return function() {
      // create new copy if old pile is exhausted
      if (copy.length < 1) copy = cards.slice(0)

      // pick one cards and remove it from copy
      const index = Math.floor(Math.random() * copy.length)
      const card = copy[index]
      copy.splice(index, 1)

      return card
    }
  }

  set (parent, cards) {
    this.cards = cards
    const draw = this.shuffle(cards)

    for (let i = 1; i <= 8; i++) {
      const card = draw()
      this.dom[`slot-${i}-image`].src = card.fsurl
      this.dom[`slot-${i}-name`].innerHTML = card.name
    }

    this.dom['slot-8-image'].realSrc = this.dom['slot-8-image'].src
    this.dom['slot-8-image'].src = '../../assets/cards/background.jpg'

    this.dom['slot-8-name'].realInnerHTML = this.dom['slot-8-name'].innerHTML
    this.dom['slot-8-name'].innerHTML = "Draw"

    this.dom['slot-8'].onclick = (ev) => {
      this.dom['slot-8-image'].src = this.dom['slot-8-image'].realSrc
      this.dom['slot-8-name'].innerHTML = this.dom['slot-8-name'].realInnerHTML
    }

    this.dom.mulligan.onclick = (ev) => {
      macaco.events.invoke('set-overlay-draw', this.cards)
    }

    this.dom.close.onclick = (ev) => {
      parent.hide()
    }

    macaco.events.invoke('update-overlay-draw', this.cards)
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

customElements.define('ui-window-overlay-draw', UIWindowOverlayDraw)
