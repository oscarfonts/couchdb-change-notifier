const events = require('events')

const CouchdbChangeNotifier = function({db, user, password}) {
  const eventEmitter = new events.EventEmitter()

  setInterval(() => eventEmitter.emit('change', 'I am a new document'), 1000)

  return eventEmitter
}

module.exports = CouchdbChangeNotifier
