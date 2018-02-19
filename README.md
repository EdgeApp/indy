# Ethereum Super Node

Ethereum Super Node is a an Ethereum blockchain Indexer and REST API server, built with NodeJS, Express and Parity. The current DB implementation uses CouchDB. 

The indexer is running on the same machine as the Partity, creating a database of transactional data. The data can then be queried using a REST API.

### REST API

#### Pending transactions

GET /mempool/txs/[address]

Parameters:	
- address – optional account address.

Returns an array of unconfirmed (pending) transactions in the format below. If address is specified, only return transactions that have a from or to address that match address.

```
{
    status: 1,
    message: "OK",
    count: 316,
    result: [
        {
            blockNumber: 5120525,
            timeStamp: 1519072377,
            blockHash: "0xdc4df7a3dfaaa5cb115bccee2d15ddd241c057cc8ffbb8f47bb3f761f2b7ebe8",
            confirmations: 0,
            hash: "0xebcbdef39ff48a05f8e114fc5b5342c71f31ac7d35c8532edbdf632c6c3be3dc",
            nonce: 6771854,
            transactionIndex: 2,
            from: "0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8",
            to: "0xDcb04eaD3c8439B7c740bC30b84CdF11Ce236AEa",
            value: "50046013704764736",
            gas: 50000,
            gasPrice: "1000000000",
            input: "0x",
            isError: 1,
            gasUsed: 21000,
            cumulativeGasUsed: 63000,
            contractAddress: null
        }
        ...
        ...
    ]
}      
```

#### Account transactions

GET /account/{address}/[limit]/[skip]

Parameters:	

- address – mandatory account address.
- limit – limit result count. Ranage is 50 (default) to 1000.
- skip - query skips the speficied value.

Returns an array of pending and history transactions in the format below. 
Limit can be speficied. The 12 Live blocks are first priority. Pagination is availble with skip value.
If indexer module is not available, then the last 12 live blocks are not included. 

```
{
    status: 1,
    message: "OK",
    count: 50,
    includeLiveBlocks: false,
    result: [
        {
            blockNumber: 3344530,
            timeStamp: 1489413225,
            blockHash: "0x034c2662fd9a4769f2772862241adf51c6110ba7aac1395e660c717e7b90cd45",
            confirmations: 1776309,
            hash: "0x0000474e48357b8e10ddece815732e631f3256d614c442a6094b1c25f8792bdc",
            nonce: 40,
            transactionIndex: 8,
            from: "0xE41d417c9E55Cc87B80Af94b6759bb9F9a036306",
            to: "0x6Fc82a5fe25A5cDb58bc74600A40A69C065263f8",
            value: "212222140000000000",
            gas: 47008,
            gasPrice: "20000000000",
            input: "0x",
            isError: 0,
            gasUsed: 31984,
            cumulativeGasUsed: 335176,
            contractAddress: null
        }
        ...
        ...
    ]
}
```

#### Contract transactions

GET /tokes/{address}/{contractAddress}/[limit]/[skip]

Parameters:	

- address – mandatory account address.
- contractAddress – mandatory contract address.
- limit – limit result count. Ranage is 50 (default) to 1000.
- skip - query skips the speficied value.



Returns an array of pending and history contract transactions in the format below.
Limit can be speficied, range is 50-1000. The 12 Live blocks are first priority. 
Pagination is availble with skip value.
If indexer module is not available, then the last 12 live blocks are not included. 

```
{
    status: 1,
    message: "OK",
    count: 1
    result: [
        {
            blockNumber: 3126792,
            timeStamp: 1486288489,
            blockHash: "0x0a2657b7ac67f520068f68b715662c39084bb65c1d588ec9dac04f7f6268c2b5",
            confirmations: 1994240,
            hash: "0x5b5bd839b2b6280a3052b7f4716764abad5bba54c48506cc89a3da6ef8f67b4d",
            nonce: 19,
            transactionIndex: 5,
            from: "0x000001f568875F378Bf6d170B790967FE429C81A",
            to: null,
            value: "0",
            gas: 1700000,
            gasPrice: "20000000000",
            input: "0x60606040525b60008054600160a060020a03191633600160a060020a03161790555b5b611740806100316000396000f300606060405236156100515763ffffffff60e060020a6000350416633d6a32bd81146100635780635de01497146100ab57
            [.. ..]
            fffffffffffff1916600160a060020a0383161790555b5b505600a165627a7a723058204a5afd9abee5fcbfbdf2bd336ca2044906f60325b106545b4272a3dc3adf933d0029a165627a7a72305820bed6426e4b90d5e934b899c73aa74efd9c14c29fa460bbe60eacb35d4ef7716e0029",
            isError: 0,
            gasUsed: 1647192,
            cumulativeGasUsed: 1882081,
            contractAddress: "0x088973C56EB9B5E616A5184b015642e574582c31"
        }
    ]
}
```
