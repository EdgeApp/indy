var readline = require('readline')
var rl = readline.createInterface(process.stdin, process.stdout)

const USER = process.argv[2]
const PASSWORD = process.argv[3]

const nano = require('nano')(`http://${USER}:${PASSWORD}@localhost:5984`)

//  check this new code next time we need to delete our db - remove old code
rl.question("You are about to delete all indy DBS!! are you sure? [yes]/no: ", function(answer) {
  if(answer !== "yes") {
      console.log ("DBs not deleted" + filename)
  } else {
    nano.db.list(function(err, dbList) {
      console.log(`Total dbs: ${dbList.length}`)
      console.log(`**************************`)
      body.forEach(function(dbName) {
        nano.db.destroy(dbName, function(err, body){
          if(err) {
            console.log(err)
          } else {
            console.log(body)
            console.log('db deleted successfully :' + dbName)
          }
        })
      })
    })
  }
})



// old code, need to remove next time after the new code is tested
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



