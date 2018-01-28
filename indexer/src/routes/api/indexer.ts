import * as  express from 'express'
const router = express.Router()

import * as  logger from 'winston'
import * as indexHistory from '../../indexer/indexHistory'


router.get('/start/:startBlock?/:endBlock?', async (req, res, next) => {
  
  let startBlock = Number(req.params.startBlock)
  let endBlock = Number(req.params.endBlock)

  logger.info('starting indexer !!!')
  await indexHistory.startIndex(startBlock, endBlock)
  
})

module.exports = router
