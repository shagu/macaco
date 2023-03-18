// popups.js - ui popup handler
//
// register in preload.js as:
// ipcRenderer.on('popup', popups.event)
//
// add html element as:
// <div id="popups"></div>
//

const popups = { ui_elements: [] }

popups.create = (id) => {
  // return existing popup with id
  for (const popup of popups.ui_elements) {
    if (popup.id == id) return popup
  }

  // build new popup element
  const parent = document.getElementById('popups')

  const box = document.createElement('div')
  box.setAttribute('id', 'popup-box')
  parent.appendChild(box)

  const title = document.createElement('div')
  title.setAttribute('id', 'popup-title')
  box.appendChild(title)

  const subtext = document.createElement('div')
  subtext.setAttribute('id', 'popup-subtext')
  box.appendChild(subtext)

  const progress = document.createElement('progress')
  progress.setAttribute('id', 'popup-progress')
  box.appendChild(progress)

  // add popup to array
  popups.ui_elements.push({
    id,
    box,
    title,
    subtext,
    progress
  })

  // return new popup
  for (const popup of popups.ui_elements) {
    if (popup.id == id) return popup
  }
}

popups.show = (title, subtext, progress) => {
  const popup = popups.create(title)
  popup.title.innerHTML = title
  popup.subtext.innerHTML = subtext
  popup.progress.value = progress

  if (!progress) { popup.progress.removeAttribute('value') }

  popup.box.style = 'display: inline-block;'

  if (progress && progress >= 1) {
    // progress is finished, hide after 2 seconds
    popup.timeout = Date.now() + 2000
  } else if (progress) {
    // timeout of 10 seconds for progress tasks
    popup.timeout = Date.now() + 10000
  } else {
    // timeout of 1 hour for unknown tasks
    popup.timeout = Date.now() + 3600000
  }
}

popups.cleanup = () => {
  for (const popup of popups.ui_elements) {
    if (popup.timeout < Date.now()) {
      popup.box.style = 'display: none'
    }
  }
}

popups.event = (event, data) => {
  popups.show(data.title, data.subtext, data.progress)
}

setInterval(popups.cleanup, 100)
