const pdf = require('../../')
const fs = require('fs')
const test = require('tape')
const exec = require('child_process').exec


test('write simple pdf with a heading to a file', (t) => {
  exec('./bin/hyperpdf test/fixtures/simpleHeading.html test/hyper.pdf', (err, stdout, stderr) => {
    if (err) {
      throw err
    }

    console.log(`\nstdout: ${stdout}`)
    console.log(`stderr: ${stderr}`)

    fs.readFile('test/fixtures/simpleHeading.pdf', (err, buf) => {
      if (err) {
        throw err
      }

      fs.readFile('test/hyper.pdf', (err, result) => {
        if (err) {
          throw err
        }

        t.equal(result.length, buf.length)
        t.end()
      })
    })
  })
})
