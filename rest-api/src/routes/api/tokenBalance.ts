import * as express from 'express'
import * as logger from 'winston'
import * as blockUtils from '../../utils/blockUtils'
import { configuration } from '../../config/config'

const router = express.Router()

const Web3 = require('web3')
const web3 = new Web3()

web3.setProvider(configuration.provider)

router.get('/:address/:contractAddress', async (req, res, next) => {

  let result
  let status = 0
  let message = 'FAIL'
  let balance = 'empty'

  try {
    let address = req.params.address
    let contractAddress = req.params.contractAddress

    // substring removes the '0x', as its not required
    let cleanAddress = (address).substring(2);

    // '0x70a08231' is the contract 'balanceOf()' ERC20 token function in hex.
    // A zero buffer is required and then we add the previously defined address with tokens
    let contractData = ('0x70a08231000000000000000000000000' + cleanAddress);

    let callResult = await web3.eth.call({
        to: contractAddress, // Contract address, used call the token balance of the address in question
        data: contractData // Combination of contractData and tknAddress, required to call the balance of an address
      }
    )

    if (callResult) {
      // Convert the result to a usable number string
      balance = web3.utils.toBN(callResult).toString()
      // Change the string to be in Ether not Wei
      // balance =  web3.utils.fromWei(tokens, 'ether')
      
    }

    logger.info(`retrieving balance for address ${address}.`)

    result = balance
    message = 'OK'
    status = 1
  } catch (error) {
      message = 'FAIL'
      result = null
      logger.info(error)
  }

  return res.json(
    {
      'status': status,
      'message': message,
      'result': result
    })
})

module.exports = router
