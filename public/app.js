/**
 * frontend logic for the application
 */

 //Container for the frontend application
 const app = {}

 //config
 app.config = {
     'sessionToken':false,
     'count':0
 }
 
 //Ajax client (for the restful API)
 app.client = {}

// Interface for making API calls
app.client.request = (headers,path,method,queryStringObject,payload,callback)=>{
//set defaults
headers = typeof(headers)==='object' && headers!==null ? headers:{}
path = typeof(path) === 'string' ? path:'/'
method = typeof(method) === 'string' && ['POST','GET','PUT','DELETE'].indexOf(method) >-1 ? method.toUpperCase():'GET'
queryStringObject = typeof(queryStringObject)==='object' && queryStringObject!==null ? queryStringObject:{}
payload = typeof(payload)==='object' && payload!==null ? payload:{}
callback = typeof(callback) === 'function' ? callback:false

//for each query String  parameter sent, add it to the path
  let requestUrl = path + '?'
  let counter = 0
  for(let queryKey in queryStringObject){
      if(queryStringObject.hasOwnProperty(queryKey)){
        counter++
        //If  at least one query string parameter has already been added, prepend  new ones with ampersand
        if(counter>1){
            requestUrl +='&'
        }
        //Add the key and value
        requestUrl += queryKey + '=' + queryStringObject[queryKey]
      }
  }

  //form the http request as a json type
  let xhr = new XMLHttpRequest()
  xhr.open(method,requestUrl,true)
  xhr.setRequestHeader("Content-Type","application/json")
  //For each header  sent add it to the request ne by one
  for(let headerKey in headers){
      if(headerKey.hasOwnProperty(headerKey)){
          xhr.setRequestHeader(headerKey,headers[headerKey])
      }
  }

  //if there is a current session token set, add that as a header
  if(app.config.sessionToken){
      xhr.setRequestHeader("token",app.config.sessionToken.id)
  }

  //When the request comes back handle the response
  xhr.onreadystatechange = ()=>{
      if(xhr.readyState == XMLHttpRequest.DONE){//means the request is done
        let statusCode = xhr.status
        let responseReturned = xhr.responseText

        //Callback if requested
        if(callback){
            try{
                const parsedResponse = JSON.parse(responseReturned)
                callback(statusCode,parsedResponse)
            }catch(e){
                callback(statusCode,false)
            }
        }
      }
  }
  //Set the payload as json
const payloadString = JSON.stringify(payload)
xhr.send(payloadString)
}

// Bind the logout button
app.bindLogoutButton = ()=>{
  document.getElementById("logoutButton").addEventListener("click", e=>{
      // Stop it from redirecting anywhere         
      e.preventDefault()
  
      // Log the user out
      app.logUserOut()
  
    })
}

//Log the user out and then redirect them
app.logUserOut = redirectUser=>{
  redirectUser = typeof(redirectUser) === 'boolean' ? redirectUser:true
  const tokenId = typeof(app.config.sessionToken.id) === 'string' ? app.config.sessionToken.id:false
  
  // Send the current token to the tokens endpoint to delete it
  const queryStringObject = {
      'id' : tokenId
  }

  app.client.request(undefined,'api/tokens','DELETE',queryStringObject,undefined,(statusCode,responsePayload)=>{
      // Set the app.config token as false
      app.setSessionToken(false)
      // Send the user to the logged out page
      if(redirectUser){
        window.location = '/session/deleted'
      }      
  })
}

