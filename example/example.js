const pdf = require('../')
const fs = require('fs')

pdf.create('<h1>hyperpdf</h1>').toFile('example/hyper.pdf', () => {

})

pdf.create('<h1>hyperpdf</h1>').toBuffer((buf) => {
  console.log(buf.length)
})

pdf.create('<h1>hyperpdf</h1>').toStream((stream) => {
  stream.pipe(fs.createWriteStream('./foo.pdf'))
})
