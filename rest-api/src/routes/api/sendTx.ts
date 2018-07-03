import * as express from 'express'
import * as logger from 'winston'
import * as blockUtils from '../../utils/blockUtils'
import { configuration } from '../../config/config'
import { Transaction } from '../../../../common/models/transaction'


const router = express.Router()

const Web3 = require('web3')
const web3 = new Web3()

web3.setProvider(configuration.provider)

const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);


router.get('/sendtx/:signedTransaction', async (req, res, next) => {

  let result = null
  let status = 0
  let message = 'FAIL'

  try {
    let signedTransaction = req.params.signedTransaction
    logger.info(signedTransaction)
    let receipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction)
    if(receipt.status) {
      result = receipt.transactionHash
      status = 1
      message = 'OK'
      logger.info(`receipt ok:`)
      logger.info(receipt)
    } else {
      logger.error(`receipt error:`)
      logger.error(receipt)
    }
  } catch (error) {
    logger.info(error.message)
    message = error.message
  }

  return res.json(
    {
      'status': status,
      'message': message,
      'result': result
    })
})

// remove after tests
const kovanTrasaction  = async ()=> {

  const keystore = await readFile('/home/adys/Sources/keystorekovan.json')
  const keystoreJson = JSON.parse(keystore)
  const decryptedAccount = web3.eth.accounts.decrypt(keystoreJson, 'password');

  const  rawTransaction = {
    'from': '0x009d7113048A319b71E7f25a43A36f1438C1b096',
    'to': '0x00C55EEBE4d5D98D5CD20E11C1023Cd1aB9C631D',
    'value': web3.utils.toHex(web3.utils.toWei("0.001", "ether")),
    'gas': 200000,
    'chainId': 42
  }

  const signedTransactionTest = await decryptedAccount.signTransaction(rawTransaction)
  return signedTransactionTest
}

module.exports = router

