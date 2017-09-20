#!/usr/bin/env node
require('dotenv-safe').load()

const CouchdbChangeNotifier = require('./couchdb_change_notifier')

const notifier = new CouchdbChangeNotifier({
  db: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
})

const listener = (document) => console.log(document)

notifier.on('change', listener)
