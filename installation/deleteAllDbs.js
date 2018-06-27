const USER = process.argv[2]
const PASSWORD = process.argv[3]

const nano = require('nano')(`http://${USER}:${PASSWORD}@localhost:5984`)


nano.db.destroy('configsupernodesettingsdb', function(err, body){
  if(err) {
    console.log(err)
  }
})

nano.db.destroy('configsupernodedropsdb', function(err, body){
  if(err) {
    console.log(err)
  }
})

let dbNumber = 0
while (dbNumber != 8000000) {

  let topDb = dbNumber + 99999
  let dbName = `supernodedb-${padDBName(dbNumber.toString())}-${padDBName(topDb.toString())}`
  console.log('deleteing :' + dbName)
  nano.db.destroy(dbName, function(err, body){
    if(err) {
      console.log(err)
    } else {
      console.log(body)
      console.log('db deleted successfully :' + dbName)
    }
  })

  dbNumber = dbNumber + 100000
}

function padDBName(dbName) {
  while (dbName.length < 10) {
    dbName = '0' + dbName;
  }
  return dbName
}

console.log('Done delete')
