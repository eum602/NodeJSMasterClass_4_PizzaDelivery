/**
 * Server related tasks
 */
//dependencies
 const http = require('http')
 const https = require('https')
 const url =require('url')
 const StringDecoder = require('string_decoder').StringDecoder
 const config = require('./config')
 const fs = require('fs')
 const handlers = require('./handlers')
 const helpers = require('./helpers')
 const path = require('path')
 const util = require('util')
 const debug = util.debuglog('server') //server because I am in the server file

 //Instatiate the server module object
 const server = {}

 server.httpServer = http.createServer((req,res)=>{
        server.unifiedServer(req,res)
 })
 
  //a.2. Instantiating the HTTPS server
  server.httpsServerOptions = {
          'key':fs.readFileSync(path.join(__dirname , '/../https/key.pem')),
          'cert':fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
  }
  server.httpsServer = https.createServer(server.httpsServerOptions,(req,res)=>{
        server.unifiedServer(req,res)
 })
 
 
 //All the server logic for  for both the http and the https server
 server.unifiedServer = (req,res)=>{
        //Get the url and parse it
        const parsedUrl = url.parse(req.url,true)//true:indicates to parse the query string 
            //which means to set the parsedUrl.query value at the equivalent as if we had
            //sent this data to the query string module, so really we are using two modules
            //in one
        //Get the path
         const path = parsedUrl.pathname//the path of the user request
            //http://localhost:3000/foo...
         const trimmedPath = path.replace(/^\/+|\/+$/g,'')          

         //Get the query string as an object:
        const queryStringObject = parsedUrl.query //?mnp=abd

        //Get the http method:
        const method = req.method.toLowerCase() //get, post

        //Get the headers as an object
        const headers = req.headers //{foo:bar,fizz:buzz,...}         

        //Get the payload, if any is the text: 'fdsfasdfsadfsd'
        const decoder = new StringDecoder('utf-8')//utf-8 is what kind of 
                //charset or encoding it can expect
                //payloads, as part of the http request, come in to the http server  as a string
                //so we need to collect that string as it comes in and then when the string tells
                //us what are the end cover last that into one covering thing before we can
                //figure out what the payload is
        let buffer = ''//string where we are going to append the incoming palyload as it comes
        req.on('data',data=>{
                buffer += decoder.write(data)
        })//when the request emit the event called 'data' (so, ON the event 
                //called data)
        
        req.on('end',()=>{//called regardless if it has a payload or not
                buffer += decoder.end()
                //debug('total buffer', buffer,typeof(buffer))                
                //choose the handler this request should go to. If one is not found use
                //not found handler
                let chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? 
                server.router[trimmedPath] : handlers.notFound                 

                //if the request is within the public directory,use the public handler instead
                chosenHandler = trimmedPath.indexOf('public/')>-1 ? handlers.public : chosenHandler

                //contruct the data Object to send to the handler:
                const data = {
                        'trimmedPath':trimmedPath,
                        'queryStringObject':queryStringObject,
                        'method':method,
                        'headers':headers,
                        'payload':helpers.parseJsonToObject(buffer)
                }
                //debug('data', data)
                //route the request to the handler specified in the router
                chosenHandler(data,(statusCode,payload,contentType)=>{
                        //Determine the type of the response(fallback to JSON)
                        contentType = typeof(contentType)==='string' ? contentType:'json'
                        //debug(statusCode,payload)//es la data que esta en la 
                        //funcion sample del objeto handler
                        //use the status code  CALLED BACK by the handler or default
                        //to 200
                        statusCode = typeof(statusCode) == 'number' ? statusCode:200
                         
                       //return the response parts that are content-specific
                       let payloadString = ''
                       if(contentType==='json'){
                               res.setHeader('content-Type','application/json')//telling ...
                               //that we are going to return an object:
                               //content-Type is the key ; application/json is the value
                        
                               //use the payload called back by the handler or default to and
                               //empty object
                               payload = typeof(payload)=='object' ? payload:{}
                               //convert the payload to a string
                               payloadString = JSON.stringify(payload)
                       }
                       if(contentType==='html'){
                               res.setHeader('content-Type','text/html')
                               payloadString = typeof(payload) === 'string' ? payload:''

                       }
                       if(contentType==='favicon'){
                               res.setHeader('content-Type','image/x-icon')
                               payloadString = typeof(payload) !== 'undefined' ? payload:''

                       }
                       if(contentType==='css'){
                               res.setHeader('content-Type','text/css')
                               payloadString = typeof(payload) !== 'undefined' ? payload:''

                       }
                       if(contentType==='png'){
                               res.setHeader('content-Type','image/png')
                               payloadString = typeof(payload) !== 'undefined' ? payload:''

                       }
                       if(contentType==='jpg'){
                               res.setHeader('content-Type','image/jpeg')
                               payloadString = typeof(payload) !== 'undefined' ? payload:''

                       }
                       if(contentType==='plain'){
                               res.setHeader('content-Type','text/plain')
                               payloadString = typeof(payload) !== 'undefined' ? payload:''
                       }

                        //return the response parts that are common to all content-types
                        res.writeHead(statusCode)//usin the buil in function that comes on every
                        //response object received by the http server to write the status code

                        //now that the request has finished
                        //Send the response
                        res.end(payloadString)

                        
                        //If the response is 200 return green otherwise return red
                        if(statusCode === 200){
                               debug('\x1b[32m%s\x1b[0m',`${method.toUpperCase()} /${trimmedPath} ${statusCode}`)
                        }else{
                               debug('\x1b[31m%s\x1b[0m',`${method.toUpperCase()} /${trimmedPath} ${statusCode}`)                                
                        }
                })
        })
        //debug(`Request received with these headers: ` , headers )
        //debug(`Request received on path: ${trimmedPath} with method ${method}
        //and with this query string parameters `, queryStringObject)
}
 
 //define a request router
 server.router = {
         '':handlers.index,
         'account/create':handlers.accountCreate,
         'account/edit':handlers.accountEdit,
         'account/deleted':handlers.accountDeleted,
         'session/create':handlers.sessionCreate,
         'session/deleted':handlers.sessionDeleted,
         'orders/create':handlers.ordersCreate,
         'orders/all':handlers.ordersAll,
         'orders/new':handlers.shop,
         'orders/payment/exec':handlers.execPayment,
         'orders/payment/data':handlers.confirmedPayment,
         'orders/payment/confirmed':handlers.order,
         'handlers/ping':handlers.ping,
         'api/users':handlers.users,
         'api/tokens':handlers.tokens,
         'api/items':handlers.items,
         'favicon.ico':handlers.favicon,
         'public':handlers.public
         //'shop':handlers.shop,
         //'orders/new':handlers.order
         //'checks':handlers.checks
 }

 //init script
 server.init = ()=>{
     //start the HTTP server
    server.httpServer.listen(config.httpPort,()=>{
        console.log('\x1b[36m%s\x1b[0m',`The server is listening on port ${config.httpPort}`)
    })
    //start the HTTPS server
    server.httpsServer.listen(config.httpsPort,()=>{
        console.log('\x1b[35m%s\x1b[0m',`The server is listening on port ${config.httpsPort}`)
    })
}

 //Export the module
 module.exports = server