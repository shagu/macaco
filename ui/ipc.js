const { remote, ipcRenderer } = require('electron')

window.addEventListener('DOMContentLoaded', () => {
  // popup handler:
  ipcRenderer.on('popup', popups.event)

  // frontend handler:
  ipcRenderer.on('update-collection', frontend.event['update-collection'])
  ipcRenderer.on('add-card-update',   frontend.event['add-card-update'])

  frontend.invoke['add-card'] = (card) => ipcRenderer.invoke('add-card', card)
  frontend.invoke['load-card'] = (card) => ipcRenderer.invoke('load-card', card)
  frontend.invoke['move-card'] = (card, dest) => ipcRenderer.invoke('move-card', card, dest)
  frontend.invoke['new-folder'] = (name) => ipcRenderer.invoke('new-folder', name)
  frontend.invoke['open-folder'] = () => ipcRenderer.invoke('open-folder')
  frontend.invoke['import-backup'] = (path) => ipcRenderer.invoke('import-backup', path)
  frontend.invoke['download-metadata'] = () => ipcRenderer.invoke('download-metadata')

  // window controls
  frontend.invoke['window-minimize'] = () => ipcRenderer.invoke('window-minimize')
  frontend.invoke['window-maximize'] = () => ipcRenderer.invoke('window-maximize')
  frontend.invoke['window-close'] = () => ipcRenderer.invoke('window-close')
})
