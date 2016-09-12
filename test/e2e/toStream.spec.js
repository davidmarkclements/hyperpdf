const pdf = require('../../')
const fs = require('fs')
const test = require('tape')


test('stream pdf into file', (t) => {
  pdf._initEnvironment((err) => {
    if (err) {
      throw err
    }
    pdf.create('<h1>hyperpdf</h1>').toStream((stream) => {
      stream
        .pipe(fs.createWriteStream('test/simpleHeading_stream.pdf'))
        .on('err', (err) => { throw err })
        .on('close', () => {
          fs.readFile('test/simpleHeading_stream.pdf', (err, result) => {
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
    })
  })
})