// Bind the forms
app.bindForms = ()=>{  
  if(document.querySelector("form")){

    const allForms = document.querySelectorAll("form")
    for(let form of allForms){
      form.addEventListener('submit',e=>{
        
        // Stop it from submitting
        e.preventDefault()
        //console.log(e.target)
        const formId = e.target.id
        const path = e.target.action
        let method = e.target.method.toUpperCase()

        //Hide the error message (if it's currently  shown due to a previous error)
        document.querySelector("#"+formId + " .formError").style.display = 'none'

        // Hide the success message (if it's currently shown due to a previous error)
        if(document.querySelector("#"+formId+" .formSuccess")){
        document.querySelector("#"+formId+" .formSuccess").style.display = 'none';
        }

        //turn the inputs into a payload
        let payload = {}
        const elements = e.target.elements

        //console.log('elements',elements)
        let order = {}
        for(let element of elements){
          if(element.type !== 'submit'){
            // Determine class of element and set value accordingly
            const classOfElement = typeof(element.classList.value) === 'string' &&
              element.classList.value.length > 0
              ? element.classList.value : ''

            const valueOfElement = element.type == 'checkbox' && classOfElement.indexOf('multiselect') == -1 ?
             element.checked : classOfElement.indexOf('intval') == -1 ?
              element.value : parseInt(element.value)
            const elementIsChecked = element.checked

            // Override the method of the form if the input's name is _method
            let nameOfElement = element.name

            if(nameOfElement === '_method'){
              method = valueOfElement
            } else {
              // Create an payload field named "method" if the elements name is actually httpmethod
              if(nameOfElement == 'httpmethod'){
                nameOfElement = 'method'
              }
              // Create an payload field named "id" if the elements name is actually uid
              if(nameOfElement == 'uid'){
                nameOfElement = 'id'
              }

              if(nameOfElement.indexOf('items')>-1 || nameOfElement.indexOf('subItems')>-1 ||
                nameOfElement.indexOf('sizes')>-1 || nameOfElement.indexOf('amounts')>-1){
                //receive each item of the order
                //console.log(nameOfElement,valueOfElement)
                
                if(nameOfElement.indexOf('items')>-1){
                  const len = 5
                  let idx = nameOfElement.substring(len)

                  //console.log(valueOfElement.length , nameOfElement.substring(len).length)
                  //const prop = valueOfElement.substring(0,idx)
                  
                  if(typeof(order[valueOfElement])==='undefined'){
                    order[valueOfElement] = []                    
                  }
                  order[valueOfElement].push({'number':idx})
                  //console.log(order)
                }

                if(nameOfElement.indexOf('subItems')>-1){
                  const len = 8
                  let idx = nameOfElement.substring(len)
                  //console.log(idx)                  
                  
                  for(let key in order){
                    //searching space where to store the value of subItem
                    //{"drinks":[{"number",2},{}...]}
                    let i = 0
                    for(let item of order[key]){//key: drinks
                      
                      if(item.number===idx){                        
                        //found!
                        //ask if exist the name else register it
                        if(typeof(order[key][i]['name'])==='undefined'){
                          order[key][i]['name'] = valueOfElement
                        }
                      }
                      i++
                    }
                  }
                  console.log(order)
                }

                if(nameOfElement.indexOf('sizes')>-1){
                  const len = 5
                  let idx = nameOfElement.substring(len)
                  //console.log(valueOfElement.length , nameOfElement.substring(len).length)
                  //const prop = valueOfElement.substring(0,idx)
                  
                  for(let key in order){
                    //searching space where to store the value of subItem
                    //{"drinks":[{"number",2},{}...]}
                    let i = 0
                    for(let item of order[key]){//key: drinks
                      if(item.number===idx){
                        //found!
                        //ask if the array size exist otherwise create it
                        if(typeof(order[key][i]['sizes'])==='undefined'){
                          order[key][i]['sizes']=[]                          
                        }
                        //store the value
                        order[key][i]['sizes'].push(valueOfElement)
                      }
                      i++
                    }                    
                  }
                  //console.log(order)
                }

                if(nameOfElement.indexOf('amounts')>-1){
                  const len = 7
                  let idx = nameOfElement.substring(len)
                  //console.log(valueOfElement.length , nameOfElement.substring(len).length)
                  //const prop = valueOfElement.substring(0,idx)
                  
                  for(let key in order){
                    //searching space where to store the value of subItem
                    //{"drinks":[{"number",2},{}...]}
                    let i = 0
                    for(let item of order[key]){//key: drinks
                      if(item.number===idx){
                        //found!
                        //ask if the array size exist otherwise create it
                        if(typeof(order[key][i]['amounts'])==='undefined'){
                          order[key][i]['amounts']=[]
                        }
                        //store the value
                        order[key][i]['amounts'].push(valueOfElement)
                      }
                      i++
                    }
                  }
                  //console.log(order)
                }
              }
              if(nameOfElement==='execPayment'){
                console.log('element in execPayment',element)
              }
              // If the element has the class "multiselect" add its value(s) as array elements
              else if(classOfElement.indexOf('multiselect') > -1){
                if(elementIsChecked){
                  payload[nameOfElement] = typeof(payload[nameOfElement]) === 'object' &&
                   payload[nameOfElement] instanceof Array ? payload[nameOfElement] : []
                  payload[nameOfElement].push(valueOfElement);
                }
              } else {
                //console.log('no es multiselect')
                payload[nameOfElement] = valueOfElement;
              }
            }
          }
          if(Object.keys(order).length>0){
            payload = order
            //console.log('payload',payload)
          }
        }
        
        

        // If the method is DELETE, the payload should be a queryStringObject instead
        const queryStringObject = method === 'DELETE' ? payload : {}

        // Call the API
        app.client.request(undefined,path,method,queryStringObject,payload,(statusCode,responsePayload)=>{
          // Display an error on the form if needed
          if(statusCode !== 200){

            if(statusCode == 403){
              // log the user out
              app.logUserOut()

            } else {

              // Try to get the error from the api, or set a default error message
              const error = typeof(responsePayload.Error) == 'string' ? responsePayload.Error : 'An error has occured, please try again';

              // Set the formError field with the error text
              document.querySelector("#"+formId+" .formError").innerHTML = error;

              // Show (unhide) the form error field on the form
              document.querySelector("#"+formId+" .formError").style.display = 'block';
            }
          } else {
            // If successful, send to form response processor
            app.formResponseProcessor(formId,payload,responsePayload);
          }
        })
      })
    }
  }
}


