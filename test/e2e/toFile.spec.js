const pdf = require('../../')
const fs = require('fs')
const test = require('tape')


test('write simple pdf with a heading to a file', (t) => {
  pdf.create('<h1>hyperpdf</h1>').toFile('test/simpleHeading.pdf', (err) => {
    if (err) {
      throw err
    }

    fs.readFile('test/fixtures/simpleHeading.pdf', (err, buf) => {
      if (err) {
        throw err
      }

      fs.readFile('test/simpleHeading.pdf', (err, result) => {
        if (err) {
          throw err
        }

        t.equal(result.length, buf.length)
        t.end()
      })
    })
  })
})
