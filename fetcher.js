const fs = require('fs')
const http = require('https')
const spath = require('path')

const fetcher = {
  processes: {}
}

// core download function
fetcher.get = (url, path, notify, force, original_url) => {
  return new Promise((resolve, reject) => {
    const request = http.get(url, async (response) => {
      // handle http status codes
      if (response.statusCode === 301 || response.statusCode === 302) {
        // recursive call on redirect, call self again
        await fetcher.get(response.headers.location, path, notify, force, (original_url || url))
        resolve()
        return
      } else if (response.statusCode !== 200) {
        resolve()
        return
      }

      // fetch it
      const size = parseInt(response.headers['content-length'], 10)
      let downloaded = 0

      // create directory
      const destfolder = spath.parse(path).dir
      fs.mkdirSync(destfolder, { recursive: true })

      // skip download of existing file with same size
      if (!force && fs.existsSync(path) && size == fs.statSync(path).size) {
        console.log('Skipping (same size)', path)
        resolve()
        return
      }

      // build default notify status object
      const status = { url: (original_url || url), path, size }

      // notify goes here
      response.on('data', function (chunk) {
        downloaded += chunk.length

        // update notify status
        status.current = downloaded
        status.percent = (100.0 * downloaded / size).toFixed()
        status.finished = false

        // call notify function
        if (notify) notify(status)
      })

      // open file
      const file = fs.createWriteStream(path)

      // write the pipe directly into file
      response.pipe(file)

      // close file and resolve promise when done
      file.on('finish', () => {
        // update notify status
        status.current = downloaded
        status.percent = (100.0 * downloaded / size).toFixed()
        status.finished = true

        // call notify function
        if (notify) notify(status)

        // close file
        file.close()
        resolve()
      })
    })

    request.on('error', function (err) {
      if (notify) {
        // show error in notification
        const status = {
          url: err,
          path,
          percent: 0,
          finished: false
        }

        // hide after 5 seconds
        notify(status)
        setTimeout(() => {
          status.percent = 100
          status.finished = true
          notify(status)
        }, 5000)
      } else {
        console.log(original_url, url, err)
      }

      resolve(err)
    })
  })
}

// returns a promise that will resolve when all downloads
// of the same queue-name (options.name) have been finished.
fetcher.queue = (url, path, notify, force, queue_name) => {
  // initialize empty process list by name
  if (!fetcher.processes[queue_name]) {
    fetcher.processes[queue_name] = { count: 0, tasks: [] }
  }

  // add new task to the process list
  fetcher.processes[queue_name].tasks.push({
    url, path, notify, force
  })

  const process = fetcher.processes[queue_name]

  // runner
  if (!process.promise) {
    process.promise = new Promise(async (resolve, reject) => {
      while (process.tasks[0]) {
        const current = process.tasks.shift()
        await fetcher.get(current.url, current.path, current.notify, current.force)
      }

      process.promise = null
      resolve(true)
    })
  }

  return process.promise
}

module.exports = fetcher