// Form response processor
app.formResponseProcessor = (formId,requestPayload,responsePayload)=>{
  let functionToCall = false
  //if account creation was successful, try to immediately  log the user in
  if(formId == 'accountCreate'){
      //take the form and password, and use it to log the user in
      const newPayload = {
          'email':requestPayload.email,
          'password':requestPayload.password
      }

      app.client.request(undefined,'api/tokens','POST',undefined,newPayload,(newStatusCode,newResponsePayload)=>{
          //display the error on the form if needed
          if(newStatusCode!==200){
              //set the formError field  with the error test
              document.querySelector("#"+formId+" .formError").innerHTML = "Sorry,an error has occurred. Please try again"

              // Show (unhide) the form error field on the form
              document.querySelector("#"+formId+" .formError").style.display = 'block'
          }else{
              // If successful, set the token and redirect the user
              app.setSessionToken(newResponsePayload)
              window.location = '/'//'/checks/all'
          }
      })
  }
  // If login was successful, set the token in localstorage and redirect the user
  if(formId == 'sessionCreate'){
      app.setSessionToken(responsePayload)
      window.location = '/orders/create'//checks/all
  }

  // If forms saved successfully and they have success messages, show them
 const formsWithSuccessMessages = ['accountEdit1', 'accountEdit2','checksEdit1'];
 if(formsWithSuccessMessages.indexOf(formId) > -1){
     document.querySelector("#"+formId+" .formSuccess").style.display = 'block';
 }

 //if the user just deleted their account , redirect them to the account-delete page
 if(formId==='accountEdit3'){
   app.logUserOut(false)
   window.location = '/account/deleted'
 }

  // // If the user just created a new check successfully, redirect back to the dashboard
  // if(formId == 'checksCreate'){
  //   window.location = '/checks/all';
  // }

  // // If the user just deleted a check, redirect them to the dashboard
  // if(formId == 'checksEdit2'){
  //   window.location = '/checks/all';
  // }
  if(formId === 'ordersCreate'){
    app.config.orderId = responsePayload.id
    const orderIdString = JSON.stringify(responsePayload.id)
    const price = JSON.stringify(responsePayload.price)
    localStorage.setItem('orderId',orderIdString)
    localStorage.setItem('price',price)
    window.location = '/orders/payment/exec'
    //console.log(formId,requestPayload,responsePayload)
  }
}

