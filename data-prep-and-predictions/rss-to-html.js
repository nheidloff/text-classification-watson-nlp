const xmljs = require('xml-js')

module.exports = function () {
    return {
        "convert": function (rssXML, typeId, readHTML) {
            let html = ''
            try {

                let result = xmljs.xml2json(rssXML)
                let resultJson = JSON.parse(result)
                html = readHTML(resultJson, typeId)
            }
            catch(error) {
                err = error
                console.error('Unable to convert RSS XML into HTML: ' + err)
            }
            return html
        }
    }
}