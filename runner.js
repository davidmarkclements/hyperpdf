'use strict'
const electron = require('electron')
const app = electron.app

if (process.platform === 'darwin') {
  app.dock.hide()
}

const argv = require('minimist')(process.argv.slice(2))
const fs = require('fs')
const os = require('os')
const crypto = require('crypto')
const path = require('path')
const BrowserWindow = electron.BrowserWindow

const wargs = require('./lib/args')
const markdownToHTMLPath = require('./lib/markdown')

var input = argv._[0] || argv.i || argv.input
var output = argv._[1] || argv.o || argv.output

// entry point; handled below
app.on('ready', appReady)
// electron quirk
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

function isMarkdown (input) {
  var ext = path.extname(input)
  return ext.indexOf('md') > 0 || ext.indexOf('markdown') > 0
}

// handle case of plain strings or strings that
// actually are filenames
function isFile (string, cb) {
  // linux fs.stat might throw, REVIEW
  if (!string) {
    string = ''
  }

  fs.stat(string, function (err, stat) {
    if (err) {
      return cb(false)
    } else if (err && err.code === 'ENOENT') {
      return cb(false)
    }
    return cb(true)
  })
}

function mmToMicron (input) {
  return Math.ceil(input * 1000)
}

// a helper function to allow for dash-dash style cli
// options, to avoid strange cli parsing issues.
// Will pass down the value as option.mode.
// TODO: refactor; currently a crook
function parseCliOpts (args) {
  let opts = {}
  // mode parsing
  const search = [
    '--buffer',
    '--stream',
    '--file'
  ]

  args.forEach(function (el) {
    search.forEach(function (type) {
      if (el.indexOf(type) >= 0) {
        opts.mode = type.substring(2)
      }
    })
  })

  args.forEach(function (el) {
    if (el.indexOf('--options=') >= 0) {
      // TODO: do some sanitization / error checking here
      Object.assign(opts, JSON.parse(el.substring('--options='.length)))
    }
  })
  // REVIEW: potential bug surface area, let alone for chromium(?) having
  // some kind of min-size
  if (opts.pageSize && typeof opts.pageSize === 'object') {
    opts.pageSize.height = mmToMicron(opts.pageSize.height)
    opts.pageSize.width = mmToMicron(opts.pageSize.width)
  }

  return opts
}

// this is the main entry point to
// the electron process
function appReady () {
  var customCss = argv.c || argv.css

  if (isMarkdown(input)) {
    var opts = {}

    if (customCss) {
      opts.customCss = customCss
    }
    // if given a markdown, render it into HTML and return the path of the HTML
    input = markdownToHTMLPath(input, opts, function (err, tmpHTMLPath) {
      if (err) {
        console.error('Parse markdown file error', err)
        app.quit()
      }

      var indexUrl = wargs.urlWithArgs(tmpHTMLPath, {})
      return render(indexUrl, output, null, function (err) {
        if (err) { console.error(err) }
        fs.unlinkSync(tmpHTMLPath)
        app.quit()
        process.exit(0)
      })
    })
  }
  // check for type of file:
  //  if is string convert string to data uri,
  //  otherwise assume string is a path to a file
  //  TODO: integrate markdown check in branching here
  isFile(input, function (result) {
    let indexUrl
    if (result === true) {
      indexUrl = wargs.urlWithArgs(input, {})
    } else {
      indexUrl = 'data:text/html,' + input
    }

    const opts = parseCliOpts(process.argv)

    return render(indexUrl, output, opts, function (err) {
      if (err) console.error(err)

      app.quit()
    })
  })
}

/**
 * render data to pdf
 * @param  {String} indexUrl The path to the HTML or url
 */
function render (indexUrl, output, options, cb) {
  // override because of variable naming in win.webContents
  options = Object.assign({}, options)

  var win = new BrowserWindow({ width: 0, height: 0, show: false })
  win.on('closed', function () { win = null })

  var loadOpts = {}
  if (argv.d || argv.disableCache) {
    loadOpts.extraHeaders = 'pragma: no-cache\n'
  }

  win.loadURL(indexUrl, loadOpts)

  // print to pdf args
  var opts = {
    marginsType: argv.m || argv.marginType || 1,
    pageSize: options.pageSize || 'A4', // A3, A4, A5, Legal, Letter, Tabloid; TODO: verify putting in object with dimensions
    printBackground: argv.p || argv.printBackground || true,
    printSelectionOnly: argv.s || argv.printSelectionOnly || false,
    landscape: argv.l || argv.landscape || options.landscape || false
  }

  win.webContents.on('did-finish-load', function () {
    win.webContents.printToPDF(opts, function (err, data) {
      if (err) {
        return cb(err)
      }

      if (options.mode === 'buffer') {
        // sending on next tick is necessary to prevent electron
        // crashing on malloc
        return process.nextTick(function () {
          const filename = path.resolve(os.tmpdir(), `${crypto.randomBytes(64).toString('hex')}.pdf`)

          fs.writeFile(filename, data, (err) => {
            if (err) {
              return cb(err)
            }

            process.send({ type: 'buffer', location: filename, buffer_size: data.length })
            return cb(null)
          })
        })
      }

      if (options.mode === 'stream') {
        return process.nextTick(function () {
          const filename = path.resolve(os.tmpdir(), `${crypto.randomBytes(64).toString('hex')}.pdf`)

          fs.writeFile(filename, data, (err) => {
            if (err) {
              return cb(err)
            }

            process.send({ type: 'stream', location: filename, buffer_size: data.length })
            return cb(null)
          })
        })
      }
      // fallthrough will provide a file; euqivalent to options.mode === file
      fs.writeFile(path.resolve(output), data, cb)
    })
  })
}
