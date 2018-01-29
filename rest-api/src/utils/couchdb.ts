import * as nano from 'nano'
import * as logger from 'winston'
import { configuration } from '../config/config'

export var dbHandler = nano(configuration.DBUrl)
