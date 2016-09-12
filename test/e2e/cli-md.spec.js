const pdf = require('../../')
const fs = require('fs')
const test = require('tape')
const exec = require('child_process').exec


test('CLI: simple .md to .pdf', (t) => {
  pdf._initEnvironment((err) => {
    if (err) {
      throw err
    }

    exec('./bin/hyperpdf test/fixtures/simpleHeading.md test/hyper_md.pdf', (err, stdout, stderr) => {
      if (err) {
        throw err
      }

      if (stdout) {
        console.log(`\nstdout: ${stdout}`)
      }

      if (stderr) {
        console.log(`stderr: ${stderr}`)
      }

      fs.readFile('test/fixtures/simpleHeading_md.pdf', (err, buf) => {
        if (err) {
          throw err
        }

        fs.readFile('test/hyper_md.pdf', (err, result) => {
          if (err) {
            throw err
          }

          t.equal(result.length, buf.length)
          t.end()
        })
      })
    })
  })
})
