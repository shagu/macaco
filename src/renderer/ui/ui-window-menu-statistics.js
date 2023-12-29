import { html, css } from '../widgets/m-template.js'

export default class UIWindowMenuStatistics extends HTMLElement {
  static shadow = null

  static template = html`
    <m-grid horizontal=1 id=header>
      <div id=title></div>
      <div id=icon></div>
    </m-grid>

    <!-- Mana -->
    <m-grid vertical=1>
      <div class=header>Mana</div>
      <m-grid horizontal=1 id=mana-diagram></m-grid>
      <m-grid horizontal=1 id=mana-average></m-grid>
    </m-grid>

    <!-- Price -->
    <m-grid vertical=1 id=card-prices>
      <div class=header>Price</div>
      <m-grid horizontal=1 id=price-total></m-grid>
      <m-grid horizontal=1 id=price-average></m-grid>
    </m-grid>

    <!-- Card Types -->
    <m-grid vertical=1 id=card-types>
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
      margin: 4px 2px;
      padding: 4px;
      background-color: var(--widget-normal);
      border: 1px var(--border-normal) solid;
      text-align: left;
    }

    m-grid[horizontal] {
      margin: 2px;
      border: none;
      padding: 0px 4px;
    }

    m-grid .header {
      margin: 4px 2px;
      color: var(--font-dark);
      width: 100%;
    }

    m-grid .label {
      font-weight: bold;
    }

    m-grid .content {
      text-align: right;
    }

    #header {
      margin: 4px 2px;
      padding: 4px;
      border: 1px var(--border-normal) solid;
    }

    #header #title {
      font-weight: bold;
    }

    #header #icon img {
      height: 18px;
      aspect-ratio: 1/1;
      vertical-align: middle;
    }

    #mana-diagram .table {
      display: table;
      box-sizing: border-box;
      width: 100%;
    }

    #mana-diagram .table .row {
      display: table-row;
      text-align: center;
    }

    #mana-diagram .table .row .label {
      color: var(--font-dark);
    }

    #mana-diagram .table .cell {
      display: table-cell;
      vertical-align: bottom;
      font-size: smaller;
    }

    #mana-diagram .table .cell .bar {
      display: block;
      background: var(--color-notify);
      width: 14px;
      margin: 1px 4px;
    }
  `

  dom = {}

  set = (stats) => {
    // folder title and icon
    if (stats.icon && stats.title) {
      this.dom.icon.innerHTML = `<img src="../../assets/mana/${stats.icon}.png" />`
      this.dom.title.innerHTML = stats.title || 'N/A'
    }

    // mana curve diagram
    if (stats.mana.values) {
      let maxCount = 1
      const values = {}

      // read all mana values, detect maximum and set limit to 8
      for (const [cmc, count] of Object.entries(stats.mana.values)) {
        maxCount = Math.max(maxCount, count)
        values[Math.min(cmc, 8)] = values[Math.min(cmc, 8)] || 0
        values[Math.min(cmc, 8)] += count
      }

      // build the ui of the mana diagram
      const frame = this.shadow.getElementById('mana-diagram')
      frame.innerHTML = ''

      const table = document.createElement('div')
      table.classList = 'table'
      frame.appendChild(table)

      const rowTop = document.createElement('div')
      rowTop.classList = 'row'
      table.appendChild(rowTop)

      const rowBottom = document.createElement('div')
      rowBottom.classList = 'row'
      table.appendChild(rowBottom)

      for (let cmc = 1; cmc <= 8; cmc++) {
        const count = values[cmc] || 0
        const height = Math.max(1, count / maxCount * 16)
        const bar = `<div class=bar style="height: ${height}px"></div>`

        const cellDisplay = document.createElement('div')
        cellDisplay.classList = 'cell'
        cellDisplay.innerHTML = `${count > 0 ? count : ''}${bar}`
        rowTop.appendChild(cellDisplay)

        const cellLabel = document.createElement('div')
        cellLabel.classList = 'cell label'
        cellLabel.innerHTML = cmc
        rowBottom.appendChild(cellLabel)
      }
    }

    // mana values
    if (stats.mana.avg) {
      const frame = this.shadow.getElementById('mana-average')
      frame.innerHTML = `
        <div class=label>Average Mana</div>
        <div class=content id=avg_mana>${stats.mana.avg ? stats.mana.avg.toFixed(1) : 'N/A'}</div>
      `
    }

    // card types and count
    if (stats.types && stats.cards) {
      const frame = this.shadow.getElementById('card-types')
      frame.innerHTML = `
        <div class=header>Cards</div>

        <m-grid horizontal=1>
          <div class=label>Total</div>
          <div class=content>${stats.cards}</div>
        </m-grid>
      `

      // sort all card types by card count
      const sortable = Object.fromEntries(
        Object.entries(stats.types).sort(([, a], [, b]) => b - a)
      )

      for (const [type, count] of Object.entries(sortable)) {
        frame.innerHTML += `
          <m-grid horizontal=1>
            <div class=label>${type}</div>
            <div class=content id=>${count}</div>
          </m-grid>
        `
      }
    }

    // card prices
    if (stats.price) {
      const total = this.shadow.getElementById('price-total')
      total.innerHTML = `
        <div class=label>Total</div>
        <div class=content>${stats.price.sum ? stats.price.sum.toFixed(2) : 'N/A'}€</div>
      `
      const average = this.shadow.getElementById('price-average')
      average.innerHTML = `
        <div class=label>Average</div>
        <div class=content>${stats.price.avg ? stats.price.avg.toFixed(2) : 'N/A'}€</div>
      `
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

    macaco.events.register(`update-statistics-view`, (ev, stats) => this.set(stats))
  }
}

customElements.define('ui-window-menu-statistics', UIWindowMenuStatistics)
