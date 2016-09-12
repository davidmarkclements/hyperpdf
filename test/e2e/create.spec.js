const pdf = require('../../')
const fs = require('fs')
const test = require('tape')


test('shorthand creating a buffer', (t) => {
  pdf.create('<h1>hyperpdf</h1>', (err, result) => {
    if (err) {
      throw err
    }

    fs.readFile('test/fixtures/simpleHeading.pdf', (err, buf) => {
      if (err) {
        throw err
      }
      t.equal(result.length, buf.length)
      t.end()
    })
  })
})
