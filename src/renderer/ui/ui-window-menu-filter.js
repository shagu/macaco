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

    ::slotted(m-grid) {
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
      if(e.id) this.dom[e.id] = this.shadow.getElementById(e.id)
    }
  }
}

customElements.define('ui-window-menu-filter', UIWindowMenuFilter)