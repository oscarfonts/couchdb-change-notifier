const events = require('events')
const request = require('request')

const CouchdbChangeNotifier = function({db, user, password}) {
  const eventEmitter = new events.EventEmitter()
  let last_seq = 0

  const pollForChanges = () => {
    request.get(db + '_changes/', {
      auth: {
        user: user,
        pass: password
        // bearer: token
      }
    }, (error, response, body) => {
      const message = JSON.parse(body)
      message.results.map((result) => eventEmitter.emit('change', result))
      last_seq = message.last_seq
    }).on('error', (err) => {
      console.log(err)
    })
  }

  pollForChanges()

  return eventEmitter
}

module.exports = CouchdbChangeNotifier
