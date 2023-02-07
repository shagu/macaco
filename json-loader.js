const fs = require('fs')
const zlib = require('zlib')

const { parentPort } = require('worker_threads')

parentPort.on('message', (config) => {
  let response = {}

  let rawdata = fs.readFileSync(config.data_file)
  rawdata = zlib.gunzipSync(rawdata)
  response.data = JSON.parse(rawdata)

  let rawlocales = fs.readFileSync(config.locales_file)
  rawlocales = zlib.gunzipSync(rawlocales)
  response.locales = JSON.parse(rawlocales)

  parentPort.postMessage(response)
  process.exit(0)
})