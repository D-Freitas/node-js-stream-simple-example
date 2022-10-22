import { Readable, Transform } from 'node:stream'
import { randomUUID } from 'node:crypto'
import { createReadStream } from 'fs'
import { dirname } from 'path'
import { promisify } from 'util'
import csvtojson from 'csvtojson'
import http from 'node:http'

function handler (request, response) {
  const { pathname } = new URL(import.meta.url)
  const currentPath = dirname(pathname)
  const readStream = createReadStream(`${currentPath}/file.csv`)
  const dataStream = new Transform({
    transform(chunk, encoding, callback) {
      const output = JSON.parse(chunk)
      return callback(null, JSON.stringify(output))
    }
  })
  const insertToDB = new Transform({
    transform(chunk, encoding, callback) {
      const output = JSON.parse(chunk)
      console.log(output)
      return callback(null, JSON.stringify(output, null, 2))
    }
  })
  readStream.on('open', function () {
    this
      .pipe(csvtojson())
      .pipe(dataStream)
      .pipe(insertToDB)
      .pipe(response)
  }) 
  readStream.on('error', function (error) {
    this.pipe(error)
  })
}

const server = http.createServer(handler)
const PORT = 3000

server.listen(PORT, () => {
  console.log(`running on port: ${PORT}`)
})

