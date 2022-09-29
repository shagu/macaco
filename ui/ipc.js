const { remote, ipcRenderer } = require('electron')

window.addEventListener('DOMContentLoaded', () => {
  // popup handler:
  ipcRenderer.on('popup', popups.event)

  // collection handler:
  ipcRenderer.on('update-collection', collection.event['update-collection'])
  ipcRenderer.on('add-card-update',   collection.event['add-card-update'])

  collection.invoke['add-card'] = (card) => ipcRenderer.invoke('add-card', card)
  collection.invoke['load-card'] = (card) => ipcRenderer.invoke('load-card', card)
  collection.invoke['open-folder'] = () => ipcRenderer.invoke('open-folder')
  collection.invoke['import-backup'] = (path) => ipcRenderer.invoke('import-backup', path)
  collection.invoke['download-metadata'] = () => ipcRenderer.invoke('download-metadata')
})
