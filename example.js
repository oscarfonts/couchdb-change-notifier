#!/usr/bin/env node
require('dotenv-safe').load()
const fs = require('fs')

const CouchdbChangeNotifier = require('./couchdb_change_notifier')

const notifier = new CouchdbChangeNotifier({
  db: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
  // seq: N
})

notifier.on('change', (doc) => console.log("CHANGED " + doc._id))
notifier.on('delete', (id) => console.log("DELETED " + id))
notifier.on('poll', (seq) => console.log("LAST_SEQ " + seq))
notifier.on('error', (cause) => console.error(cause))

notifier.on('change', (doc) => {
  if ('attachments' in doc) {
    const extensions = {
      'image/jpeg': 'jpg',
      'image/png': 'png'
    }
    const extension = extensions[doc.attachments[0].content_type]
    const filename = doc._id + '.' + extension
    const data = doc.attachments[0].data
    console.log('  *** Writing file ' + filename + ' ***  ')
    fs.writeFileSync(filename, data)
  }
})
