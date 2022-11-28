const axios = require('axios');

module.exports = function () {
  return {
    "predict": async function (text, endpoint, model) {
    let payload = {
      'rawDocument': {
        'text': text
      }
    }
    const restConfig = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'grpc-metadata-mm-model-id': model
      }
    }
    return await axios.post(endpoint, payload, restConfig);
    }
  }
}