const fs = require('fs')
const path = require('path');
const rsstohtml = require('./rss-to-html.js')();
const htmltotext = require('./html-to-text.js')();
const watsonnlp = require('./watson-nlp.js')();
const readhtml = require('./read-html.js')();

let dataDirectory = process.argv[3]
if (typeof dataDirectory == 'undefined') {
  dataDirectory = '../data/announcement/'
}

const dataInputDirectory = dataDirectory + 'input/training/'
const dataOutputDirectory = dataDirectory + 'output/'
const dataOutputDirectoryRSSToHTML = dataOutputDirectory + 'rssxml-to-html/'
const dataOutputDirectoryHTMLToText = dataOutputDirectory + 'html-to-text/'
const dataOutputDirectoryTextToSentenesAsText = dataOutputDirectory + 'text-to-sentences-as-text/'
const dataOutputDirectoryTextToSentenesAsCSV = dataOutputDirectory + 'text-to-sentences-as-csv/'

const watsonNLPIPAndPort = 'http://localhost:8080'
const watsonNLPEndpoint = watsonNLPIPAndPort + '/v1/watson.runtime.nlp.v1/NlpService/SyntaxPredict'
const watsonNLPModel = 'syntax_izumo_lang_en_stock'

const dataInputDirectoryPath = path.join(__dirname, dataInputDirectory);

(async () => {
  await fs.rmSync(dataOutputDirectory, { recursive: true, force: true });
  await fs.mkdirSync(dataOutputDirectory)
  await fs.mkdirSync(dataOutputDirectoryRSSToHTML)
  await fs.mkdirSync(dataOutputDirectoryHTMLToText)
  await fs.mkdirSync(dataOutputDirectoryTextToSentenesAsText)
  await fs.mkdirSync(dataOutputDirectoryTextToSentenesAsCSV)

  let resultInOneCSV = []
  resultInOneCSV.push('document_id,text')
  
  fs.readdir(dataInputDirectoryPath, async function (err, files) {
    if (err) {
      console.log('Unable to read directory: ' + err)
      return 
    } 
    for (index = 0; index < files.length; index++) {
      let file = files[index]
      if (file.endsWith('.xml')) {
        let fileNameWithoutExtension = file.substring(0, file.indexOf('.'))
        console.log('Converting ' + fileNameWithoutExtension + ' ...')

        // 1. RSS XML to HTML
        let filePathAndName = dataInputDirectory + fileNameWithoutExtension + '.xml'
        let rssXML = require('fs').readFileSync(filePathAndName, 'utf8')
      
        let type = process.argv[2]
        let html = rsstohtml.convert(rssXML, type, readhtml.toString)
        
        let outputPathAndFileName = dataOutputDirectoryRSSToHTML + fileNameWithoutExtension + '.html'
        fs.writeFile(outputPathAndFileName, html, err => {
          if (err) {
            console.error('Unable to write file ' + outputPathAndFileName + ': ' + err)
          }
        })

        // 2. HTML to text
        let text = htmltotext.convert(html)
        outputPathAndFileName = dataOutputDirectoryHTMLToText + fileNameWithoutExtension + '.txt'
        fs.writeFile(outputPathAndFileName, text, err => {
          if (err) {
            console.error('Unable to write file ' + outputPathAndFileName + ': ' + err)
          }
        })

        // 3. Text to sentences
        let allSentences = []
        await watsonnlp.predict(text, watsonNLPEndpoint, watsonNLPModel)
          .then(function (response) {
            let sentencesInfo = response.data.sentences
            let sentences = []
            for (count = 0; count < sentencesInfo.length; count++) {
              let sentenceInfo = sentencesInfo[count]
              sentences.push(sentenceInfo.span.text)
            }
            allSentences.push(sentences)

            outputPathAndFileName = dataOutputDirectoryTextToSentenesAsText + fileNameWithoutExtension + '.txt'
            fs.writeFile(outputPathAndFileName, sentences.join('\n'), err => {
              if (err) {
                console.error('Unable to write file ' + outputPathAndFileName + ': ' + err)
              }
            }) 
            
            // 4. Write CSV per document
            outputPathAndFileName = dataOutputDirectoryTextToSentenesAsCSV + fileNameWithoutExtension + '.csv'
            let csvFormat = []
            for (count = 0; count < sentences.length; count++) {
              let sentence = sentences[count].toString();        
              if (sentence.length > 1) { // assumption: only one digit per sentence is not useful
                if (!sentence.startsWith('[')) { // assumption: links (at the beginning) are not useful
                  sentenceWithoutCommas = sentence.replaceAll(',', '')
                  let oneSentence = fileNameWithoutExtension + ',' + sentenceWithoutCommas;
                  csvFormat.push(oneSentence)
                }
              }
            }
            resultInOneCSV = resultInOneCSV.concat(csvFormat);
            fs.writeFile(outputPathAndFileName, csvFormat.join('\n'), err => {
              if (err) {
                console.error('Unable to write file ' + outputPathAndFileName + ': ' + err)
              }
            })
          })
          .catch(function (error) {
            console.error('Error accessing Watson NLP:')
            console.log(error)
          });                 
      }    
    }

    // 5. Write final CSV
    let completeOutputPathAndFileName = dataOutputDirectory + 'all-sentences.csv'
    fs.writeFile(completeOutputPathAndFileName, resultInOneCSV.join('\n'), err => {
      if (err) {
        console.error('Unable to write file ' + completeOutputPathAndFileName + ': ' + err)
      }
    })
  })
})()