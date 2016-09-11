'use strict'
const electronPath = require('electron')
const spawn = require('child_process').spawn
const path = require('path')
const fs = require('fs')

function isFile (string, cb) {
  fs.stat(string, function (err, stat) {
    if (err) {
      return cb(false)
    } else if (err && err.code === 'ENOENT') {
      return cb(false)
    }

    return cb(true)
  })
}

function execWithMode (filename, html, mode, options, cb) {
  let hasCalled = false
  let res = []

  isFile(html, function (result) {
    const args = [
      path.resolve(path.parse(__filename).dir, './runner.js'),
      // NOTE: branching for HTML code or file
      // will be done in runner.js again
      result === false ? html : path.resolve(process.cwd(), html), // input
      filename ? path.resolve(process.cwd(), filename) : null, // output; null for buffer
      options ? `--options=${JSON.stringify(options)}` : '', // output; null for buffer
      mode
    ]

    const electron = spawn(electronPath, args, {
      stdio: ['inherit', 'pipe', 'pipe', 'ipc']
    })

    // handle error cases by writing them to stderr. Exit below.
    electron.stderr.on('data', function (data) {
      var str = data.toString('utf8')
      // it's Chromium, STFU
      if (str.match(/^\[\d+:\d+/)) return

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

const defaultOptions = {

}

/**
 * This class handles exclusively the API for PDF generation, to allow for
 * a similar experience then predecessors / competitors.
 * @constructor
 * @param {String}   html    Expects a string of HTML or a path to a file of HTML
 * @param {Object}   options Object of options.
 * @param {Function} cb      A callback can be provided in the transform-less case of pdf.create(cb). Equivalent of pdf.create(file).toBuffer(cb)
 */
function PDF (html, options, cb) {
  this.html = html
  // just a convenience wrapper
  // to match competitor APIs
  if (options && typeof options === 'function') {
    cb = options
  }

  this.options = Object.assign(defaultOptions, options)

  if (cb && typeof cb === 'function') {
    return this.toBuffer(cb)
  }
}

/**
 * Pass HTMl as string or a path to HTML to pdf.create(html) and transform
 * the result with this function to a file directly.
 *
 * Under the hood electron will write the directly to the specified location.
 * @param  {String}   outputFilename path to the resulting file
 * @param  {Function} cb
 * @return {Callback}                with no parameters
 */
PDF.prototype.toFile = function (outputFilename, cb) {
  execWithMode(outputFilename, this.html, '--file', this.options, cb)
}

/**
 * Pass HTMl as string or a path to HTML to pdf.create(html) and transform
 * the result with this function to a buffer.
 *
 * Under the hood electron will create a buffer, which will be written to file in
 * your systems `tmp` diretory, the path will be sent to the parent process,
 * which will read the file, returning the buffer and unlink (maybe delete) the
 * file in `tmp` dir.
 *
 * NOTE: The system will be strained by this approach, but due to limitations in
 * the process communication with electron, this cannot be avoided. This
 * workkaround is due for refactoring, asap.
 * @param  {Function} cb [description]
 * @return {Callback}      Callback with (error, buffer)
 */
PDF.prototype.toBuffer = function (cb) {
  execWithMode(null, this.html, '--buffer', this.options, (data) => {
    fs.readFile(data.location, (err, buf) => {
      if (err) {
        return cb(err)
      }

      fs.unlink(data.location, (err) => {
        if (err) {
          return cb(err)
        }
        return cb(null, buf)
      })
    })
  })
}

/**
 * Pass HTMl as string or a path to HTML to pdf.create(html) and transform
 * the result with this function to a stream.
 *
 * Under the hood electron will create a buffer, which will be written to file in
 * your systems `tmp` diretory, the path will be sent to the parent process,
 * which will read the file as stream and return this stream. Also .on('end'), the
 * file will be unlinked.
 *
 * NOTE: The system will be strained by this approach, but due to limitations in
 * the process communication with electron, this cannot be avoided. This
 * workaround is due for refactoring, asap.
 * @param  {Function} cb [description]
 * @return {[type]}      [description]
 */
PDF.prototype.toStream = function (cb) {
  execWithMode(null, this.html, '--stream', this.options, (data) => {
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

function initEnvironment (screensize, cb) {
  // hadnle default case for just specifying a callback
  if (typeof screensize === 'function') {
    cb = screensize
    screensize = '1280x2000x24'
  }

  const ini = spawn('bash', [path.resolve(path.parse(__filename).dir, './init_environment.sh')])
  ini.on('error', (err) => {
    return cb(err)
  })

  ini.on('close', (code) => {
    return cb(null)
  })
}

// this is for exposing the pdf.create()[.(toBuffer|toStream|toFile)] API.
module.exports = {
  create: function (html, options, cb) {
    return new PDF(html, options, cb)
  },

  _initEnvironment: function (screensize, cb) {
    initEnvironment(screensize, cb)
  }
}
