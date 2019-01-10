/**
 * cli realated tasks
 */
//dependencies
const readline = require('readline') //built in package that let s you read a line
const util = require('util')//allow to set a cli specific login
const debug = util.debuglog('cli')//only console in the cli
const events = require('events')
class _events extends events{} //our own extended class
const e = new _events
const os = require('os')
const  v8= require('v8') //node is built on top of v8, but we can have more metrics about the runtime
                         //by calling v8
const _data = require('./data')
const _logOrders = require('./logOrders')
const _logUsers = require('./logUsers')
const helpers = require('./helpers')

//instantiate the cli module object
const cli = {}

//input handlers
e.on('man',str=>{
    cli.responders.help()
})

e.on('help',str=>{
    cli.responders.help()
})

e.on('exit',str=>{
    cli.responders.exit()
})

e.on('stats',str=>{
    cli.responders.stats()
})

e.on('list users',str=>{
    cli.responders.listUsers()
})

e.on('more user info',str=>{
    cli.responders.moreUserInfo(str)
})

e.on('list menu items',()=>{
    cli.responders.listMenuItems()
})

e.on('list recent orders',str=>{
    cli.responders.listRecentOrders()
    
})

e.on('more order info',str=>{
    cli.responders.moreOrderInfo(str)
})

e.on('list new users',str=>{
    cli.responders.listNewUsers()
})

//Responders object
cli.responders = {}

//Exit
cli.responders.exit = () => {
    //console.log("You asked for exit")
    process.exit(0)//zeroo means no error
}

//Help /man
cli.responders.help = () => {
    //console.log("You asked for help")
    const commands = {
        'exit':'Kill the CLI (and the rest of the application)',
        'man':'Show this help page',
        'help':'Alias of the man command',        
        'stats':'Get statistics on the underliying operating system and resource utilization',
        'list users':'Show a list of all the registered (undeleted) users in a system',
        'more user info --{email}':'show details of a specific user',
        'list menu items':'Show all the items in the pizza delivery app',
        'list recent orders':'Show a list of all the recent orders made within de past 24 hours',
        'more order info --{orderId}':'More info about a specific order',
        'list new users':'Show a list of all the recent visitors who has just joined within de past 24 hours',
    }
    //Show  a header for the help page that is as wide as the screen
    cli.horizontalLine()
    cli.centered('CLI MANUAL')
    cli.horizontalLine()
    cli.verticalSpace(2)


    //Show each command, followed by its explanation, in white and yellow respectively
    for(let key in commands){
        if(commands.hasOwnProperty(key)){
            let value = commands[key]
            let line =  `\x1b[33m${key}\x1b[0m`
            const padding = 60 - line.length
            for(let i =0 ;i<padding;i++){
                line += ' '
            }
            line+=value
            console.log(line)
            cli.verticalSpace()
        }
    }

    cli.verticalSpace(1)

    //End with another hoeizontal line
    cli.horizontalLine()

}

//stats
cli.responders.stats = () => {
    //console.log("You asked for stats")
    //compile an object of stats
    let stats = {
        'Load Average': os.loadavg().join(' '),//joining the array with a space to make it a string
        'CPU count':os.cpus().length,
        'Free Memory':os.freemem(),
        'Current Malloced Memory':v8.getHeapStatistics().malloced_memory,
        'Peak Malloced Memory':v8.getHeapStatistics().peak_malloced_memory,
        'Allocated Head Use(%)': Math.round((v8.getHeapStatistics().used_heap_size / v8.getHeapStatistics().total_heap_size)*100),
        'Available Head Allocated(%)':Math.round((v8.getHeapStatistics().total_heap_size / v8.getHeapStatistics().heap_size_limit)*100),
        'Uptime':os.uptime + ' Seconds'
    }

    cli.horizontalLine()
    cli.centered('SYSTEM STATISTICS')
    cli.horizontalLine()
    cli.verticalSpace(2)

    //Show each command, followed by its explanation, in white and yellow respectively
    for(let key in stats){
        if(stats.hasOwnProperty(key)){
            let value = stats[key]
            let line =  `\x1b[33m${key}\x1b[0m`
            const padding = 60 - line.length
            for(let i =0 ;i<padding;i++){
                line += ' '
            }
            line+=value
            console.log(line)
            cli.verticalSpace()
        }
    }

    cli.verticalSpace(1)

    //End with another hoeizontal line
    cli.horizontalLine()

    

}

//list users
cli.responders.listUsers = () => {
    //console.log("You asked to list users")
    _data.list('users',(err,userIds)=>{
        if(!err && userIds && userIds.length>0){
            cli.verticalSpace()
            userIds.forEach(userId=>{
                _data.read('users',userId,(err,userData)=>{
                    if(!err && userData){
                        let line = `Name: ${userData.firstName} ${userData.lastName} email:${userData.email} Street Address:${userData.streetAddress} Number of orders: `
                        const numberOfOrders = typeof(userData.orders) === 'object' && userData.orders instanceof Array &&
                            userData.orders.length>0 ? userData.orders.length:0
                        line += numberOfOrders
                        console.log(line)
                        cli.verticalSpace()
                    }
                })
            })
        }
    })
}

