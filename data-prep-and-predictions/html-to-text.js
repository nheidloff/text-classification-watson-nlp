const { convert } = require('html-to-text');

module.exports = function () {
    return {
        "convert": function (html) {
            let text = ''
            try {
                text = convert(html, {
                    preserveNewlines: false,
                    wordwrap: false
                  })
            }
            catch(error) {
                err = error
                console.error('Unable to convert HTML into text: ' + err)
            }
            return text
        }
    }
}