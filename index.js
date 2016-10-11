const proxy = require('express-http-proxy')
const express = require('express')
const app = express()
const url = require('url')
const path = require('path')
 
app.use('/geoserver/wms', proxy('http://localhost:8080/geoserver/wms', {
  forwardPath: (req, res) => {
    return url.parse(req.originalUrl).path
  }
}))

app.use('/static', express.static('static'))

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '/views/index.html'))
})

app.listen(3000, function () {
  console.log('app listening on port 3000!');
})