import * as nano from 'nano'
import { configuration } from '../config/config'

export var dbHandler = nano(configuration.DBUrl)
