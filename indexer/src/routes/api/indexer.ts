import * as logger from 'winston'
import * as express from 'express'

const router = express.Router()

router.get('/liveBlocks/:address/:fromto', async (req, res, next) => {
  try {
    let indexderLive = req.app.get('indexerTransactions')
    let liveTransactions = indexderLive.liveBlocksTransactionsMap
    let filterAddress = req.params.address

    let isAccount = req.params.fromto == 'account'
    let isTo = req.params.fromto == 'to'
    let isFrom = req.params.fromto == 'from'
    let isAll = req.params.fromto == 'all'


    logger.info(`req.params.address ${req.params.address}`)
    logger.info(`filterAddress ${filterAddress}`)

    if (!liveTransactions || (liveTransactions && !liveTransactions.length)) {
      return res.json({
        'status': '0',
        'message': 'liveTransactions not availble yet',
        'result': 'not found'
      })
    }

    let resTransactions = []
    liveTransactions.forEach(function (value, key, mapObj) {
      if (filterAddress) {
        if(isAccount || isFrom) {
          let fromTransactions = value.transactions.filter((t) => t.from.toLowerCase() === filterAddress.toLowerCase())
          resTransactions = resTransactions.concat(fromTransactions)
        }
        if(isAccount || isTo) {
          let toTransactions = value.transactions.filter((t) => (t.to.toLowerCase() === filterAddress.toLowerCase() || t.contractAddress.toLowerCase() == filterAddress.toLowerCase()))
          resTransactions = resTransactions.concat(toTransactions)
        }
      }
    })

    if(isAll) {
      resTransactions = liveTransactions
    }


    logger.info(`Number of account results from liveblocks: ${resTransactions.length}`)

    return res.json(
      {
        'status': 1,
        'message': 'OK',
        'result': resTransactions
      })
  } catch (error) {
    return res.json({
      'status': 0,
      'message': error,
      'result': 'not found'
    })
  }
})

module.exports = router
