const TYPE_HEIDLOFF_BLOG = 'heidloffblog'
const TYPE_ANNOUNCEMENT = 'announcement'

module.exports = function () {
    return {
        "toString": function (json, type) {
            let output = ''
            try {
                if (type == TYPE_HEIDLOFF_BLOG) {                    
                    output = json.elements[0].elements[0].elements[10].elements[0].elements[0].text + 
                        '. ' + 
                        json.elements[0].elements[0].elements[10].elements[7].elements[0].cdata
                }
                if ((type == TYPE_ANNOUNCEMENT) || (typeof type == 'undefined')) {
                    output = json.elements[1].elements[0].elements[5].elements[0].cdata
                }
            }
            catch(error) {
                err = error
                console.error('Unable to read HTML from JSON: ' + err)
            }
            return output
        }
    }
}
