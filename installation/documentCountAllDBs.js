const USER = process.argv[2]
const PASSWORD = process.argv[3]

const nano = require('nano')(`http://${USER}:${PASSWORD}@localhost:5984`)

let totalDocCount = 0
nano.db.list(function(err, dbList) {
  console.log(`Total dbs: ${dbList.length}`)
  console.log(`**************************`)
  for(let index = 0; index < dbList.length ; index++) {
    let db = dbList[index]
    if(db === '_users' || db === '_replicator' || db === 'configsupernodedropsdb' || db === 'configsupernodesettingsdb') {
      continue
    }
    nano.db.get(db, function(err, dbBody){
      if(err) {
        console.log(err)
      } else {
        console.log(`db name: ${db}, docs: ${dbBody.doc_count}`)
        totalDocCount += dbBody.doc_count
        console.log(`Total doc count for all dbs: ${totalDocCount}`)
      }
    })
  }
})

