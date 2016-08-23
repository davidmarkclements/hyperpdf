function PDF (html, options, cb) {
  this.html = html
  this.options = Object.assign({}, options)
  // just a convenience wrapper
  // to match competitor APIs
  if (cb && typeof cb === 'function') {
    return this.toBuffer(cb)
  }
}

PDF.prototype.toFile = function () {

}

PDF.prototype.toBuffer = function () {

}

PDF.prototype.toStream = function () {

}

module.exports = {
  create: function (html, options, cb) {
    return new PDF(html, options, cb)
  }
};
