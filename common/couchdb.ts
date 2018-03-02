import * as nano from 'nano'

//import { configuration } from '../config/config' //TODO fix configuration

export var dbHandler = nano('http://admin:123456@localhost:5984')
