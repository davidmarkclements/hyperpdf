'use strict'
const electronPath = require('electron-prebuilt')
const spawn = require('child_process').spawn
const path = require('path')

function PDF (html, options, cb) {
  this.html = html
  this.options = Object.assign({}, options)
  // just a convenience wrapper
  // to match competitor APIs
  if (cb && typeof cb === 'function') {
    return this.toBuffer(cb)
  }
}

PDF.prototype.toFile = function (filename, cb) {
  let hasCalled = false

  const args = [
    './runner.js',
    // NOTE: branching for HTML code or file
    // will be done in runner.js
    path.resolve(__dirname, this.html), // input
    path.resolve(__dirname, filename)   // output
  ]

  var electron = spawn(electronPath, args, {
    stdio: ['inherit', 'inherit', 'pipe', 'ipc']
  })

  electron.stderr.on('data', function (data) {
    var str = data.toString('utf8')
    // it's Chromium, STFU
    if (str.match(/^\[\d+\:\d+/)) return
    process.stderr.write(data)
  })

  electron.on('error', function () {
    if (!hasCalled) {
      hasCalled = true
      return cb()
    }
  })

  electron.on('exit', function (data) {
    if (!hasCalled) {
      hasCalled = true
      return cb()
    }
  })
}

PDF.prototype.toBuffer = function () {

}

PDF.prototype.toStream = function () {

}

module.exports = {
  create: function (html, options, cb) {
    return new PDF(html, options, cb)
  }
};