//More user info
cli.responders.moreUserInfo = str => {//use the email
    //console.log("You asked for more user info",str)
    //Get the id from the string 
    let arr = str.split('--') //splitting the string into an array
    const userId = typeof(arr[1])==='string' && arr[1].trim().length>0 ? arr[1].trim():false
    if(userId){
        //Lookup the user
        _data.read('users',userId,(err, userData)=>{
            if(!err && userData){
                //Remove the hashed password
                delete userData.hashedPassword

                //print  the JSON with text highligting
                cli.verticalSpace()
                console.dir(userData,{'colors':true})
                cli.verticalSpace()
            }
        })
    }
}

//list Menu Items
cli.responders.listMenuItems = () =>{
    _data.read('items','items',(err,itemsData)=>{
        if(!err && itemsData){
            for(let key in itemsData){
                cli.horizontalLine()
                cli.centered(`${key}`)
                cli.horizontalLine()                
                console.dir(itemsData[key],{'colors':true})
                cli.verticalSpace()
            }
        }
    })
}

//list log Orders
cli.responders.listRecentOrders = () => {
    _data.list('shopCart',(err,orderIds)=>{
        if(!err && orderIds && orderIds.length>0){
            cli.verticalSpace()
            orderIds.forEach(orderId=>{
                _data.read('shopCart',orderId,(err, orderData)=>{
                    if(!err && orderData && orderData.registeredAt+1000*60*60*24>=Date.now()){
                        //print  the JSON with text highligting
                        cli.verticalSpace()
                        console.dir(orderData.id,{'colors':true})
                        cli.verticalSpace()
                    }
                })
                         
            })
        }
    })
}

//More user info
cli.responders.moreOrderInfo = str => {
    //console.log("You asked for more user info",str)
    //Get the id from the string 
    let arr = str.split('--') //splitting the string into an array
    const orderId = typeof(arr[1])==='string' && arr[1].trim().length>0 ? arr[1].trim():false
    
    if(orderId){
        //Lookup the order
        _data.read('shopCart',orderId,(err, orderData)=>{
            if(!err && orderData){
                //print  the JSON with text highligting
                cli.verticalSpace()
                console.dir(orderData,{'colors':true})
                cli.verticalSpace()
            }
        })
    }
}

cli.responders.listNewUsers = () => {
    _data.list('users',(err,userIds)=>{
        if(!err && userIds && userIds.length>0){
            cli.verticalSpace()
            userIds.forEach(userId=>{
                _data.read('users',userId,(err, userData)=>{
                    if(!err && userData && userData.registeredAt+1000*60*60*24>=Date.now()){
                        //print  the JSON with text highligting
                        cli.verticalSpace()
                        console.dir(userData.email,{'colors':true})
                        cli.verticalSpace()
                    }
                })                
            })
        }
    })
}

//Create a vertical space
cli.verticalSpace = lines =>{
    lines =typeof(lines) === 'number' && lines>0 ? lines:1
    for(let i=0;i<lines;i++){
        console.log('')
    }
}

//create a horizontal line accross the screen
cli.horizontalLine = () =>{
    //Get the available screen sizes
    let width = process.stdout.columns

    let line = ''

    for(let i=0; i<width;i++){
        line += '-'
    }
    console.log(line)
}

//Create centered text on the screen
cli.centered = str=>{
    str =typeof(str)==='string' && str.trim().length>0 ? str.trim():''

    //Get the available screen sizes
    let width = process.stdout.columns

    //Calculate the left paddingthere should be
    let leftPadding =Math.floor((width - str.length)/2)

    //put in left padded spaces before the string itself
    let line =  ''
    for(let i=0;i<leftPadding;i++){
        line += ' '        
    }
    line +=str
    console.log(line)
}


//Input processor
cli.processInput = str=>{
    str = typeof(str) ==='string' && str.trim().length>0 ? str.trim():false
    //process the input if the user  actually  wrote something.Otherwise ignore
    if(str){
        //codify the  unique  strings that identify the unique questions allowed to be asked
        const uniqueInputs = [
            'man',
            'help',
            'exit',
            'stats',
            'list users',
            'more user info',
            'list menu items',
            'list recent orders',
            'more order info',
            'list new users'            
        ]
        //G through the possible inputs  and emit an event when  a match is found
         let matchFound = false
         let counter = 0
         uniqueInputs.some(input => {
             if(str.toLowerCase().indexOf(input)>-1){
                 matchFound = true
                 //Emit an event  matching a unique input and include the full string given by the user
                 e.emit(input,str)
                 return true
             }
         })

         //if not match is found, tell the user to try again
         if(!matchFound){
             console.log("Sorry try again")
         }
    }
}


//init script
cli.init = ()=>{
    //send the start message to the console in dark blue
    console.log('\x1b[34m%s\x1b[0m',`The cli is running`)

    //start the interface
    const _interface = readline.createInterface({//readline is part of the REPL module of nodejs
        input:process.stdin,//stdim: standard input will route to the console
        output:process.stdout,//will route to the console
        prompt:'>'
    })

    //Create an initial prompt
    _interface.prompt()//if you put > so it will appear if I start with node index.js

    //handle each line of input separately
    _interface.on('line',str=>{
        //send to the input processor
        cli.processInput(str)

        //initialize the prompt afterwards
        _interface.prompt()
    })
    //if the user stops the CLI, kill the associated process
    _interface.on('close',()=>{
        process.exit(0) //Zero is the status code that we are exiting on meaning everithing is ok.
    })
}



//export the module
module.exports = cli