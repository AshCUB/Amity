import Archive from 'epubjs/src/archive'

// Kobo/Calibre epubs often contain `<script src="..."/>` in `.html` files. epub.js parses
// those as text/html, where a self-closing script never ends and swallows the whole body.
const handleResponse = Archive.prototype.handleResponse
Archive.prototype.handleResponse = function (response: unknown, type: string) {
  if ((type === 'html' || type === 'htm') && typeof response === 'string') {
    response = response.replace(/<script\b[^>]*\/>/gi, '')
  }
  return handleResponse.call(this, response, type)
}
