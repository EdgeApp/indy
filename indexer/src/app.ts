import * as express from 'express'
import * as logging from './bootstrap/logging'
import * as logger from 'winston'
import * as applicationRoutes from './bootstrap/routes'
import * as db from './bootstrap/db'
import { configuration } from './config/config'
import { IndexerHistoryTransactions } from './indexer/indexerHistoryTransactions';

let app = express()
logging.load(app)

process.on('uncaughtException', function (err) {
  logger.info('error', 'Caught exception: ' + err)
  logger.info('error', err.stack)
})

applicationRoutes.load(app)

let indexerHistory = new IndexerHistoryTransactions()

db.CreateDataBases().then( async () => {
  await indexerHistory.startIndexerProcess()
  //await indexerHistory.startLiveIndexerProcess()
})

app.set('config', configuration)
app.set('indexerHistory', indexerHistory)

logger.info(`parent process is pid ${process.pid}`);

app.listen(configuration.Port, () => logger.info(`super node indexer listening on port ${configuration.Port}!`))
