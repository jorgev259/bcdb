const path = require('path')
const http = require('http')
const https = require('https')
const config = require('./config.js')

let options = config.options

async function startup () {
  const express = require('express')
  const app = express()

  const bodyParser = require('body-parser')
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  app.use('/', express.static(path.join(__dirname, '/public')))
  app.use('/js', express.static(path.join(__dirname, '/public/js')))
  app.use('/img', express.static(path.join(__dirname, '/public/img')))
  app.use('/style', express.static(path.join(__dirname, '/public/style')))
  app.use('/favicon.ico', express.static(path.join(__dirname, '/public/favicon.ico')))

  const httpServer = http.createServer(options, app)

  httpServer.listen(3005, () => {
    console.log('HTTP Server running on port 80')
  })

  /* httpsServer.listen(443, () => {
    console.log('HTTPS Server running on port 443')
  }) */
}

startup()
