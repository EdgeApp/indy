#!/bin/sh


echo Compacting 3,000,000-0003,999,999 DB views

USER="$1"
PASSWORD="$2"

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-0003000000-0003099999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-0003000000-0003099999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-0003100000-0003199999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-0003100000-0003199999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-0003200000-0003299999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-0003200000-0003299999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-0003300000-0003399999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-0003300000-0003399999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-0003400000-0003499999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-0003400000-0003499999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-0003500000-0003599999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-0003500000-0003599999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-0003600000-0003699999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-0003600000-0003699999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-0003700000-0003799999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-0003700000-0003799999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-0003800000-0003899999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-0003800000-0003899999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-0003900000-0003999999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-0003900000-0003999999/_compact/toDocBlocks
