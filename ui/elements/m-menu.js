import { html, css } from './m-template.js'

export default class MMenu extends HTMLElement {
  static shadow = null
  static background = null
  static menus = []

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
    MMenu.background.style.display = state ? "block" : "none"
    this.style.display = state ? "block" : "none"

    this.buttons.forEach((button) => {
      button.checked = state ? true : false
    })
  }

  show(button) {
    if (this.style.display == "block") {
      this.visible(false)
      return
    }

    for(const menu of MMenu.menus) { menu.visible(false) }

    this.visible(true)

    if(button) {
      // move menu to toggle button
      const toggle_rect = button.getBoundingClientRect()
      const menu_rect = this.getBoundingClientRect()

      const horizontal = (toggle_rect.left + toggle_rect.right) / 2 < window.innerWidth / 2 ? "left" : "right"
      const vertical = (toggle_rect.top + toggle_rect.bottom) / 2 < window.innerHeight / 2 ? "top" : "bottom"

      const left = horizontal == "left" ? toggle_rect.left : toggle_rect.left + toggle_rect.width - menu_rect.width
      const top = vertical == "top" ? toggle_rect.top + toggle_rect.height : toggle_rect.top - menu_rect.height

      this.style.top = `${top}px`
      this.style.left = `${left}px`
    } else {
      // center menu on screen
      const menu_rect = this.getBoundingClientRect()
      const top = window.innerHeight / 2 - menu_rect.height / 2
      const left = window.innerWidth / 2 - menu_rect.width / 2

      this.style.top = `${top}px`
      this.style.left = `${left}px`
    }
  }

  constructor() {
    super()

    this.shadow = this.attachShadow({ mode: "open" })
    this.shadow.adoptedStyleSheets = [MMenu.style]
    this.shadow.append(document.importNode(MMenu.template, true))
    MMenu.menus.push(this)

    // attach menu to buttons
    this.buttons = document.querySelectorAll(`[m-menu="${this.getAttribute("name")}"]`)
    this.buttons.forEach((button) => {
      button.addEventListener("click", (ev) => this.show(button))
      button.style.position = button.style.position || "relative"
      button.style.zIndex = "32"
    })

    // create clickable background
    if (MMenu.background) return
    MMenu.background = document.createElement("div")
    MMenu.background.setAttribute("id", "m-menu-background")
    MMenu.background.style.cssText = MMenu.backgroundStyle
    document.body.appendChild(MMenu.background)

    MMenu.background.addEventListener("click", (ev) => {
      for(const menu of MMenu.menus) { menu.visible(false) }
      ev.stopPropagation()
    })
  }
}

customElements.define("m-menu", MMenu)