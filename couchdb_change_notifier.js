const events = require('events')
const request = require('request')

const CouchdbChangeNotifier = function (db, {since = 0, interval = 10, user, password, bearer}) {
  const event = new events.EventEmitter()
  let lastSeq = since

  const requestConfig = {
    baseUrl: db,
    url: '_changes',
    qs: {
      since: lastSeq,
      include_docs: true,
      attachments: true
    },
    json: true
  }

  if ((user && password) || bearer) {
    requestConfig.auth = {user, password, bearer}
  }

  const noDesignDocumentsFilter = (item) => !item.id.startsWith('_design/')

  const pollForChanges = () => {
    request.get(requestConfig, (error, response, body) => {
      if (error) {
        onError(error)
      } else {
        body.results.filter(noDesignDocumentsFilter).map((item) => item.deleted ? onDelete(item) : onChange(item))
        lastSeq = body.last_seq
        onPoll(lastSeq)
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

    if (attachments) {
      const arr = Object.keys(attachments).map(key => attachments[key])
      doc.attachments = arr.map((attachment) => ({
        content_type: attachment.content_type,
        data: attachment.data ? Buffer.from(attachment.data, 'base64') : undefined
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
