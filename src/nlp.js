const { NlpManager } = require('node-nlp');

const manager = new NlpManager({ languages: ['en'] });

function loadModel (...args) {
    return manager.load(...args)
}

function processMessage (...args) {
    return manager.process(...args);
}

module.exports.loadModel = loadModel;

module.exports.processMessage = processMessage;

module.exports.manager = manager;
