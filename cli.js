#!/usr/bin/env node

var fs = require('fs')
var pkg = require('./package.json')
var path = require('path')
var spawn = require('child_process').spawn
var electronPath = require('electron-prebuilt')

var argv = require('minimist')(process.argv.slice(2))
var args = process.argv.slice(2)

var input = argv._[0] || argv.i || argv.input
var output = argv._[1] || argv.o || argv.output

args.unshift(path.resolve(path.join(__dirname, './index.js')))
var electron = spawn(electronPath, args, {
  stdio: ['inherit', 'inherit', 'pipe', 'ipc']
})
electron.stderr.on('data', function (data) {
  var str = data.toString('utf8')
  // it's Chromium, STFU
  if (str.match(/^\[\d+\:\d+/)) return
  process.stderr.write(data)
})

if (argv.v || argv.version) {
  console.log('v' + pkg.version)
  process.exit(0)
}

if (argv.h || argv.help) {
  usage(1)
} else if (!input || !output) {
  usage(1)
}

function usage (code) {
  var rs = fs.createReadStream(path.join(__dirname, '/usage.txt'))
  rs.pipe(process.stdout)
  rs.on('close', function () {
    if (code) process.exit(code)
  })
}
