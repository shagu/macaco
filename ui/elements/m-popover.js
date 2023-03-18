import { html, css } from './m-template.js'

export default class MPopover extends HTMLElement {
  static shadow = null
  static background = null
  static popovers = []

  static template = html`
    <slot></slot>
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
  `

  static backgroundStyle = `
    display: none;
    position: fixed;

    top: 0;
    left: 0;

    width: 100vw;
    height: 100vh;

    z-index: 8;
  `

  visible = (state) => {
    MPopover.background.style.display = state ? 'block' : 'none'
    this.style.display = state ? 'block' : 'none'

    this.buttons.forEach((button) => {
      button.checked = !!state
    })
  }

  toggle (button) {
    if (this.style.display === 'block') {
      this.visible(false)
      return
    }

    for (const popover of MPopover.popovers) { popover.visible(false) }

    this.anchor = button
    this.visible(true)
    this.position()
  }

  position () {
    if (this.anchor) {
      // move popover to last anchor
      const toggle_rect = this.anchor.getBoundingClientRect()
      const popover_rect = this.getBoundingClientRect()

      const horizontal = (toggle_rect.left + toggle_rect.right) / 2 < window.innerWidth / 2 ? 'left' : 'right'
      const vertical = (toggle_rect.top + toggle_rect.bottom) / 2 < window.innerHeight / 2 ? 'top' : 'bottom'

      const left = horizontal === 'left' ? toggle_rect.left : toggle_rect.left + toggle_rect.width - popover_rect.width
      const top = vertical === 'top' ? toggle_rect.top + toggle_rect.height : toggle_rect.top - popover_rect.height

      this.style.top = `${top}px`
      this.style.left = `${left}px`
    } else {
      // center popover on screen
      const popover_rect = this.getBoundingClientRect()
      const top = window.innerHeight / 2 - popover_rect.height / 2
      const left = window.innerWidth / 2 - popover_rect.width / 2

      this.style.top = `${top}px`
      this.style.left = `${left}px`
    }
  }

  constructor () {
    super()

    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.adoptedStyleSheets = [MPopover.style]
    this.shadow.append(document.importNode(MPopover.template, true))
    MPopover.popovers.push(this)

    // reload position on resize
    window.addEventListener('resize', () => { this.position() })

    // attach popover to button
    this.buttons = document.querySelectorAll(`[m-popover="${this.getAttribute('name')}"]`)
    this.buttons.forEach((button) => {
      button.addEventListener('click', (ev) => this.toggle(button))
      button.style.position = button.style.position || 'relative'
      button.style.zIndex = '32'
    })

    // create clickable background
    if (MPopover.background) return
    MPopover.background = document.createElement('div')
    MPopover.background.style.cssText = MPopover.backgroundStyle
    document.body.appendChild(MPopover.background)

    MPopover.background.addEventListener('click', (ev) => {
      for (const popover of MPopover.popovers) { popover.visible(false) }
      ev.stopPropagation()
    })
  }
}

customElements.define('m-popover', MPopover)
