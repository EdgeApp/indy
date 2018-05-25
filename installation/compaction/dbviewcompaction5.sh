#!/bin/sh


echo Compacting 4,000,000-4,999,999 DB views

USER="$1"
PASSWORD="$2"

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-4000000-4099999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-4000000-4099999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-4100000-4199999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-4100000-4199999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-4200000-4299999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-4200000-4299999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-4300000-4399999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-4300000-4399999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-4400000-4499999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-4400000-4499999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-4500000-4599999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-4500000-4599999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-4600000-4699999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-4600000-4699999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-4700000-4799999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-4700000-4799999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-4800000-4899999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-4800000-4899999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-4900000-4999999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-4900000-4999999/_compact/toDocBlocks
