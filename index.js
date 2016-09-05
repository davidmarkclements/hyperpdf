'use strict'
const electronPath = require('electron')
const spawn = require('child_process').spawn
const path = require('path')
const fs = require('fs')

function isFile (string, cb) {
  fs.stat(string, function (err, stat) {
    if (err) {
      return cb(false)
    } else if (err && err.code == 'ENOENT') {
      return cb(false)
    }

    return cb(true)
  })
}

function execWithMode (filename, html, mode, cb) {
  let hasCalled = false
  let res = []

  isFile(html, function (result) {
    const args = [
      './runner.js',
      // NOTE: branching for HTML code or file
      // will be done in runner.js again
      result === false ? html : path.resolve(__dirname, html), // input
      filename ? path.resolve(__dirname, filename) : null, // output; null for buffer
      mode
    ]

    const electron = spawn(electronPath, args, {
      stdio: ['inherit', 'pipe', 'pipe', 'ipc']
    })

    // handle error cases by writing them to stderr. Exit below.
    electron.stderr.on('data', function (data) {
      var str = data.toString('utf8')
      // it's Chromium, STFU
      if (str.match(/^\[\d+\:\d+/))
        return

      process.stderr.write(data)
    })
    // if buffer has been sent...
    electron.stdout.on('data', function (data) {
      res.push(data)
    })
    // if has errored...
    electron.on('error', function () {
      if (!hasCalled) {
        hasCalled = true
        return cb()
      }
    })
    // if has messages... this will be used in the .toBuffer-case, for
    // metadata transport
    electron.on('message', function (msg) {
      if (!hasCalled) {
        hasCalled = true
        return cb(msg)
      }
    })
    // if file is generated...
    electron.on('exit', function (data) {
      if (!hasCalled) {
        hasCalled = true
        return cb()
      }
    })
  })
}

function PDF (html, options, cb) {
  this.html = html
  this.options = Object.assign({}, options)
  // just a convenience wrapper
  // to match competitor APIs
  if (cb && typeof cb === 'function') {
    return this.toBuffer(cb)
  }
}

PDF.prototype.toFile = function (outputFilename, cb) {
  execWithMode(outputFilename, this.html, '--file', cb)
}

PDF.prototype.toBuffer = function (cb) {
  execWithMode(null, this.html, '--buffer', (data) => {
    fs.readFile(data.location, (err, buf) => {
      if (err) {
        return cb(err)
      }

      fs.unlink(data.location, (err) => {
        if (err) {
          return cb(err)
        }
        return cb(buf)
      })
    })
  })
}

PDF.prototype.toStream = function (cb) {
  execWithMode(null, this.html, '--stream', (data) => {
    fs.readFile(data.location, (err, buf) => {
      if (err) {
        return cb(err)
      }

      const stream = fs.createReadStream(data.location)
      // take care of some garbage, but don't care if it works :)
      stream.on('end', () => {
        fs.unlink(data.location, () => {})
      })

      return cb(stream, data.location)
    })
  })
}

module.exports = {
  create: function (html, options, cb) {
    return new PDF(html, options, cb)
  }
};
