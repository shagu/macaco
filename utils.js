module.exports = {
  popup: (title, subtext, progress) => {
    core.window.webContents.send('popup', {
      title: title, subtext: subtext, progress: progress
    })
  },

  byte_units: (bytes) => {
    if (bytes == 0 || !bytes) return 'n/a'

    let sizes = [ 'Bytes', 'KB', 'MB', 'GB', 'TB' ]

    let i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))

    if (i == 0) {
      return bytes + ' ' + sizes[i]
    } else {
      return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i]
    }
  }
}