// Get the session token from localstorage and set it in the app.config object
app.getSessionToken = ()=>{
  const tokenString = localStorage.getItem('token')     
  if(typeof(tokenString) == 'string'){
    try{
      const token = JSON.parse(tokenString)
      app.config.sessionToken = token
      if(typeof(token) == 'object'){
        app.setLoggedInClass(true)
      } else {
        app.setLoggedInClass(false)
      }
    }catch(e){
      app.config.sessionToken = false
      app.setLoggedInClass(false)
    }
  }
}

// Set (or remove) the loggedIn class from the body
app.setLoggedInClass = add=>{
  const target = document.querySelector("body")
  if(add){
    target.classList.add('loggedIn')
  } else {
    target.classList.remove('loggedIn')
  }
}

// Set the session token in the app.config object as well as localstorage
app.setSessionToken = token => {
  app.config.sessionToken = token
  const tokenString = JSON.stringify(token)
  localStorage.setItem('token',tokenString)
  if(typeof(token) === 'object'){
    app.setLoggedInClass(true)
  } else {
    app.setLoggedInClass(false)
  }
}

// Renew the token
app.renewToken = callback => {
  const currentToken = typeof(app.config.sessionToken) === 'object' ? app.config.sessionToken : false;
  if(currentToken){
    // Update the token with a new expiration
    var payload = {
      'id' : currentToken.id,
      'extend' : true,
    }
    app.client.request(undefined,'api/tokens','PUT',undefined,payload,function(statusCode,responsePayload){
      // Display an error on the form if needed
      if(statusCode == 200){
        // Get the new token details
        var queryStringObject = {'id' : currentToken.id};
        app.client.request(undefined,'api/tokens','GET',queryStringObject,undefined,function(statusCode,responsePayload){
          // Display an error on the form if needed
          if(statusCode == 200){
            app.setSessionToken(responsePayload);
            callback(false);
          } else {
            app.setSessionToken(false);
            callback(true);
          }
        });
      } else {
        app.setSessionToken(false);
        callback(true);
      }
    });
  } else {
    app.setSessionToken(false);
    callback(true);
  }
}

// Load data on the page
app.loadDataOnPage = ()=>{
  // Get the current page from the body class
  const bodyClasses = document.querySelector("body").classList
  const primaryClass = typeof(bodyClasses[0]) === 'string' ? bodyClasses[0] : false

  // Logic for account settings page
  if(primaryClass === 'accountEdit'){
    app.loadAccountEditPage()
  }
  // // Logic for dashboard page
  // if(primaryClass === 'checksList'){
  //   app.loadChecksListPage()
  // }
  // // Logic for check details page
  // if(primaryClass == 'checksEdit'){
  //   app.loadChecksEditPage();
  // }
  //logic for order template
  if(primaryClass==='ordersCreate'){
    app.loadItems()
  }
  if(primaryClass==='execPayment'){
    app.loadPaymentInputs()
  }
}

