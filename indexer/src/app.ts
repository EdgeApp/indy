import * as express from 'express'
import * as logging from './bootstrap/logging'
import * as logger from 'winston'
import * as applicationRoutes from './bootstrap/routes'
import * as db from './bootstrap/db'
import {configuration} from './config/config'

let app = express()
logging.load(app)

process.on('uncaughtException', function (err) {
  logger.info('error', 'Caught exception: ' + err)
  logger.info(err.stack)
})

applicationRoutes.load(app)

app.set('config', configuration)

db.CreateDataBases()

app.listen(configuration.Port, () => logger.info(`super node indexer listening on port ${configuration.Port}!`))
