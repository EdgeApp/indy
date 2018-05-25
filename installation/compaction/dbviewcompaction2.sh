#!/bin/sh

echo Compacting 1,000,000-1,999,999 DB views

USER="$1"
PASSWORD="$2"

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-1000000-1099999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-1000000-1099999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-1100000-1199999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-1100000-1199999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-1200000-1299999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-1200000-1299999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-1300000-1399999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-1300000-1399999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-1400000-1499999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-1400000-1499999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-1500000-1599999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-1500000-1599999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-1600000-1699999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-1600000-1699999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-1700000-1799999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-1700000-1799999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-1800000-1899999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-1800000-1899999/_compact/toDocBlocks

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-1900000-1999999/_compact/fromDocBlocks
curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-1900000-1999999/_compact/toDocBlocks