app.loadItems = () => {
  
  //(headers,path,method,queryStringObject,payload,callback)
  const email = typeof(app.config.sessionToken.email) === 'string' ? 
  app.config.sessionToken.email : false

  if(email){
    // Fetch the user data
    const queryStringObject = {
      'email' : email
    }
    app.client.request(undefined,'api/items','GET',queryStringObject,undefined,(statusCode,responsePayload)=>{
      
      if(statusCode == 200){
        app.config.base = responsePayload
        ////////////////////////
        const base = app.config.base
        
         document.getElementById("addItem").addEventListener("click", e => {      
      
          let options = ''
          for(let item in base){
            options += `<option value="${item}">${item}</option>`
          }
          let content = `
          <div class="inputLabel">#${app.config.count+1}</div>
          <select name = "items${app.config.count}" id = "items${app.config.count}">
            ${options}
          </select>
      
          <div class="inputLabel">Pizza</div>
          <select name = "subItems${app.config.count}" id = "subItems${app.config.count}"></select>
      
          <div class="inputLabel" id="inputLabel${app.config.count}">Size</div>
          <select name="sizes${app.config.count}" id = "sizes${app.config.count}"></select>
      
          <div class="inputLabel" >amount</div>
          <input name="amounts${app.config.count}" id="amounts${app.config.count}" placeholder="number of units"/>
          `
      
          let typeOfElement = 'DIV'
          let classOfElement = 'inputWrapper'
          let id = `inputWrapper${app.config.count}`
          
          app.addNewElement('ordersCreate',content,typeOfElement,classOfElement,id,null)
      
          document.getElementById(`items${app.config.count}`).addEventListener('change',e=>{
            const selectedItem = e.target.id[5]
            
            const container = `subItems${selectedItem}`
      
            id = container
            app.removeAllChildItems(id)
            app.removeAllChildItems(`sizes${selectedItem}`)
            document.getElementById(`amounts${selectedItem}`).value = ""
      
            const valueOfItem = event.target.value
            app.config.base[valueOfItem].forEach(valueOfSubItem => {
              typeOfElement = 'OPTION'
              classOfElement = null
              id = null
              name = null
              app.addNewElement(container,valueOfSubItem.name,typeOfElement,classOfElement,id,name)        
            })
          })
      
          document.getElementById(`subItems${app.config.count}`).addEventListener('change',e=>{
            const selectedSubItemId = e.target.id[8]      
            const container = `sizes${selectedSubItemId}`
      
            id = container
            app.removeAllChildItems(id)
          
            const valuesOfSubItem = event.target.value //mozarella, coca cola,etc
            const item = document.getElementById(`items${selectedSubItemId}`).value
            let sizes = []
            app.config.base[item].forEach(subItem=>{
              if(subItem.name===valuesOfSubItem){
                sizes = subItem.sizes          
              }
            })
      
            sizes.forEach(size=>{
              typeOfElement = 'OPTION'
              classOfElement = null
              id = null
              name = null
              app.addNewElement(container,size,typeOfElement,classOfElement,id,name)
            })
          })
          
          app.config.count++
        })
        ////////////////////////
      } else {
        // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)        
        app.logUserOut()
      }
    })
  } else {
    app.logUserOut()
  }
}

app.addNewElement = (container,content,typeOfElement,classOfElement,id,name) => {
  
  const node = document.createElement(typeOfElement)
  node.className = classOfElement
  node.setAttribute("id",id)
  node.name = name!==null ? name:""  
  if(typeOfElement==='OPTION'){
    node.text= content
    node.value= content
  }else{
    node.innerHTML = content
  }
  
  const lista = document.getElementById(container)
  //lista.appendChild(input)
  lista.appendChild(node)
}

app.removeAllChildItems = elementId => {
  var ele = document.getElementById(elementId);
  while (ele.hasChildNodes()) {
      ele.removeChild(ele.firstChild);
  }
}

// Load the account edit page specifically
app.loadAccountEditPage = ()=>{
  // Get the phone number from the current token, or log the user out if none is there
  const email = typeof(app.config.sessionToken.email) === 'string' ? 
  app.config.sessionToken.email : false

  if(email){
    // Fetch the user data
    const queryStringObject = {
      'email' : email
    }
    app.client.request(undefined,'api/users','GET',queryStringObject,undefined,(statusCode,responsePayload)=>{
      
      if(statusCode == 200){
        // Put the data into the forms as values where needed
        document.querySelector("#accountEdit1 .firstNameInput").value = responsePayload.firstName
        document.querySelector("#accountEdit1 .lastNameInput").value = responsePayload.lastName
        document.querySelector("#accountEdit1 .displayEmailInput").value = responsePayload.email
        document.querySelector("#accountEdit1 .streetAddressInput").value = responsePayload.streetAddress

        // Put the hidden phone field into both forms
        const hiddenEmailInputs = document.querySelectorAll("input.hiddenEmailInput")
        for(let hiddenEmailInput of hiddenEmailInputs){
            hiddenEmailInput.value = responsePayload.email;
        }

      } else {
        // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)
        app.logUserOut();
      }
    })
  } else {
    app.logUserOut();
  }
}

