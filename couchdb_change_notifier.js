const events = require('events')
const request = require('request')

const CouchdbChangeNotifier = function({db, user, password, since=0, interval=10}) {
  const event = new events.EventEmitter()
  let last_seq = since

  const noDesignDocuments = (item) => !item.id.startsWith('_design/')

  const pollForChanges = () => {
    request.get({
      baseUrl: db,
      url: '_changes',
      qs: {
        since: last_seq,
        include_docs: true,
        attachments: true
      },
      auth: {
        user: user,
        pass: password
        // bearer: token
      },
      json: true
    }, (error, response, body) => {
      if (error) {
        onError(error)
      } else {
        body.results.filter(noDesignDocuments).map((item) => item.deleted ? onDelete(item) : onChange(item))
        last_seq = body.last_seq
        onPoll(last_seq)
        // Schedule next query only after the previous one has been completely processed
        setTimeout(pollForChanges, interval * 1000)
      }
    })
  }

  const onPoll = (seq) => {
    event.emit('poll', seq)
  }

  const onError = (error) => {
    event.emit('error', error)
  }

  const onChange = (item) => {
    const attachments = item.doc._attachments
    const doc = Object.assign({}, item.doc)
    delete doc._rev
    delete doc._attachments

    if(attachments) {
      const arr = Object.keys(attachments).map(key => attachments[key])
      doc.attachments = arr.map((attachment) => ({
        content_type: attachment.content_type,
        data: attachment.data ? new Buffer(attachment.data, 'base64') : undefined
      }))
    }

    event.emit('change', doc)
  }

  const onDelete = (item) => {
    const id = item.doc._id
    event.emit('delete', id)
  }

  pollForChanges()
  return event
}

module.exports = CouchdbChangeNotifier
