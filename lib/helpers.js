/**
 * Helpers for various tasks
 */
//Dependencies
const crypto = require('crypto')
const config = require('./config')
const https = require('https')
const querystring = require('querystring')
const StringDecoder = require('string_decoder').StringDecoder
const path = require('path')
const fs = require('fs')

const helpers = {}

//Create a sha256 hash
helpers.hash = str =>{
    if(typeof(str)==='string'&& str.length>0){
        const hash = crypto.createHmac('sha256',config.hashingSecret).update(str).digest('hex')
        return hash
    }else{
        return false
    }
}

//Parse  a JSON string to an object  in all cases without throwing
helpers.parseJsonToObject = str => {
    try{
        const obj = JSON.parse(str)
        return obj
    }catch(e){
        //console.log('error parsing to object' , e)
        return {}
    }
}

//Create a string of random alphanumeric characters of a given length
helpers.createRandomString = (strLength) =>{
    strLength = typeof(strLength) === 'number' && strLength >0 ? strLength :false
    if(strLength){
        //Define  all the possible characters that could  go into a string
        const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789'

        //Start the final string
        let str = ''

        for(let i =1; i<= strLength; i++){
            //Get the random charachter from the possibleCharacters string
            const randomCharacter = possibleCharacters.charAt(Math.floor(Math.random()*
            possibleCharacters.length))
            //Append this character to the final string
            str += randomCharacter
        }
        return str
    }else{
        return false
    }
}

helpers.sendStripeRequest = (price,token,callback)=>{
    //Validate the parameters
    price = typeof(price) === 'number' && price > 0 ? price:false
    
    if(price){
        //Configure the request payload
        const payload = {
            'amount':price*100,
            'currency':'usd',
            'source': token,//'tok_visa',
            'description':'order Delivery payment'
        }

        //stringify the payload
        const stringPayload = querystring.stringify(payload)

        //configure the request details           
        const requestDetails = {
            'protocol':'https:',
            'hostname':'api.stripe.com',
            'method':'POST',
            'path':'/v1/charges',
            'auth':config.stripeSecretKey,
            'headers':{
                'Content-Type':'application/x-www-form-urlencoded',
                'Content-Length':Buffer.byteLength(stringPayload)
            }
        }
        //instantiate the request object
        const req = https.request(requestDetails,res=>{
            //Entender este res como lo que va a pasar cuando reciba la callback
            //Grab the status of the sent request
            const status = res.statusCode            
                // process the response

            var decoder = new StringDecoder("utf-8");
            var buffer ="";
            var paymentData ={};



            res.on('data', data => {
                buffer += data;
            })

            res.on('end',()=>{                
                buffer += decoder.end();
                paymentData = helpers.parseJsonToObject(buffer);                
                if(status==200 || status ==201){
                    callback(false,paymentData.id)
                }else{
                    callback('Status code returned was ' + status,false)
                }
            })


        })//sending all those details, and receiving a callback
        //Bind to  the error event so it does not get thrown
        req.on('error',e=>{
            callback(e,false)
        })//if an error occurs => it will happens

        //add the payload to the request
        req.write(stringPayload)

        //End the request
        req.end()
    }else{
        callback('Given parameters are missing or invalid',false)
    }
}

helpers.sendMailgunMessage = (email,msg,callback)=>{
    //Validate the parameters
    email = typeof(email)==="string" &&
    email.trim().length > 0 ? email.trim() :false

    msg = typeof(msg) === 'string' && msg.trim().length > 0 &&
        msg.trim().length <= 1600 ? msg.trim():false
    
    if(email && msg){
        //Configure the request payload
        const payload = {
            'from':'Mailgun Sandbox <postmaster@sandbox4d15eab2e5be4fdfb1375c212665c991.mailgun.org>',
            'to':email,//'Erick Pacheco Pedraza <erick.pacheco.p@uni.pe>',
            'subject': 'Message from PizzaDelivery',
            'text':msg
        }

        //stringify the payload
        const stringPayload = querystring.stringify(payload)

        //configure the request details           
        const requestDetails = {
            'protocol':'https:',
            'hostname':'api.mailgun.net',
            'method':'POST',
            'path':'/v3/sandbox4d15eab2e5be4fdfb1375c212665c991.mailgun.org/messages',
            'auth':'api:5b34ee4ede8aa6a9539ccf0566279108-41a2adb4-4a3d9e2a',
            'headers':{
                'Content-Type':'application/x-www-form-urlencoded',
                'Content-Length':Buffer.byteLength(stringPayload)
            }
        }
        //instantiate the request object
        const req = https.request(requestDetails,res=>{
            //Entender este res como lo que va a pasar cuando reciba la callback
            //Grab the status of the sent request
            const status = res.statusCode            

            var decoder = new StringDecoder("utf-8");
            var buffer ="";
            var resultMsg ={};



            res.on('data', data => {
                buffer += data;
            })

            res.on('end',()=>{                
                buffer += decoder.end();
                resultMsg = helpers.parseJsonToObject(buffer)                
                if(status==200 || status ==201){
                    callback(false,resultMsg)
                }else{
                    callback(status,resultMsg)
                }
            })
        })//sending all those details, and receiving a callback
        //Bind to  the error event so it does not get thrown
        req.on('error',e=>{
            callback(e,false)
        })//if an error occurs => it will happens

        //add the payload to the request
        req.write(stringPayload)

        //End the request
        req.end()
    }else{
        callback('Given parameters are missing or invalid',false)
    }
}

