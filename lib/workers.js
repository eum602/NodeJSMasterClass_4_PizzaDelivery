/**
 * worker related task
 */
//Dependencies
const _data = require('./data')
const https = require('https')
const http = require('http')
const helpers = require('./helpers')
const url = require('url')
const _logOrders = require('./logOrders')
const _logUsers = require('./logUsers')
const util = require('util')
const debug = util.debuglog('workers') //workers because I am in the workers file

//Instatiate the worker object
const workers = {}


//Lookup all checks, get their data, send to  a validator
workers.gatherAllData = (folder)=>{
    //Get all the checks that exist on the system
    _data.list(folder,(err,data)=>{
        if(!err && data && data.length > 0){
            data.forEach(item =>{
                //Read in the check data
                _data.read(folder,item,(err,originalData)=>{
                    if(!err && originalData){
                        //Pass it to the check validator, and let that function continue 
                        //or log error
                        if(folder==='shopCart' || folder==='users'){
                            //workers.validateOrderData(originalData)
                            const timeOfCheck = Date.now()
                            workers.log(originalData,timeOfCheck,folder)

                        }else{
                            debug(`Error, the folder ${folder} have no validation function, can not continue with this folder`)
                        }
                    }else{
                        debug(`Error reading one of the item\'s data in the folder ${folder}`)
                    }
                })
            })
        }else{
            debug('Error: Could not find any order to process')
        }
    })
}

workers.log = (originalData,timeOfCheck,folder) => {
    //Form the log data
    const logData = {
        'data':originalData,
        'time':timeOfCheck
    }

    //Conver data to a string
    const logString = JSON.stringify(logData)

    //Determine the name of the log file
    let logFileName
    if(folder==='shopCart'){
        logFileName = originalData.id
        //Appned the logString to  the file
        _logOrders.append(logFileName,logString,err=>{
            if(!err){
                debug('Logging to the file succeeded')
            }else{
                debug('Logging to the file failed')
            }
        })
    }else if(folder==='users'){
        logFileName = originalData.email
        //Appned the logString to  the file
        _logUsers.append(logFileName,logString,err=>{
            if(!err){
                debug('Logging to the file succeeded')
            }else{
                debug('Logging to the file failed')
            }
        })
    }
}

//Timer to execute the worker process once per minute
workers.loop=()=>{
    setInterval(()=>{
        workers.gatherAllData('shopCart')
        workers.gatherAllData('users')
    },1000*60)
}

//Rotate (compress the log files)
workers.rotateLogs = fcn =>{
    //List all the non compressed log files that are sitting in the logs folder
    fcn.list(false,(err,logs)=>{
        if(!err && logs && logs.length){
            logs.forEach(logName=>{
                //Compress the data to a different file
                const logId = logName.replace('.log','')
                const newFileId = logId + '-' + Date.now()
                fcn.compress(logId,newFileId,err=>{
                    if(!err){
                        //Truncate the log
                        fcn.truncate(logId,err=>{
                            //by truncating I mean emptying everythig put of the
                            //original log file
                            if(!err){
                                debug('Success truncating logfile')
                            }else{
                                debug('Error truncating logFile')
                            }
                        })
                    }else{
                        debug('Error compressing one of the log files', err)
                    }
                })
            })
        }else{
            debug('Error: Could not find any logs to rotate')
        }
    })
}

//timer to execute the logRotation process once per day
workers.logRotationLoop = ()=>{
    setInterval(()=>{
        workers.rotateLogs()
    },1000*60*60*24)
}

//Init script
workers.init = ()=>{
    //Send to console in yellow
    console.log('\x1b[33m%s\x1b[0m','Background workers are running') //\x1b[33m%s\x1b[0m is a command
            //that tells the console to put it in yellow
            //%s   => es en realidad el objetivo por el cual cualquier parametro siguiente('Background workers are running')
            //va dentro reemplazando a %s y tomando la forma.
            //33 is the yellow , also we can choose another like 32 and so on.
    
    
    //Execute all checks inmediately
    workers.gatherAllData('shopCart')
    workers.gatherAllData('users')
    //Call the loop so the check will execute later on
    workers.loop()

    //compress all the logs immediately
    workers.rotateLogs(_logOrders)
    workers.rotateLogs(_logUsers)

    //Call the compression loops so logs will be compressed later on
    workers.logRotationLoop()
}

//Export the module
module.exports = workers