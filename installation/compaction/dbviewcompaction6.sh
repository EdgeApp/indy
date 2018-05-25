#!/bin/sh


echo Compacting 5,000,000-5,999,999 DB views

USER="$1"
PASSWORD="$2"

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-5000000-5099999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-5000000-5099999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-5100000-5199999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-5100000-5199999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-5200000-5299999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-5200000-5299999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-5300000-5399999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-5300000-5399999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-5400000-5499999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-5400000-5499999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-5500000-5599999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-5500000-5599999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-5600000-5699999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-5600000-5699999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-5700000-5799999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-5700000-5799999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-5800000-5899999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-5800000-5899999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-5900000-5999999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-5900000-5999999/_compact/toDocBlocks
