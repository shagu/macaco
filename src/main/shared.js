class Shared {
  static rootdir
  static userdir
  static window

  static unit = (bytes) => {
    if (bytes === 0 || !bytes) return 'N/A'

    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))

    if (i === 0) {
      return bytes + ' ' + sizes[i]
    } else {
      return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i]
    }
  }
}

module.exports = Shared
