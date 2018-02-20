import * as express from 'express'
import * as logging from './bootstrap/logging'
import * as logger from 'winston'
import * as applicationRoutes from './bootstrap/routes'
import * as db from './bootstrap/db'
import * as yargs from 'yargs'
import { configuration } from './config/config'
import { IndexerTransactions } from './indexer/indexerTransactions'

let app = express()
logging.load(app)

process.on('uncaughtException', function (err) {
  logger.error('Caught exception: ' + err)
  logger.error(err.stack)
})

configuration.readCommandLineArgs(yargs.argv)

applicationRoutes.load(app)

let indexerTransactions = new IndexerTransactions()


db.CreateDataBases().then(async () => {
  await indexerTransactions.startIndexerProcess(yargs.argv.startBlock, yargs.argv.endBlock)
  //await indexerTransactions.startLiveIndexerProcess()
})

app.set('config', configuration)
app.set('indexerTransactions', indexerTransactions)

logger.info(`parent process is pid ${process.pid}`)

app.listen(configuration.Port, () => logger.info(`super node indexer listening on port ${configuration.Port}!`))
