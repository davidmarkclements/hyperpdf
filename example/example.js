const pdf = require('../')
const fs = require('fs')
const path = require('path')

pdf.create('<h1>hyperpdf</h1>').toFile('example/hyper_1.pdf', () => {

})

pdf.create('<h1>hyperpdf</h1>').toBuffer((buf) => {
  console.log(buf.length)
})

pdf.create('<h1>hyperpdf</h1>').toStream((stream) => {
  stream.pipe(fs.createWriteStream('./example/foo_1.pdf'))
})


const pathToFile = path.resolve(path.parse(__filename).dir, './card.html')

pdf.create(pathToFile).toFile('example/hyper_2.pdf', () => {

})

pdf.create(pathToFile).toBuffer((buf) => {
  console.log(buf.length)
})

pdf.create(pathToFile).toStream((stream) => {
  stream.pipe(fs.createWriteStream('./example/foo_2.pdf'))
})

pdf.create('<h1>hyperpdf</h1>', { pageSize: 'Legal', landscape: true }).toFile('example/hyper_1.pdf', () => {

})

pdf.create('<h1>hyperpdf</h1>', { pageSize: { height: 210, width: 110 }, landscape: true }).toFile('example/hyper_1.pdf', () => {

})
