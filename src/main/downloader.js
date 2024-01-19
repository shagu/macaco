const fs = require('fs')
const http = require('https')
const path = require('path')
const shared = require('./shared.js')

class Downloader {
  static processes

  constructor () {
    this.processes = {}
  }

  notifier (info) {
    const small = info.downloaded > 0 && `${shared.unit(info.downloaded)} of ${shared.unit(info.size)}`
    shared.popup('Downloading', info.url, small, info.percent)
  }

  fetch (url, file, notify = this.notifier, force, queue, originalUrl) {
    const info = {
      file,
      status: 0,
      size: 0,
      downloaded: 0,
      percent: 0,
      url: originalUrl || url,
      redirect: url,
      queue
    }

    return new Promise((resolve, reject) => {
      const request = http.get(url, async (response) => {
        // handle non-200 http status codes
        if (response.statusCode === 301 || response.statusCode === 302) {
          info.redirect = response.headers.location
          await this.fetch(info.redirect, info.file, notify, force, info.queue, info.url)
          resolve()
        } else if (response.statusCode !== 200) {
          info.status = -1
          notify(info)
          resolve()
        } else {
          info.size = parseInt(response.headers['content-length'], 10)

          // create directory
          const destfolder = path.parse(info.file).dir
          fs.mkdirSync(destfolder, { recursive: true })

          // skip download of existing file with same size
          if (!force && fs.existsSync(file) && info.size === fs.statSync(info.file).size) {
            resolve()
            return
          }

          // write the pipe directly into file
          const output = fs.createWriteStream(file)
          response.pipe(output)

          // notify goes here
          response.on('data', function (chunk) {
            info.downloaded += chunk.length

            if (info.size > 0) {
              info.percent = (100.0 * info.downloaded / info.size).toFixed()
            }

            notify(info)
          })

          output.on('finish', () => {
            output.close()
            info.status = 1

            notify(info)
            resolve()
          })
        }
      })

      request.on('error', function (err) {
        info.status = -1

        notify(info)
        resolve(err)
      })

      notify(info)
    })
  }

  // TODO same url? same path? return existing promise
  queue (url, path, notify, force, queueName) {
    // initialize empty process list by name
    if (!this.processes[queueName]) {
      this.processes[queueName] = { count: 0, tasks: [] }
    }

    const process = this.processes[queueName]

    // detect duplicate entries in queue
    const duplicate = process.tasks.find((task) => {
      return task.url === url && task.path === path && task.force === force
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
