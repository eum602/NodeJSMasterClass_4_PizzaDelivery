 /*
 *primary file for the api
 *
 * * 
 * */
//Dependencies
const server = require('./lib/server')
const cli =  require('./lib/cli')
const workers = require('./lib/workers')

//Declare the app
const app = {}

//Init function
app.init = () =>{
        //start the server
        server.init()
        //start the workers
        workers.init()
        //start the cli, but make sure it starts last
        setTimeout(()=>{
                cli.init()
        },50)
}

//Execute 
app.init()

//Export the app
module.exports = app
