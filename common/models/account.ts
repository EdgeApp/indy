import {Transaction} from './transaction'


export interface Account {  

    address: number,
    transactions: Array<Transaction>,
}