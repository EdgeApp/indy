import * as express from 'express'
import * as logging from './bootstrap/logging'
import * as logger from 'winston'
import * as applicationRoutes from './bootstrap/routes'
import * as yargs from 'yargs'
import { configuration } from './config/config'
import { IndexerTransactions } from './indexer/indexerTransactions'
import { dbUtils }  from '../../common/commonDbUtils'


let app = express()
logging.load(app)

process.on('uncaughtException', function (err) {
  logger.error('Caught exception: ' + err)
  logger.error(err.stack)
})


const onStopRequest = async () => {
  logger.info("Caught interrupt signal")
  await indexerTransactions.stopIndex()
  logger.info("Indexer stopped, exit app")
  process.exit();
}

process.on('SIGINT', onStopRequest)
process.on('SIGQUIT', onStopRequest)
process.on('SIGTERM', onStopRequest)

configuration.readCommandLineArgs(yargs.argv)

applicationRoutes.load(app)

let indexerTransactions = new IndexerTransactions()

dbUtils.initDB().then(async () => {
  app.set('dbUtils', dbUtils)
  if(yargs.argv.start && yargs.argv.end)
    logger.info(`Start block parameter ${yargs.argv.start}, end block parameter ${yargs.argv.end}`)
  await indexerTransactions.startIndexerProcess(yargs.argv.start, yargs.argv.end)
  //await indexerTransactions.startLiveIndexerProcess()
})

app.set('config', configuration)
app.set('indexerTransactions', indexerTransactions)

logger.info(`parent process is pid ${process.pid}`)

app.listen(configuration.Port, () => logger.info(`super node indexer listening on port ${configuration.Port}!`))
