# hyperpdf

Convert Markdown or HTML into PDF's

[![js-standard-style][standard-image]][standard-url]

## Why hyperpdf is special

There's plenty of modules converting Markdown or HTML into PDF's, but
they tend to require external dependencies like `pandoc`. This module
uses electron so it's self contained and good to go.

## Install


```
npm install hyperpdf -g
```

For gnu/linux installations without a graphical environment:

```bash
$ sudo apt-get install xvfb # or equivalent
$ export DISPLAY=':99.0'
$ Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
$ hyperpdf ...
```

## Usage

### To generate a PDF from a Markdown file

```
$ hyperpdf index.md index.pdf
```

### To generate a PDF from a HTML file

```
$ hyperpdf index.html index.pdf
```

### To generate a PDF from a Markdown file with custom CSS
#### defaults to Github markdown style

```
$ hyperpdf index.html index.pdf -c my-awesome-css.css
```

### To generate a PDF from a URL

```
$ hyperpdf http://davidmarkclements.com dmc.pdf
```

### More

```

  A command line tool to generate PDF from URL, HTML or Markdown files

  Options
    --help                     Show this help
    --version                  Current version of package
    -i | --input               String - The path to the HTML file or url
    -o | --output              String - The path of the output PDF
    -c | --css                 String - The path to custom CSS
    -p | --printBackground     Boolean - Whether to print CSS backgrounds.
                                 default - true
    -s | --printSelectionOnly  Boolean - Whether to print selection only
                                 default - false
    -l | --landscape           Boolean - true for landscape, false for portrait.
                                 default - false
    -m | --marginType          Integer - Specify the type of margins to use
                                 0 - default
                                 1 - none
                                 2 - minimum
    -d | --disableCache        Disable HTTP caching

  Usage
    $ hyperpdf <input> <output>
    $ hyperpdf <input> <output> -l

  Examples
    $ hyperpdf http://davidmarkclements.com dmc.pdf
    $ hyperpdf ./index.html index.pdf
    $ hyperpdf ./README.md README.pdf -l
    $ hyperpdf ./README.md README.pdf -l -c my-awesome-css.css

```

## API


## Credits

Original code base is by Fraser Xu https://github.com/fraserxu/electron-pdf.
At the time of writing there's over ten sitting PR's, so we created a new module
because we needed some different behaviour quickly. If the electron-pdf project
has come back to life, it's better to feed into the original. However, if there's
still no activity in about 3 months we'll start taking PR's etc. here.


## Sponsorship

* sponsored by [nearForm](http://nearform.com)


## License

MIT


[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square

[standard-url]: https://github.com/feross/standard