//load the dashboard page specifically
// app.loadChecksListPage = ()=>{
//   // Get the phone number from the current token, or log the user out if none is there
//   const phone = typeof(app.config.sessionToken.phone) == 'string' ? app.config.sessionToken.phone : false
//   if(phone){
//     // Fetch the user data
//     const queryStringObject = {
//       'phone' : phone
//     }
//     app.client.request(undefined,'api/users','GET',queryStringObject,undefined,(statusCode,responsePayload)=>{
//       if(statusCode == 200){

//         // Determine how many checks the user has
//         const allChecks = typeof(responsePayload.checks) == 'object' &&
//          responsePayload.checks instanceof Array &&
//          responsePayload.checks.length > 0 ? responsePayload.checks : []
        
//         if(allChecks.length > 0){

//           // Show each created check as a new row in the table
//           allChecks.forEach(checkId=>{
//             // Get the data for the check
//             const newQueryStringObject = {
//               'id' : checkId
//             }
//             app.client.request(undefined,'api/checks','GET',newQueryStringObject,undefined,(statusCode,responsePayload)=>{
//               if(statusCode == 200){
//                 const checkData = responsePayload;
//                 // Make the check data into a table row
//                 const table = document.getElementById("checksListTable")
//                 const tr = table.insertRow(-1)
//                 tr.classList.add('checkRow')
//                 const td0 = tr.insertCell(0)
//                 const td1 = tr.insertCell(1)
//                 const td2 = tr.insertCell(2)
//                 const td3 = tr.insertCell(3)
//                 const td4 = tr.insertCell(4)
//                 td0.innerHTML = responsePayload.method.toUpperCase()
//                 td1.innerHTML = responsePayload.protocol+'://'
//                 td2.innerHTML = responsePayload.url
//                 const state = typeof(responsePayload.state) === 'string' ? responsePayload.state : 'unknown'
//                 td3.innerHTML = state
//                 td4.innerHTML = '<a href="/checks/edit?id='+responsePayload.id+'">View / Edit / Delete</a>'
//               } else {
//                 console.log("Error trying to load check ID: ",checkId);
//               }
//             })
//           })

//           if(allChecks.length < 5){
//             // Show the createCheck CTA
//             document.getElementById("createCheckCTA").style.display = 'block';
//           }

//         } else {
//           // Show 'you have no checks' message
//           document.getElementById("noChecksMessage").style.display = 'table-row';

//           // Show the createCheck CTA
//           document.getElementById("createCheckCTA").style.display = 'block';

//         }
//       } else {
//         // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)
//         app.logUserOut();
//       }
//     })
//   } else {
//     app.logUserOut();
//   }
// }

// Load the checks edit page specifically
// app.loadChecksEditPage = ()=>{
//   // Get the check id from the query string, if none is found then redirect back to dashboard
//   const id = typeof(window.location.href.split('=')[1]) == 'string' && window.location.href.split('=')[1].length > 0 ? window.location.href.split('=')[1] : false
//   if(id){
//     // Fetch the check data
//     const queryStringObject = {
//       'id' : id
//     }
//     app.client.request(undefined,'api/checks','GET',queryStringObject,undefined,(statusCode,responsePayload)=>{
//       if(statusCode == 200){

//         // Put the hidden id field into both forms
//         const hiddenIdInputs = document.querySelectorAll("input.hiddenIdInput")
//         for(var i = 0; i < hiddenIdInputs.length; i++){
//             hiddenIdInputs[i].value = responsePayload.id;
//         }

