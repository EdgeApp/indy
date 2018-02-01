import * as express from 'express'
import * as logging from './bootstrap/logging'
import * as logger from 'winston'
import * as applicationRoutes from './bootstrap/routes'
import * as db from './bootstrap/db'
import * as indexer from './indexer/indexerHistory'
import {configuration} from './config/config'
import { IndexerHistory } from './indexer/indexerHistory';

let app = express()
logging.load(app)

process.on('uncaughtException', function (err) {
  logger.info('error', 'Caught exception: ' + err)
  logger.info(err.stack)
})

applicationRoutes.load(app)

let indexerHistory = new IndexerHistory()
db.CreateDataBases().then( async () => {
  await indexerHistory.startIndexerProcess()
})

app.set('config', configuration)
app.set('indexerHistory', indexerHistory)

logger.info(`parent process is pid ${process.pid}`);

app.listen(configuration.Port, () => logger.info(`super node indexer listening on port ${configuration.Port}!`))
