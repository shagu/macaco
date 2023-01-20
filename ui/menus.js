let menus = { buttons: { }, frames: { } }

menus.init = () => {
  document.body.addEventListener('click', menus.toggle)

  const menu_buttons = document.getElementsByClassName("menu-button")
  for(const button of menu_buttons) {
    if (!button.id) continue

    const id = button.id
    const frame = document.getElementById(`${id}-frame`)

    menus.buttons[id] = button
    menus.frames[id] = frame

    button.addEventListener('click', menus.button_click)
    frame.addEventListener('click', menus.frame_click)
  }
}

menus.move_frame = (name) => {
  const button = menus.buttons[name]
  const frame = menus.frames[name]

  const button_rect = button.getBoundingClientRect()
  const frame_rect = frame.getBoundingClientRect()

  const top = button_rect.top + button_rect.height
  const left = button_rect.left + button_rect.width - frame_rect.width

  frame.style.top = `${top + 1 }px`
  frame.style.left = `${left}px`
}

menus.frame_click = (e) => {
  e.stopPropagation()
}

menus.button_click = (e) => {
  const menu_id = e.target.id

  menus.toggle(menu_id)
  menus.move_frame(menu_id)

  e.stopPropagation()
}

menus.toggle = (query) => {
  for (const [name, frame] of Object.entries(menus.frames)) {
    frame.style.display = name == query && frame.style.display !== "block" ? "block" : "none"
  }
}

window.addEventListener('DOMContentLoaded', menus.init)
