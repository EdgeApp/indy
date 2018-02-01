import * as indexHistory from '../../indexer/indexerHistory'
import * as logger from 'winston'
import * as express from 'express'
import { IndexerHistory } from '../../indexer/indexerHistory';

const router = express.Router()

router.get('/start/:startBlock?/:endBlock?', async (req, res, next) => {
  let startBlock = Number(req.params.startBlock)
  let endBlock = Number(req.params.endBlock)

  logger.info(`starting index from block: ${startBlock} to block ${endBlock}`)
  let indexerHistor = req.app.get('indexerHistory')
  await indexerHistor.startIndex(startBlock, endBlock)
})

module.exports = router
