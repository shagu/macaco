import { html, css } from '../widgets/m-template.js'

export default class UIWindowContent extends HTMLElement {
  static shadow = null

  static template = html`
    <div id="cards">
      <div id="welcome">
        <div id="icon">
          <img src="../../icon.png"/>
        </div>
        <div id="header">Magic Card Collection</div>
        <div id="text">
          Open an existing collection folder or create a new folder, where your collection should be stored at.
        </div>
      </div>
      <div id="select-rect"></div>
    </div>
  `

  static style = css`
    #cards {
      position: relative;
      min-width: 100%;
      min-height: 100%;
    }

    #select-rect {
      position: absolute;
      display: none;
      border: 1px var(--color-notify) solid;
      background: var(--color-accent);
      opacity: 0.4;
      z-index: 10;
      pointer-events: none;
    }

    #welcome {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);

      display: grid;
      grid-template-areas:
        'icon  header'
        'icon  text'
      ;

      align-items: center;
      justify-content: center;

      gap: 4px;

      color: var(--font-dark);
      width: 50%;
      max-width: 460px;
      height: min-content;
    }

    #welcome #header {
      grid-area: header;
      font-size: 24pt;
    }

    #welcome #text {
      grid-area: text;
      font-size: 12pt;
    }

    #welcome #icon {
      grid-area: icon;
    }

    #welcome #icon img {
      margin: 0px 4px;
      filter: grayscale(0.9) opacity(50%);
      max-height: 80px;
      aspect-ratio: 1/1;
    }
  `

  dom = {}
  cards = []
  view = []

