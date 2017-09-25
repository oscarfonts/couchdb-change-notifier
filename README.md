# couchdb-change-notifier

A node client that listens to changes in a CouchDB database.

It polls the CouchDB Change Notifications API.
See [API Reference](http://docs.couchdb.org/en/2.1.0/api/database/changes.html)
and [guide](http://guide.couchdb.org/editions/1/en/notifications.html).


## Instantiation and configuration


```js
const CouchdbChangeNotifier = require('./couchdb_change_notifier')
const notifier = new CouchdbChangeNotifier(db, config)
```

Where:

* `db` is the database url.
* `config` is a configuration option with the following properties (all optional):
    * `since`: The sequence number to start querying changes from. Defaults to zero (the beginning of time).
    * `interval`: The polling time interval in seconds. Defaults to 10.
    * `user` and `password`: CouchDB user credentials to access the database. Defaults to none.
    * `bearer`: An alternative authentication mechanism using tokens. Defaults to none.

For instance:

```js
const notifier = new CouchdbChangeNotifier('http:127.0.0.1:5984/database', {
  since: 128,        // Start polling from sequence_id 128.
  interval: 60,      // Poll every 60 seconds
  user: 'john',      // Authenticate with user 'john'
  password: 's3cr3t'
})
```

## Events emitted

The `notifier` instance is an [event emitter](https://nodejs.org/dist/latest-v6.x/docs/api/events.html#events_class_eventemitter), were you can attach listeners to the following events:

1. `change`: A new document has been created, or an existing document has been changed.
Event returns an object with the document, that has the following structure:

    ```json
    {
      "_id": "<couchdb_document_identifier>",
      "field1": "value1",

      "fieldN": "valueN",
      "_attachments": [
        {
          "content_type": "<mime_type>",
          "data": <Buffer>
        }
      ]
    }
    ```

    * The `_id` field is always present, and is the internal CouchDB identifier. Keep it to relate further change notifications to this document.
    * `field1` to `fieldN` represent the document properties.
    * Optionally, an `attachments` property is present, which contains an array of documents. Every document has:
       * A MIME `content_type`.
       * The `data`, as a Node.js [Buffer](https://nodejs.org/dist/latest-v6.x/docs/api/buffer.html#buffer_buffer)
2. `delete`: A document has been deleted. It returns the document's CouchDB identifier.
3. `poll`: Emitted after the changes API has been polled and all the changes have been notified. Returns the last SEQ number. Keep it to use it as the `since` value the next time you instantiate the `CouchdbChangeNotifier`.
4. `error`: Emitted if a network error occurs.

Event listener examples:

```js
notifier.on('change', (doc)      => console.log('Created or changed document with id' + doc._id))
notifier.on('delete', (id)       => console.log('Deleted document with id ' + id))
notifier.on('poll',   (last_seq) => console.log('Notified changes until sequence id ' + last_seq))
notifier.on('error',  (cause)    => console.error(cause))
```

See the [event emitter](https://nodejs.org/dist/latest-v6.x/docs/api/events.html#events_class_eventemitter) API to know which methods are allowed.


## Example file

The included `example.js` script will poll for changes in a database which is expected to handle images.
It will log all the events, and will save the attached images to disk.

It needs an `.env` file with `DB_NAME`, `DB_USER` and `DB_PASSWORD` variables defined.
