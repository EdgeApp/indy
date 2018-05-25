#!/bin/sh

echo Compacting 2,000,000-2,999,999 DBS

USER="$1"
PASSWORD="$2"

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-2000000-2099999/_compact

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-2100000-2199999/_compact

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-2200000-2299999/_compact

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-2300000-2399999/_compact

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-2400000-2499999/_compact

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-2500000-2599999/_compact

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-2600000-2699999/_compact

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-2700000-2799999/_compact

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-2800000-2899999/_compact

curl -H "Content-Type: application/json" -X POST http://$USER:$PASSWORD@localhost:5984/supernodedb-2900000-2999999/_compact

