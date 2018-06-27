#!/bin/sh

# this script work only for the old db names, without padding. for the new one, use node program

echo Deleting all DBS

USER="$1"
PASSWORD="$2"

curl -X DELETE  http://$USER:$PASSWORD@localhost:5984/configsupernodesettingsdb
curl -X DELETE  http://$USER:$PASSWORD@localhost:5984/configsupernodedropsdb

let DBNUMBER=0
while [ "$DBNUMBER" != "0008000000" ]
do
  TOPDBNUMBER=$(( DBNUMBER+99999 ))
  echo "deleting supernodedb-$DBNUMBER-$TOPDBNUMBER"
  curl -X DELETE  http://$USER:$PASSWORD@localhost:5984/supernodedb-$DBNUMBER-$TOPDBNUMBER
  DBNUMBER=$(( DBNUMBER+100000 ))
done