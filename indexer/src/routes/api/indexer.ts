import * as logger from 'winston'
import * as express from 'express'
import { IndexerTransactions } from '../../indexer/indexerTransactions';

const router = express.Router()

router.get('/liveBlocks/:address', async (req, res, next) => {
  let address = Number(req.params.address)

  let indexderLive = req.app.get('indexerTransactions')
  let liveTransactions = indexderLive.liveTransactionsMap

  let resTransactions = []
  liveTransactions.forEach(function (item, key, mapObj) {  
    let transactions = item.filter((t) => {t.from == address || t.to == address})
    resTransactions = resTransactions.concat(transactions)
  })
  return res.json(resTransactions)  
})

module.exports = router
