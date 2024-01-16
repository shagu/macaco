import { html, css } from '../widgets/m-template.js'

export default class UIWindowMenu extends HTMLElement {
  static shadow = null
  static background = null
  static popovers = []
  static buttons = []

  static template = html`
    <ui-window-menu-filter id="filter"></ui-window-menu-filter>
    <ui-window-menu-statistics id="statistics"></ui-window-menu-statistics>
    <ui-window-menu-main id="main"></ui-window-menu-main>
  `

  static style = css`
    :host {
      display: none;
      position: fixed;

      top: 0;
      left: 0;

      width: 100vw;
      height: 100vh;

      z-index: 64;
    }
  `

  dom = {}

  toggle (menu, button) {
    // save menus and buttons into array for later use
    if (!UIWindowMenu.popovers.includes(menu)) UIWindowMenu.popovers.push(menu)
    if (!UIWindowMenu.buttons.includes(button)) UIWindowMenu.buttons.push(button)

    // update state of all buttons and menus
    for (const popover of UIWindowMenu.popovers) {
      if (popover === menu) {
        popover.state = !popover.state
      } else {
        popover.state = false
      }
    }

    // reset all check buttons
    for (const button of UIWindowMenu.buttons) {
      button.checked = false
    }

    // check button and show menu
    menu.style.display = menu.state ? 'block' : 'none'
    button.checked = menu.state

    // show clickable backdrop
    this.style.display = menu.state ? 'block' : 'none'

    // anchor menu to button
    this.position(menu, button)
  }

  position (menu, button) {
    if (button) {
      // move popover to last anchor
      const toggleRect = button.getBoundingClientRect()
      const popoverRect = menu.getBoundingClientRect()

      const horizontal = (toggleRect.left + toggleRect.right) / 2 < window.innerWidth / 2 ? 'left' : 'right'
      const vertical = (toggleRect.top + toggleRect.bottom) / 2 < window.innerHeight / 2 ? 'top' : 'bottom'

      const left = horizontal === 'left' ? toggleRect.left : toggleRect.left + toggleRect.width - popoverRect.width
      const top = vertical === 'top' ? toggleRect.top + toggleRect.height : toggleRect.top - popoverRect.height

      menu.style.top = `${top}px`
      menu.style.left = `${left}px`
    } else if (menu) {
      // center popover on screen
      const popoverRect = menu.getBoundingClientRect()
      const top = window.innerHeight / 2 - popoverRect.height / 2
      const left = window.innerWidth / 2 - popoverRect.width / 2

      menu.style.top = `${top}px`
      menu.style.left = `${left}px`
    }
  }

  constructor () {
    super()

    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.adoptedStyleSheets = [this.constructor.style]
    this.shadow.append(document.importNode(this.constructor.template, true))

    for (const e of this.shadow.querySelectorAll('*')) {
      if (e.id) this.dom[e.id] = this.shadow.getElementById(e.id)
    }

    // register on set-menu events to toggle menus
    macaco.events.register('set-menu', (ev, name, button) => {
      for (const menu of this.shadow.querySelectorAll(`#${name}`)) {
        button.style.position = button.style.position || 'relative'
        button.style.zIndex = '32'
        this.toggle(menu, button)
      }
    })

    // reload position on resize
    window.addEventListener('resize', () => { })

    // create clickable background
    this.addEventListener('click', (ev) => {
      // reset all check buttons
      for (const button of UIWindowMenu.buttons) { button.checked = false }

      // update state of all buttons and menus
      for (const popover of UIWindowMenu.popovers) {
        popover.style.display = 'none'
        popover.state = false
      }

      // show clickable backdrop
      this.style.display = 'none'

      // stop propagation
      ev.stopPropagation()
    })
  }
}

customElements.define('ui-window-menu', UIWindowMenu)
