import * as applicationRoutes from './bootstrap/routes'
import * as express from 'express'
import * as http from 'http'
import * as https from 'https'
import * as fs from 'fs'
import * as logging from './bootstrap/logging'
import * as logger from 'winston'
import * as db from './bootstrap/db'
import * as yargs from 'yargs'
import * as consts from './../../common/consts'
import {configuration} from './config/config'

let app = express()
logging.load(app)

process.on('uncaughtException', function (err) {
  logger.error('Caught exception: ' + err)
  logger.error(err.stack)
})

configuration.readCommandLineArgs(yargs.argv)

applicationRoutes.load(app)

app.set('config', configuration)

db.initDB()

if(consts.useSsl) {
  var options = {
    key: fs.readFileSync(consts.sslKey),
    cert: fs.readFileSync(consts.sslCert)
  }
    https.createServer(options, app).listen(configuration.Port, function() {
      logger.info(`super node indexer listening on port ${configuration.Port}!`)
  })  
} else {
    http.createServer(app).listen(configuration.Port, function(){
      logger.info(`super node indexer listening on port ${configuration.Port}!`)
  })
}






