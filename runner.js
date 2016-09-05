var electron = require('electron')
var app = electron.app
app.dock.hide()

var argv = require('minimist')(process.argv.slice(2))
var fs = require('fs')
var path = require('path')
var BrowserWindow = electron.BrowserWindow

var wargs = require('./lib/args')
var markdownToHTMLPath = require('./lib/markdown')

var input = argv._[0] || argv.i || argv.input
var output = argv._[1] || argv.o || argv.output

app.on('ready', appReady)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

function isMarkdown (input) {
  var ext = path.extname(input)
  return ext.indexOf('md') > 0 || ext.indexOf('markdown') > 0
}

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

function pdfOutPutType(args) {
  let res
  const search = [
    '--buffer',
    '--stream',
    '--file',
  ]

  args.forEach(function (el) {
    search.forEach(function (type) {
      if (el.indexOf(type) >= 0) {
        res = type
      }
    })
  })

  return res.substring(2)
}

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

    const opts = {}
    opts.mode = pdfOutPutType(process.argv)

    return render(indexUrl, output, opts, function (err) {
      if (err) console.error(err)

      app.quit()
    })
  })
}

/**
 * render file to pdf
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
    printBackground: argv.p || argv.printBackground || true,
    printSelectionOnly: argv.s || argv.printSelectionOnly || false,
    landscape: argv.l || argv.landscape || false
  }

  win.webContents.on('did-finish-load', function () {
    win.webContents.printToPDF(opts, function (err, data) {
      if (err) {
        return cb(err)
      }

      if (options.mode === 'buffer') {
        // sending on next tick is necessary to prevent electron
        // crashing on malloc
        process.nextTick(function () {
          // generate .stdout.on('data') with nicer control flow
          fs.write(1, data.toString(), function () {
            return cb(null)
          })
        })
      }

      if (options.mode === 'stream') {
        process.nextTick(function () {
          return cb(null)
        })
      }
      // fallthrough will provide a file
      fs.writeFile(path.resolve(output), data, cb)
    })
  })
}
