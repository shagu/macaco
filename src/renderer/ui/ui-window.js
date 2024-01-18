import { html, css } from '../widgets/m-template.js'

export default class UIWindow extends HTMLElement {
  static shadow = null

  static template = html`
    <!-- Layout -->
    <ui-window-header id="header"></ui-window-header>
    <ui-window-library id="library"></ui-window-library>
    <ui-window-content id="content"></ui-window-content>
    <ui-window-sidebar id="sidebar"></ui-window-sidebar>
    <ui-window-footer id="footer"></ui-window-footer>

    <!-- Overlays -->
    <ui-window-menu></ui-window-menu>
    <ui-window-overlay></ui-window-overlay>
    <ui-window-popups></ui-window-popups>
  `

  static style = css`
    :host {
      width: 100%;
      height: 100%;

      display: grid;
      grid-template-areas:
        'header   header  header'
        'library  content sidebar'
        'library  footer  sidebar'
      ;

      gap: 0px;
      grid-template-columns: auto 1fr auto;
      grid-template-rows: auto 1fr auto;

      border: 1px var(--border-dark) solid;
      background: var(--window-light);
      box-sizing: border-box;
    }

    #header {
      grid-area: header;
    }

    #library {
      grid-area: library;
      min-width: 8px;
      overflow-y: auto;
      overflow-x: hidden;
    }

    #content {
      grid-area: content;
      overflow-y: auto;
      overflow-x: hidden;

      background: var(--window-dark);
      padding: 5px;

      border-left: 1px var(--border-normal) solid;
      border-right: 1px var(--border-normal) solid;
      border-bottom: 1px var(--border-normal) solid;
    }

    #sidebar {
      grid-area: sidebar;
      overflow-y: auto;
      overflow-x: hidden;

      min-width: 8px;
    }

    #footer {
      grid-area: footer;
    }
  `

  constructor () {
    super()

    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.adoptedStyleSheets = [UIWindow.style]
    this.shadow.append(document.importNode(UIWindow.template, true))
  }
}

customElements.define('ui-window', UIWindow)
