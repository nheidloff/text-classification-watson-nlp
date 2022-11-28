const xmljs = require('xml-js')
const fs = require('fs')
const path = require('path');

const dataInputDirectory = '../data/heidloffblog/input/feed-pages/'
const dataInputDirectoryPath = path.join(__dirname, dataInputDirectory);
const dataOutputDirectory = '../data/heidloffblog/input/training/'

fs.rmSync(dataOutputDirectory, { recursive: true, force: true });
fs.mkdirSync(dataOutputDirectory)

for (p = 1; p < 9; p++) {
  for (e = 0; e < 10; e++) {
    let fileName = 'page' + p + '.xml'
    let filePathAndName = dataInputDirectoryPath + fileName
    let rssXML = require('fs').readFileSync(filePathAndName, 'utf8')

    try {
      let result = xmljs.xml2json(rssXML)
      let resultJson = JSON.parse(result)
      saveElement(resultJson, p, e)
    }
    catch (error) {
      console.error(error)
    }
  }
}

function saveElement(json, page, number) {
  let elemNumber = number + 10
  let item = json.elements[0].elements[0].elements[elemNumber]
  let title = item.elements[0].elements[0].text
  console.log(title)
  json.elements[0].elements[0].elements.length = json.elements[0].elements[0].elements.length - 9
  json.elements[0].elements[0].elements[10] = item
  let xml = xmljs.json2xml(json, { compact: false, spaces: 0 });
  outputPathAndFileName = dataOutputDirectory + 'page' + page + '-elem' + number + '.xml'
  fs.writeFile(outputPathAndFileName, xml, err => {
    if (err) {
      console.error('Unable to write file ' + outputPathAndFileName + ': ' + err)
    }
  })
}