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

function appReady () {
  var customCss = argv.c || argv.css

  function isMarkdown (input) {
    var ext = path.extname(input)
    return ext.indexOf('md') > 0 || ext.indexOf('markdown') > 0
  }

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
      render(indexUrl, output, function (err) {
        if (err) { console.error(err) }
        fs.unlinkSync(tmpHTMLPath)
        app.quit()
      })
    })
  } else {
    var indexUrl = wargs.urlWithArgs(input, {})
    render(indexUrl, output, function (err) {
      if (err) { console.error(err) }
      app.quit()
    })
  }
}

/**
 * render file to pdf
 * @param  {String} indexUrl The path to the HTML or url
 */
function render (indexUrl, output, cb) {
  var win = new BrowserWindow({ width: 0, height: 0, show: false })
  win.on('closed', function () { win = null })

  var loadOpts = {}
  if (argv.d || argv.disableCache) {
    loadOpts.extraHeaders = 'pragma: no-cache\n'
  }

  win.loadURL(indexUrl, loadOpts)

  // print to pdf args
  var opts = {
    marginType: argv.m || argv.marginType || 0,
    printBackground: argv.p || argv.printBackground || true,
    printSelectionOnly: argv.s || argv.printSelectionOnly || false,
    landscape: argv.l || argv.landscape || false
  }

  win.webContents.on('did-finish-load', function () {
    win.webContents.printToPDF(opts, function (err, data) {
      if (err) {
        return cb(err)
      }

      fs.writeFile(path.resolve(output), data, cb)
    })
  })
}
