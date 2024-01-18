import { html, css } from './m-template.js'

export default class MPopover extends HTMLElement {
  static shadow = null

  static popovers = {}
  static buttons = {}

  static template = html`
    <slot></slot>
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

  toggle (menu, button) {
    // update state of all buttons and menus
    for (const [, popover] of Object.entries(MPopover.popovers)) {
      if (popover === menu) {
        popover.state = !popover.state
      } else {
        popover.state = false
      }
    }

    // reset all check buttons
    for (const button of Object.entries(MPopover.buttons)) {
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

  connectedCallback () {
    const slots = this.shadow.querySelector('slot')
    const popovers = slots.assignedElements({ flatten: true })

    for (const button of this.querySelectorAllShadows('[m-popover]')) {
      const label = button.getAttribute('m-popover')
      MPopover.buttons[label] = button
    }

    for (const popover of popovers) {
      const label = popover.getAttribute('id')
      MPopover.popovers[label] = popover
    }

    for (const [id, button] of Object.entries(MPopover.buttons)) {
      if (MPopover.popovers[id]) {
        button.addEventListener('click', (ev) => {
          button.style.position = button.style.position || 'relative'
          button.style.zIndex = '32'
          this.toggle(MPopover.popovers[id], button)
        })
      }
    }
  }

  querySelectorAllShadows (selector, el = document.body) {
    // credits to @domiii <https://stackoverflow.com/a/71692555>
    // recurse on childShadows
    const childShadows = Array.from(el.querySelectorAll('*')).map(el => el.shadowRoot).filter(Boolean)
    const childResults = childShadows.map(child => this.querySelectorAllShadows(selector, child))

    // fuse all results into singular, flat array
    const result = Array.from(el.querySelectorAll(selector))
    return result.concat(childResults).flat()
  }

  constructor () {
    super()

    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.adoptedStyleSheets = [this.constructor.style]
    this.shadow.append(document.importNode(this.constructor.template, true))

    // reload position on resize
    window.addEventListener('resize', () => {
      for (const [id, popover] of Object.entries(MPopover.popovers)) {
        if (popover.state === true) {
          this.position(popover, MPopover.buttons[id])
        }
      }
    })

    // create clickable background
    this.addEventListener('click', (ev) => {
      // reset all check buttons
      for (const [, button] of Object.entries(MPopover.buttons)) {
        button.checked = false
      }

      // update state of all buttons and menus
      for (const [, popover] of Object.entries(MPopover.popovers)) {
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

customElements.define('m-popover', MPopover)
