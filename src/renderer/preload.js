const { ipcRenderer } = require('electron')

window.addEventListener('DOMContentLoaded', () => {
  // list of all events sent from main process to frontend
  const events = [
    'update-collection',
    'update-card-preview',
    'set-popup',
  ]

  // ipc-on: register all events to macaco functions
  for (const event of events) {
    ipcRenderer.on(event, (...args) => {
      macaco.ipc.on[event] = macaco.ipc.on[event] || []
      for (const callback of macaco.ipc.on[event]) {
        callback(...args)
      }
    })
  }

  // ipc-invoke: store ipc function on all triggers
  macaco.ipc.invoke = (ev, ...args) => {
    ipcRenderer.invoke(ev, ...args)
  }

  // TODO // DEBUG
  macaco.ipc.invoke('set-collection', "/home/eric/projects/macaco-testdata")
})
