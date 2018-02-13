import * as logger from 'winston'
import * as express from 'express'
import { IndexerTransactions } from '../../indexer/indexerTransactions';

const router = express.Router()

router.get('/liveBlocks/:address?', async (req, res, next) => {
  try {
    let indexderLive = req.app.get('indexerTransactions')
    let liveTransactions = indexderLive.liveBlocksTransactionsMap
    let filterAddress = req.params.address
    logger.info(`req.params.address ${req.params.address}`)
    logger.info(`filterAddress ${filterAddress}`)

    if(!liveTransactions || (liveTransactions &&! liveTransactions.length)) {
      return res.json(
        {
          'status': '0',
          'message': 'liveTransactions not availble yet',
          'result': 'not found'
        })    
    }
  
    let resTransactions = []
    liveTransactions.forEach(function (value, key, mapObj) {  
      
      if(filterAddress) {
        logger.info(`filterAddress not null`)
        let fromTransactions = value.transactions.filter((t) => t.from === filterAddress)
        let toTransactions = value.transactions.filter((t) => t.to === filterAddress)
        resTransactions = resTransactions.concat(fromTransactions)
        resTransactions = resTransactions.concat(toTransactions)        
      } else { // TODO, remove this
        logger.info(`filterAddress IS null, fetch all, for debug only, need to remove this`)        
        resTransactions = resTransactions.concat(value.transactions)
      }
    })

    return res.json(
      {
        'status': '1',
        'message': 'OK',
        'result': resTransactions
      })

  } catch (error) {
    return res.json(
      {
        'status': '0',
        'message': error,
        'result': 'not found'
      })      
  }
})

module.exports = router
