import * as express from 'express'
import * as logging from './bootstrap/logging'
import * as logger from 'winston'
import * as applicationRoutes from './bootstrap/routes'
import * as db from './bootstrap/db'
import { configuration } from './config/config'
import { IndexerTransactions } from './indexer/indexerTransactions';

let app = express()
logging.load(app)

process.on('uncaughtException', function (err) {
  logger.info('error', 'Caught exception: ' + err)
  logger.info('error', err.stack)
})

applicationRoutes.load(app)

let indexerTransactions = new IndexerTransactions()

db.CreateDataBases().then( async () => {
  await indexerTransactions.startIndexerProcess()
  //await indexerTransactions.startLiveIndexerProcess()
})

app.set('config', configuration)
app.set('indexerTransactions', indexerTransactions)

logger.info(`parent process is pid ${process.pid}`);

app.listen(configuration.Port, () => logger.info(`super node indexer listening on port ${configuration.Port}!`))
