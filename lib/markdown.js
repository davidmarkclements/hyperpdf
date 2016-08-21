var marked = require('marked')
var fs = require('fs')
var os = require('os')
var path = require('path')
var uuid = require('uuid')
var highlightjs = require('highlight.js')

/**
 * parse the markdown content and write it to system tmp directory
 * @param  {String} input Path of the markdown file
 * @param  {Object} options Markdown parser options
 * @return {Function}         The callback function with HTML path
 */
module.exports = function (input, options, cb) {
  if (options instanceof Function) {
    cb = options
    options = {}
  }

  var renderer = new marked.Renderer()
  renderer.heading = function (text, level) {
    var escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
   
    return '<h' + level + '><a name="' + escapedText + 
      '" class="anchor" href="#' + escapedText +
      '"><span class="header-link"></span></a>' +
      text + '</h' + level + '>'
  }

  renderer.html = function (html) {
    return html
  }

  var Lexer = marked.Lexer
  var InlineLexer = marked.InlineLexer

  var rx = Lexer.rules.html + ''
  Lexer.rules.html = 
  Lexer.rules.normal.html = 
  Lexer.rules.gfm.html = 
  Lexer.rules.tables.html = 
    /<(comment)[\s\S]+?<\/\1>(.*?)<comment(?:"[^"]*"|'[^']*'|[^'">])*?>/

  marked.setOptions({
    renderer: options.renderer || renderer,
    gfm: options.gfm || true,
    tables: options.tables || true,
    breaks: options.breaks || false,
    pedantic: options.pedantic || false,
    sanitize: options.sanitize || false,
    smartLists: options.smartLists || true,
    smartypants: options.smartypants || false,
    highlight: function (code, lang) {
      if (lang === 'js') lang = 'javascript'
      return highlightjs.highlight(lang, code, true, false).value
    }
  })

  fs.readFile(input, function (err, markdownContent) {
    if (err) {
      cb(err)
    }

    var htmlBody = marked(markdownContent.toString())
    var githubMarkdownCssPath = 'node_modules/github-markdown-css/github-markdown.css'
    var highlightjsDefaultCssPath = 'node_modules/highlight.js/styles/default.css'
    var highlightjsGithubCssPath = 'node_modules/highlight.js/styles/github.css'

    var htmlHeader = '<link rel="stylesheet" href="' + path.resolve(__dirname, '..', githubMarkdownCssPath) + '">' +
      '<link rel="stylesheet" href="' + path.resolve(__dirname, '..', highlightjsDefaultCssPath) + '">' +
      '<link rel="stylesheet" href="' + path.resolve(__dirname, '..', highlightjsGithubCssPath) + '">' +
      '<style> img {max-width: 100%} </style>' + 
      '<meta charset="utf-8">'
    // inject custom css if exist
    // todo: validate css
    if (options.customCss) {
      htmlHeader += '<link rel="stylesheet" href="' + path.resolve(options.customCss) + '">'
    }

    htmlHeader += '<style> .markdown-body { min-width: 200px; max-width: 790px; margin: 0 auto; padding: 30px; } </style>' +
      '<body><article class="markdown-body">\n'

    var htmlFooter = '\n </article></body>'

    var htmlContent = htmlHeader + htmlBody + htmlFooter

    var tmpHTMLPath = path.join(path.dirname(input), path.parse(input).name + '-' + uuid() + '.html')

    fs.writeFile(tmpHTMLPath, htmlContent, function (err) {
      if (err) {
        cb(err)
      }

      cb(null, tmpHTMLPath)
    })
  })
}