//         // Put the data into the top form as values where needed
//         document.querySelector("#checksEdit1 .displayIdInput").value = responsePayload.id;
//         document.querySelector("#checksEdit1 .displayStateInput").value = responsePayload.state;
//         document.querySelector("#checksEdit1 .protocolInput").value = responsePayload.protocol;
//         document.querySelector("#checksEdit1 .urlInput").value = responsePayload.url;
//         document.querySelector("#checksEdit1 .methodInput").value = responsePayload.method;
//         document.querySelector("#checksEdit1 .timeoutInput").value = responsePayload.timeoutSeconds;
//         let successCodeCheckboxes = document.querySelectorAll("#checksEdit1 input.successCodesInput");
//         for(var i = 0; i < successCodeCheckboxes.length; i++){
//           if(responsePayload.successCodes.indexOf(parseInt(successCodeCheckboxes[i].value)) > -1){
//             successCodeCheckboxes[i].checked = true;
//           }
//         }
//       } else {
//         // If the request comes back as something other than 200, redirect back to dashboard
//         window.location = '/checks/all';
//       }
//     })
//   } else {
//     window.location = '/checks/all';
//   }
// }

// Loop to renew token often
app.tokenRenewalLoop = ()=>{
  setInterval(()=>{
    app.renewToken(err=>{
      if(!err){
        console.log("Token renewed successfully @ "+Date.now());
      }
    })
  },1000 * 60)
}

//
app.loadPaymentInputs = () => {
  const amount = parseInt(localStorage.getItem('price'))*100
    // document.getElementById('paymentData').setAttribute("data-amount",amount)
    // console.log(document.getElementById('paymentData'))
  const handler = StripeCheckout.configure({
      key: 'pk_test_4dCE4rB2c8IAXeqiKm42Wggg',
      image: 'https://stripe.com/img/documentation/checkout/marketplace.png',
      locale: 'auto',
      token: token => {
        console.log('token returned',token)
      // You can access the token ID with `token.id`.
      // Get the token ID to your server-side code for use.
      ////////////////////      
        // Prevent user from leaving page
        window.onbeforeunload = () => {
                return ""
        }
        const formId = "execPayment"
        const orderId = JSON.parse(localStorage.getItem('orderId'))
        const tokenPayment = token.id
        app.client.request(undefined,'orders/payment/confirmed','POST',{'orderId':orderId},{'tokenPayment':tokenPayment},(newStatusCode,newResponsePayload)=>{
          //display the error on the form if needed
          if(newStatusCode!==200){
              //set the formError field  with the error test
              document.querySelector("#"+formId+" .formError").innerHTML = "Sorry,an error has occurred. Please try again"

              // Show (unhide) the form error field on the form
              document.querySelector("#"+formId+" .formError").style.display = 'block'
          }else{
            // If successful, set the token and redirect the user
            document.querySelector("#"+formId+" .formSuccess").style.display = 'block'
            document.getElementById("paymentData").disabled =true
            document.getElementById("paymentData").style.visibility = 'hidden'//"visible"
            //app.setSessionToken(newResponsePayload)
            //window.location = '/checks/all'
          }
        })
      }
  })
  document.getElementById('paymentData').addEventListener('click', e => {
      // Open Checkout with further options:
      handler.open({
      name: 'eum602',
      description: 'Orders for delivery',
      amount: amount
      })
      e.preventDefault()
  })
  
  // Close Checkout on page navigation:
  window.addEventListener('popstate', () => {      
      handler.close()      
  })
}


// Init (bootstrapping)
app.init = ()=>{
  // Bind all form submissions
  app.bindForms()

  // Bind logout logout button
  app.bindLogoutButton()

  // Get the token from localstorage
  app.getSessionToken()

   //Renew token
  app.tokenRenewalLoop()

  //Load data on page
  app.loadDataOnPage()
 }
 // Call the init processes after the window loads
window.onload = ()=>{
app.init()
}
 