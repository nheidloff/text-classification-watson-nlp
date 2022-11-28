const path = require('path');
const rsstohtml = require('./rss-to-html.js')();
const htmltotext = require('./html-to-text.js')();
const watsonnlp = require('./watson-nlp.js')();
const readhtml = require('./read-html.js')();

  (async () => {
    const watsonNLPIPAndPort = 'http://localhost:8080'
    const watsonNLPEndpointClassification = watsonNLPIPAndPort + '/v1/watson.runtime.nlp.v1/NlpService/ClassificationPredict'
    const watsonNLPEndpointSyntax = watsonNLPIPAndPort + '/v1/watson.runtime.nlp.v1/NlpService/SyntaxPredict'
    const watsonNLPModelSyntax = 'syntax_izumo_lang_en_stock'

    let dataDirectory = process.argv[3]
    if (typeof dataDirectory == 'undefined') {
      dataDirectory = '../data/announcement/'
    }
    const dataInputDirectory = dataDirectory + 'input/testing/'
    const dataInputDirectoryPath = path.join(__dirname, dataInputDirectory);

    let fileName = process.argv[4]
    if (typeof fileName == 'undefined') fileName = '00000000.xml'
    let filePathAndName = dataInputDirectoryPath + fileName
    let rssXML = require('fs').readFileSync(filePathAndName, 'utf8')

    let watsonNLPModelClassification = process.argv[5]
    if (typeof watsonNLPModelClassification == 'undefined') watsonNLPModelClassification = 'ensemble_model'
   
    let type = process.argv[2]
    let classPositive = 'CashDividend'
    let classNegative = 'NotCashDividend'
    if (type == 'heidloffblog') {                    
      classPositive = 'WatsonEmbed'
      classNegative = 'NotWatsonEmbed'
    }
    
    // 1. RSS XML to HTML
    let html = rsstohtml.convert(rssXML, type, readhtml.toString)

    // 2. HTML to text
    let text = htmltotext.convert(html)

    // 3. Text to sentences
    let sentences = []
    await watsonnlp.predict(text, watsonNLPEndpointSyntax, watsonNLPModelSyntax)
      .then(function (response) {
        let sentencesInfo = response.data.sentences
        for (count = 0; count < sentencesInfo.length; count++) {
          let sentenceInfo = sentencesInfo[count]
          sentences.push(sentenceInfo.span.text)
        }
      })
      .catch(function (error) {
        console.error('Error accessing Watson NLP:')
        console.log(error)
      });

    // Invoke Watson classification
    let isPositive = false
    let confidenceLevelMinimum = 0.8
    let sentenceWithHighestConfidence = {
      sentence: '',
      classes: [
        { className: classPositive,
          confidence: 0.0
        },
        { classNegative: classNegative,
          confidence: 0.0
        }
      ]
    }
    let highestConfidence = 0.0
    for (i = 0; i < sentences.length; i++) {
      await watsonnlp.predict(sentences[i], watsonNLPEndpointClassification, watsonNLPModelClassification)
        .then(function (response) {
          let amountCategories = 2;
          for (a = 0; a < amountCategories; a++) {
            if (response.data.classes[a].className == classPositive) {
              if (highestConfidence < response.data.classes[a].confidence) {
                sentenceWithHighestConfidence = {
                  sentence: sentences[i],
                  classes: response.data.classes[a]
                }
                highestConfidence = response.data.classes[a].confidence
              }
              if (response.data.classes[a].confidence > confidenceLevelMinimum) {
                isPositive = true
              }
            }
          }
        })
        .catch(function (error) {
          console.error('Error accessing Watson NLP:')
          console.log(error)
        });  
    }
    if (isPositive == true) {
      console.log('Article IS about ' + classPositive + ' since the confidence level of one sentence is above ' + confidenceLevelMinimum)
    } 
    else {
      console.log('Article IS NOT about ' + classPositive + ' since the confidence level of no sentence is above ' + confidenceLevelMinimum)
    }
    if (highestConfidence > 0.0) {
      console.log('The sentence with the highest confidence is:')
      console.log(sentenceWithHighestConfidence.sentence)
      console.log(sentenceWithHighestConfidence.classes)
    }
  })()