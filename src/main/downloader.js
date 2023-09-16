const fs = require('fs')
const http = require('https')
const path = require('path')
const shared = require('./shared.js')

class Downloader {
  static processes

  constructor() {
    this.processes = {}
  }

  notify(status, size, downloaded, file, url, real_url, queue) {
    const percent = size > 0 ? (100.0 * downloaded / size).toFixed() : 0
    let string = "Downloading"

    if (status === 1) string = "Done"
    if (status === -1) string = "Error"

    if(shared.window) {
      shared.window.webContents.send('set-popup', "Download", url, `${downloaded} of ${size} (${percent}) [${queue ? queue.tasks.length : 0}]`, percent)
    } else {
      console.log(string, `${percent}%`, size, downloaded, url)
    }
  }

  fetch(url, file, notify = this.notify, force, queue, originalUrl) {
    return new Promise((resolve, reject) => {
      notify(0, 0, 0, file, url, url, queue)

      const request = http.get(url, async (response) => {
        // handle non-200 http status codes
        if (response.statusCode === 301 || response.statusCode === 302) {
          await this.fetch(response.headers.location, file, notify, force, queue, (originalUrl || url))
          resolve()
        } else if (response.statusCode !== 200) {
          resolve()
        } else {
          const size = parseInt(response.headers['content-length'], 10)
          const url = originalUrl
          const real_url = url
          let downloaded = 0

          // create directory
          const destfolder = path.parse(file).dir
          fs.mkdirSync(destfolder, { recursive: true })

          // skip download of existing file with same size
          if (!force && fs.existsSync(file) && size === fs.statSync(file).size) {
            console.log('Skipping (same size)', file)
            resolve()
            return
          }

          // write the pipe directly into file
          const output = fs.createWriteStream(file)
          response.pipe(output)

          // notify goes here
          response.on('data', function (chunk) {
            downloaded += chunk.length
            notify(0, size, downloaded, file, url, real_url, queue)
          })

          output.on('finish', () => {
            output.close()
            notify(1, size, size, file, url, real_url, queue)
            resolve()
          })
        }
      })

      request.on('error', function (err) {
        notify(-1, size, size, file, url, real_url, queue)
        resolve(err)
      })
    })
  }

  // TODO same url? same path? return existing promise
  queue(url, path, notify, force, queueName) {
    // initialize empty process list by name
    if (!this.processes[queueName]) {
      this.processes[queueName] = { count: 0, tasks: [] }
    }

    const process = this.processes[queueName]

    // detect duplicate entries in queue
    const duplicate = process.tasks.find((task) => {
      return task.url == url && task.path == path && task.force == force;
    })

    // add new task to the process list
    if (!duplicate) {
      this.processes[queueName].tasks.push({
        url, path, notify, force, queue: this.processes[queueName]
      })
    }

    // runner
    if (!process.promise) {
      process.promise = new Promise(async (resolve, reject) => {
        while (process.tasks[0]) {
          const current = process.tasks.shift()
          await this.fetch(current.url, current.path, current.notify, current.force, current.queue)
        }

        process.promise = null
        resolve(true)
      })
    }

    return process.promise
  }
}

module.exports = new Downloader()