//Send an SMS message via Twilio
helpers.sendTwilioSms = (phone,msg,callback)=>{
    //Validate the parameters
    phone = typeof(phone) === 'string' && phone.trim().length === 10 ? phone.trim():false
    msg = typeof(msg) === 'string' && msg.trim().length > 0 &&
        msg.trim().length <= 1600 ? msg.trim():false
    if(phone && msg){
        //Configure the request payload
        const payload = {
            'From':config.twilio.fromPhone,
            'To':'+1' + phone,
            'Body': msg
        }

        //stringify the payload
        const stringPayload = querystring.stringify(payload)

        //configure the request details
        const requestDetails = {
            'protocol':'https:',
            'hostname':'api.twilio.com',
            'method':'POST',
            'path':'/2010-04-01/Accounts/'+config.twilio.accountSid + '/Messages.json',
            'auth':config.twilio.accountSid + ':' + config.twilio.authToken,
            'headers':{
                'Content-Type':'application/x-www-form-urlencoded',
                'Content-Length':Buffer.byteLength(stringPayload),//take the byte length of the stringified payload

            }
        }//2010-04-01=>version of twilio
        //instantiate the request object
        const req = https.request(requestDetails,res=>{
            //Entender este res como lo que va a pasar cuando reciba la callback
            //Grab the status of the sent request
            const status = res.statusCode
            //Callbacksuccessfully if the request went through
            if(status==200 || status ==201){
                callback(false)
            }else{
                callback('Status code returned was ' + status)
            }
        })//sending all those details, and receiving a callback
        //Bind to  the error event so it does not get thrown
        req.on('error',e=>{
            callback(e)
        })//if an error occurs => it will happens

        //add the payload to the request
        req.write(stringPayload)

        //End the request
        req.end()
    }else{
        callback('Given parameters are missing or invalid')
    }
}

//Get the string content of a module
helpers.getTemplate = (templateName,data,callback)=>{
    templateName = typeof(templateName) === 'string' && templateName.length>0 ?
    templateName:false
    data = typeof(data) ==='object' && data!== null ? data:{}
    if(templateName){
        const templatesDir = path.join(__dirname,'/../templates/')
        fs.readFile(templatesDir + templateName + '.html','utf8',(err,str)=>{
            if(!err && str && str.length>0){
                //Do interpolation of the string
                const finalString = helpers.interpolate(str,data)
                callback(false,finalString)
            }else{
                callback('no template could be found')
            }
        })//readingit as utf8
    }else{
        callback('a valid template name was not specified')
    }
}

//Add a universal header and footer to a string and provided data object to the header and footer
//for interpolation
helpers.addUniversalTemplates = (str,data,callback)=>{
    str  = typeof(str) === 'string' && str.length>0 ? str:''
    data = typeof(data) ==='object' && data!== null ? data:{}
    //Get the header
    helpers.getTemplate('_header',data,(err,headerString)=>{
        if(!err && headerString){
            //Get the footer
            helpers.getTemplate('_footer',data,(err,footerString)=>{
                if(!err && footerString){
                    //add them all together
                    const fullString = headerString + str + footerString
                    callback(false,fullString)
                }else{
                    callback('Could not find the footer template')
                }
            })
        }else{
            callback('Could not find the header template')
        }
    })
    
}


//Take a given string and a data object and find/replace all the keys within it.
helpers.interpolate = (str,data)=>{
    str  = typeof(str) === 'string' && str.length>0 ? str:''
    data = typeof(data) ==='object' && data!== null ? data:{}

    //add the template globals to the data object, prepending ther key names with "global"
    for(let keyName in config.templateGlobals){
        if(config.templateGlobals.hasOwnProperty(keyName)){
            data['global.'+keyName] = config.templateGlobals[keyName]
        }
    }    
    //for each key in the data object, insert this value into the string at the corresponding placeholder
    for(let key in data){
        if(data.hasOwnProperty(key) && typeof(data[key])==='string'){
            let replace = data[key]
            let find = '{'+key+'}'
            str = str.replace(find,replace)
        }
    }
    return str
}

//Get the contents of the static(public)  asset
helpers.getStaticAsset = (fileName,callback)=>{
    fileName = typeof(fileName) === 'string' && fileName.length>0 ? fileName:false
    if(fileName){
        const publicDir = path.join(__dirname,'/../public/')
        fs.readFile(publicDir + fileName ,(err,data)=>{
            if(!err && data){
                //callback the data
                callback(false,data)
            }else{
                callback('No file could be found')
            }
        })
    }else{
        callback('A valid filename was not specified')
    }
}

//export the module
 module.exports = helpers