  constructor () {
    super()

    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.adoptedStyleSheets = [this.constructor.style]
    this.shadow.append(document.importNode(this.constructor.template, true))

    for (const e of this.shadow.querySelectorAll('*')) {
      if (e.id) this.dom[e.id] = this.shadow.getElementById(e.id)
    }

    // rectangle selection state
    let rect = null
    let rectStart = null
    let rectAdditive = false
    let rectDrawn = false
    let rectBase = []
    let rectAnchor = null

    const rectShow = (box) => {
      this.dom['select-rect'].style.left = `${box.x}px`
      this.dom['select-rect'].style.top = `${box.y}px`
      this.dom['select-rect'].style.width = `${box.w}px`
      this.dom['select-rect'].style.height = `${box.h}px`
      this.dom['select-rect'].style.display = 'block'
    }

    const rectHide = () => {
      this.dom['select-rect'].style.display = 'none'
    }

    const rectCoords = (ev) => {
      const bounds = this.dom.cards.getBoundingClientRect()
      const x = Math.max(0, Math.min(ev.clientX - bounds.left, this.dom.cards.offsetWidth))
      const y = Math.max(0, Math.min(ev.clientY - bounds.top, this.dom.cards.offsetHeight))
      return { x, y }
    }

    const rectStop = () => {
      document.removeEventListener('mousemove', rectMove)
      document.removeEventListener('mouseup', rectFinish)
      rectHide()
      rect = null
      rectStart = null
      rectDrawn = false
    }

    const rectMove = (ev) => {
      if (!rectStart) return

      const pos = rectCoords(ev)
      if (!rectDrawn) {
        // ignore tiny movements, a plain click should still work
        if (Math.abs(pos.x - rectStart.x) < 4 && Math.abs(pos.y - rectStart.y) < 4) return
        rectDrawn = true
      }

      rect = {
        x: Math.min(rectStart.x, pos.x),
        y: Math.min(rectStart.y, pos.y),
        w: Math.abs(pos.x - rectStart.x),
        h: Math.abs(pos.y - rectStart.y)
      }
      rectShow(rect)
      rectSelect(rect)
    }

    // select every card whose center is inside the rectangle
    const rectSelect = (box) => {
      const selection = []
      let anchor = null
      for (const element of this.cards) {
        const cx = element.offsetLeft + element.offsetWidth / 2
        const cy = element.offsetTop + element.offsetHeight / 2
        if (cx >= box.x && cx <= box.x + box.w && cy >= box.y && cy <= box.y + box.h) {
          for (const card of element.cards) selection.push(card)
          anchor = element
        }
      }

      // merge with the existing selection in additive mode
      if (rectAdditive) {
        for (const card of selection) {
          if (!macaco.collection.selection.includes(card)) {
            macaco.collection.selection.push(card)
          }
        }
      } else {
        macaco.collection.selection = selection
      }

      macaco.collection.anchor = anchor
      macaco.events.invoke('update-collection-selection', macaco.collection.selection)
    }

    const rectFinish = () => {
      // the selection is already applied live while dragging
      const drawn = rectDrawn
      rectStop()
      if (!drawn) return

      // suppress the click event right after a rectangle drag
      this.rectDragged = true
    }

    document.addEventListener('keydown', (event) => {
      /* ignore if any element or input has focus */
      if (document.activeElement.tagName !== 'BODY') return

      /* escape cancels an active rectangle selection */
      if (event.code === 'Escape' && rectStart) {
        // restore the selection from before the drag
        macaco.collection.selection = rectBase
        macaco.collection.anchor = rectAnchor
        macaco.events.invoke('update-collection-selection', macaco.collection.selection)
        rectStop()
        return
      }

      if (event.ctrlKey && event.code === 'KeyA') {
        macaco.collection.selection = []
        for (const cluster of this.view) {
          cluster.forEach((card) => macaco.collection.selection.push(card))
        }
        macaco.events.invoke('update-collection-selection', macaco.collection.selection)
      } else if (event.code === 'Delete') {
        if (macaco.collection.selection.length > 0) {
          /* clone current selection */
          const selection = []
          macaco.collection.selection.forEach((el) => selection.push(el))

          /* show dialog */

          const dialog = {
            title: 'Delete Cards',
            label: `Do you really want to delete <b>${selection.length}</b> card${selection.length > 1 ? 's' : ''}?`,
            yes: {
              label: 'Yes',
              function: (ev) => {
                macaco.events.invoke('set-statistics-selection', [])
                macaco.ipc.invoke('delete-card', selection)
              }
            },
            no: {
              label: 'Cancel',
              function: (ev) => {}
            }
          }

          macaco.events.invoke('set-overlay-dialog', dialog)
        }
      } else if (event.code === 'Escape') {
        macaco.collection.selection = []
        macaco.events.invoke('update-collection-selection', macaco.collection.selection)
      }
    })

    this.dom.cards.onmousedown = (ev) => {
      // start a rectangle selection on empty space
      if (ev.button !== 0) return
      if (this.cards.length === 0) return
      if (ev.target.closest('ui-window-content-card')) return

      ev.preventDefault()
      rectStart = rectCoords(ev)
      rectAdditive = ev.ctrlKey || ev.shiftKey
      rectDrawn = false
      rectBase = [...macaco.collection.selection]
      rectAnchor = macaco.collection.anchor
      document.addEventListener('mousemove', rectMove)
      document.addEventListener('mouseup', rectFinish)
    }

    this.dom.cards.onclick = (ev) => {
      // ignore the click event right after a rectangle drag
      if (this.rectDragged) {
        this.rectDragged = false
        return
      }

      macaco.collection.selection = []
      macaco.events.invoke('update-collection-selection', macaco.collection.selection)
    }

    const resolveAnchor = () => {
      const anchor = macaco.collection.anchor
      if (!anchor) return -1

      // anchor element might be gone after a view rebuild
      const index = this.cards.indexOf(anchor)
      if (index >= 0) return index

      const ref = anchor.cards && anchor.cards[0]
      if (!ref) return -1
      return this.cards.findIndex((element) => element.cards[0] === ref)
    }

    macaco.events.register('select-card-range', (ev, element) => {
      // select every card between the anchor and the clicked element
      const from = resolveAnchor()
      const to = this.cards.indexOf(element)

      // no valid anchor, fall back to a plain click
      if (from < 0 || to < 0) {
        macaco.collection.anchor = element
        element.selector(false)
        return
      }

      const [first, last] = from < to ? [from, to] : [to, from]
      const selection = []
      for (let i = first; i <= last; i++) {
        for (const card of this.cards[i].cards) {
          selection.push(card)
        }
      }

      macaco.collection.selection = selection
      macaco.collection.anchor = this.cards[last]
      macaco.events.invoke('update-collection-selection', selection)
    })

    const updateSelection = (ev, selection) => {
      // remove previous selections
      for (const element of this.cards) {
        element.classList.remove('active')
        element.classList.remove('recent')
      }

      // add active class to selected groups
      for (const element of this.cards) {
        for (const selected of macaco.collection.selection) {
          if (element.cards.includes(selected)) {
            element.classList.add('active')
          }
        }
      }

      // add recent class to recently changed groups
      for (const element of this.cards) {
        for (const card of element.cards) {
          if (macaco.collection.diff.includes(card.fsurl)) {
            this.scrollTop = element.offsetTop - element.offsetHeight
            element.classList.add('recent')
          }
        }
      }
    }

    const updateView = (ev, view) => {
      // clear current view
      this.dom.cards.innerHTML = ''

      // keep the selection rectangle attached to the cards container
      this.dom.cards.appendChild(this.dom['select-rect'])

      // cache dom object of same cards
      this.cards = []
      this.view = view

      // add card for each entry in view
      for (const cluster of view) {
        const element = document.createElement('ui-window-content-card')
        element.cards = cluster
        this.dom.cards.appendChild(element)
        this.cards.push(element)
      }

      // update selected cards
      updateSelection()
    }

    macaco.events.register('update-collection-selection', updateSelection)
    macaco.events.register('update-collection-view', updateView)
  }
}

customElements.define('ui-window-content', UIWindowContent)
