import { html, css } from '../widgets/m-template.js'

export default class UIWindowMenuFilter extends HTMLElement {
  static shadow = null

  static template = html`
    <div class="menu-segment-title">Filter</div>
    <m-grid horizontal="1" gap="1px">
      <div class="menu-multi-label">Manacost</div>
      <div><m-button id="filter-mana-0">0</m-button></div>
      <div><m-button id="filter-mana-1">1</m-button></div>
      <div><m-button id="filter-mana-2">2</m-button></div>
      <div><m-button id="filter-mana-3">3</m-button></div>
      <div><m-button id="filter-mana-4">4</m-button></div>
      <div><m-button id="filter-mana-5">5</m-button></div>
      <div><m-button id="filter-mana-6">6</m-button></div>
      <div><m-button id="filter-mana-7">7</m-button></div>
      <div><m-button id="filter-mana-8">8</m-button></div>
      <div><m-button id="filter-mana-9">9+</m-button></div>
    </m-grid>

    <m-grid horizontal="1" gap="1px">
      <div class="menu-multi-label">Rarity</div>
      <div><m-button id="filter-rarity-common">Common</m-button></div>
      <div><m-button id="filter-rarity-uncommon">Uncommon</m-button></div>
      <div><m-button id="filter-rarity-rare">Rare</m-button></div>
      <div><m-button id="filter-rarity-mythic">Mythic</m-button></div>
    </m-grid>

    <m-grid horizontal="1" gap="1px">
      <div class="menu-multi-label">Type</div>
      <div><m-button title="Instant" id="filter-type-instant">${macaco.icons.white}</m-button></div>
      <div><m-button title="Sorcery" id="filter-type-sorcery">${macaco.icons.sorcery}</m-button></div>
      <div><m-button title="Creature" id="filter-type-creature">${macaco.icons.creature}</m-button></div>
      <div><m-button title="Enchantment" id="filter-type-enchantment">${macaco.icons.enchantment}</m-button></div>
      <div><m-button title="Artifact" id="filter-type-artifact">${macaco.icons.artifact}</m-button></div>
      <div><m-button title="Planeswalker" id="filter-type-planeswalker">${macaco.icons.planeswalker}</m-button></div>
      <div><m-button title="Land" id="filter-type-land">${macaco.icons.land}</m-button></div>
    </m-grid>

    <div class="menu-segment-title">Sort</div>
    <m-grid horizontal="1" gap="1px">
      <div class="menu-multi-label">Sort by</div>
      <div><m-button id="sort-name">Name</m-button></div>
      <div><m-button id="sort-color">Color</m-button></div>
      <div><m-button id="sort-mana">Mana</m-button></div>
      <div><m-button id="sort-rarity">Rarity</m-button></div>
      <div><m-button id="sort-price">Price</m-button></div>
      <div><m-button id="sort-count">Count</m-button></div>
      <div><m-button id="sort-set">Set</m-button></div>
    </m-grid>

    <m-grid horizontal="1" gap="1px">
      <div class="menu-multi-label">Sort order</div>
      <div><m-button id="sort-mode-asc">▲ Ascending</m-button></div>
      <div><m-button id="sort-mode-desc">▼ Descending</m-button></div>
    </m-grid>

    <div class="menu-segment-title">Group</div>
    <m-grid horizontal="1" gap="1px">
      <div class="menu-multi-label">Group by</div>
      <div><m-button id="group-mode-id">Identical Cards</m-button></div>
      <div><m-button id="group-mode-name">Same Name</m-button></div>
    </m-grid>
  `

  static style = css`
    :host {
      display: none;

      position: fixed;

      width: min-content;
      max-height: max-content;

      background: var(--window-light);
      border: 1px var(--border-normal) solid;
      box-shadow: 0px 0px 5px var(--border-dark);

      padding: 5px;
      z-index: 16;
    }

    m-grid {
      margin: 2px;
      padding: 4px;
      background-color: var(--widget-normal);
      border: 1px var(--border-normal) solid;
    }

    div.menu-segment-title {
      padding: 4px;
      color: var(--font-dark);
    }

    div.menu-multi-label {
      text-align: left;
      white-space: nowrap;
      font-weight: bold;
      padding: 4px;
      margin: 4px;
    }

    div.menu-multi-entry {
      margin: 1px;
    }

    m-button svg {
      height: 14px;
      aspect-ratio: 1/1;
    }

    m-button {
      margin: 1px;
      white-space: nowrap;
      min-width: 100%;
    }

    hr {
      height: 0px;
      background-color: var(--border-light);
      border: none;
      margin: 5px;
    }
  `

  dom = {}

  constructor () {
    super()

    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.adoptedStyleSheets = [this.constructor.style]
    this.shadow.append(document.importNode(this.constructor.template, true))

    for (const e of this.shadow.querySelectorAll('*')) {
      if (e.id) this.dom[e.id] = this.shadow.getElementById(e.id)
    }

    // mana cost filters
    for (const cmc of ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']) {
      const button = this.dom[`filter-mana-${cmc}`]
      button.onclick = (ev) => {
        const state = !button.checked
        macaco.events.invoke('set-filter', 'cmc', cmc, state)
        ev.stopPropagation()
      }

      macaco.events.register('update-filter', (ev, filter) => {
        const state = filter.get('cmc', cmc)
        button.checked = state
      })
    }

    // rarity filters
    for (const rarity of ['common', 'uncommon', 'rare', 'mythic']) {
      const button = this.dom[`filter-rarity-${rarity}`]
      button.onclick = (ev) => {
        const state = !button.checked
        macaco.events.invoke('set-filter', 'rarity', rarity, state)
        ev.stopPropagation()
      }

      macaco.events.register('update-filter', (ev, filter) => {
        const state = filter.get('rarity', rarity)
        button.checked = state
      })
    }

    // card type filters
    for (const type of ['instant', 'sorcery', 'creature', 'enchantment', 'artifact', 'planeswalker', 'land']) {
      const button = this.dom[`filter-type-${type}`]
      button.onclick = (ev) => {
        const state = !button.checked
        macaco.events.invoke('set-filter', 'type', type, state)
        ev.stopPropagation()
      }

      macaco.events.register('update-filter', (ev, filter) => {
        const state = filter.get('type', type)
        button.checked = state
      })
    }

    // sort methods
    for (const method of ['name', 'color', 'mana', 'rarity', 'price', 'count', 'set']) {
      const button = this.dom[`sort-${method}`]
      button.onclick = (ev) => {
        const state = !button.checked
        macaco.events.invoke('set-filter', 'sort', method, state)
        ev.stopPropagation()
      }

      macaco.events.register('update-filter', (ev, filter) => {
        const state = filter.get('sort', method)
        button.checked = state
      })
    }

    // sort order mode
    for (const order of ['asc', 'desc']) {
      const button = this.dom[`sort-mode-${order}`]
      button.onclick = (ev) => {
        const state = !button.checked
        macaco.events.invoke('set-filter', 'order', order, state)
        ev.stopPropagation()
      }

      macaco.events.register('update-filter', (ev, filter) => {
        const state = filter.get('order', order)
        button.checked = state
      })
    }

    // combine cards
    for (const combine of ['id', 'name']) {
      const button = this.dom[`group-mode-${combine}`]
      if (combine === 'id') button.checked = true
      button.onclick = (ev) => {
        const state = !button.checked && combine
        macaco.events.invoke('set-combine', state)
        ev.stopPropagation()
      }

      macaco.events.register('update-combine', (ev, value) => {
        const state = value === combine
        button.checked = state
      })
    }
  }
}

customElements.define('ui-window-menu-filter', UIWindowMenuFilter)
