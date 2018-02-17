import * as applicationRoutes from './bootstrap/routes'
import * as express from 'express'
import * as logging from './bootstrap/logging'
import * as logger from 'winston'
import * as db from './bootstrap/db'
import * as yargs from 'yargs'
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

app.listen(configuration.Port, () => logger.info(`super node indexer listening on port ${configuration.Port}!`))
