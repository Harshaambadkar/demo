/*
 * Request Handlers
 *
 */

// Dependencies
var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');

// Define all the handlers
var handlers = {};

// Ping
handlers.ping = function(data,callback){
    callback(200);
};

// Not-Found
handlers.notFound = function(data,callback){
  callback(404);
};

// Users
handlers.users = function(data,callback){
  var acceptableMethods = ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._users[data.method](data,callback);
  } else {
    callback(405);
  }
};

// Container for all the users methods
handlers._users  = {};

// Users - post
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = function(data,callback){
  // Check that all required fields are filled out
  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

  if(firstName && lastName && phone && password && tosAgreement){
    // Make sure the user doesnt already exist
    _data.read('users',phone,function(err,data){
      if(err){
        // Hash the password
        var hashedPassword = helpers.hash(password);
        console.log("hashedPassword: "+hashedPassword);
        // Create the user object
        if(hashedPassword){
          var userObject = {
            'firstName' : firstName,
            'lastName' : lastName,
            'phone' : phone,
            'hashedPassword' : hashedPassword,
            'tosAgreement' : true
          };

          // Store the user
          _data.create('users',phone,userObject,function(err){
            if(!err){
              callback(200);
            } else {
              console.log(err);
              callback(500,{'Error' : 'Could not create the new user'});
            }
          });
        } else {
          callback(500,{'Error' : 'Could not hash the user\'s password.'});
        }

      } else {
        // User alread exists
        callback(400,{'Error' : 'A user with that phone number already exists'});
      }
    });

  } else {
    callback(400,{'Error' : 'Missing required fields'});
  }

};

//Users -get
//Required data:phone
//Optional data:none
//@TODO Only let an authenticated user access their object.Dont let them access anyone
handlers._users.get=function(data,callback){
//Check that phone numbaer is valid 	
var phone=typeof(data.qso.phone)=='string' && data.qso.phone.trim().length == 10 ? data.qso.phone.trim() : false;
	if(phone){
		//look up the user
		_data.read('users',phone,function(err,data){
			if(!err && data){
				//Remove the hashpassword from the user object before it returning it to the requester
				delete data.hashedPassword;
				callback(202,data);
			}else{
				callback(404);
			}
		});
	}else{
		callback(400,{'Error':'Missing required field'});
	}
}

//Users -put
//Required data:phone
//Optional data :firstname, lastname,password(at least one must bre specified)
//@TODO Only let an authenticated user update their own object.Dont let them update anyone else's
handlers._users.put=function(data,callback){
 //Check for the required field 
 var phone=typeof(data.payload.phone)=='string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

 //Check for optional field
 var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
 var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
 var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

 //Error if the phone is invalid 
 if(phone){
	//Error if nothing is send to update 
	if (firstName || lastName || password) {
		//look up user
		_data.read('users',phone,function(err,userData){
			if(!err && userData){
				//Update the fields necessary
				if(firstName){
					userData.firstName=firstName;
				}
				if(lastName){
					userData.lastName=lastName;
				}
				if(password){
					userData.hashedPassword=helpers.hash(password);
				}
				//Store the new updates
				_data.update('users',phone,userData,function(err){
					if(!err){
						callback(200);
					}else{
						console.log(err);
						callback(500,{'Error':'Could not update the user'})
					}
				});

			}else{
				callback(400,{'Error':'Specified user doesnot exists'});
			}
		});
	}else{
		callback(400,{'Error':'Missingfields to update'});
	}
 }else{
	callback(400,{'Error':'Missing required field'})
	}

}


//Users - delete
//Required fields:phone
//@TODO only let an authenticated user delete their object .Dont let them delete anyone eleses
//@TODO cleanup (delete) any other data file associated with this user
handlers._users.delete=function(data,callback){
	//Check that phone numbaer is valid 	
	var phone=typeof(data.qso.phone)=='string' && data.qso.phone.trim().length == 10 ? data.qso.phone.trim() : false;
	if(phone){
		//look up the user
		_data.read('users',phone,function(err,data){
			if(!err && data){
				
				_data.delete('users',phone,function(err,data){
					if(!err){
						callback(200);
					}else{
						callback(500,{'Error':'could not delete specified user'})
					}
				});

			}else{
				callback(404,{'Error':'could not find the specified user'});
			}
		});
	}else{
		callback(400,{'Error':'Missing required field'});
	}

}

// Tokens
handlers.tokens = function(data,callback){
  var acceptableMethods = ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._tokens[data.method](data,callback);
  } else {
    callback(405);
  }
};
//containers for all tokens methods
handlers._tokens={};

//Tokens - post 
//Required data:phone ,password
//optional data:none
handlers._tokens.post=function(data,callback){

	 var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  	 var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
 	 	if(phone && password){
  		//Lookup the user who matches that phone number
  		_data.read('users',phone,function(err,userData){
  			if(!err && userData){
  				//hash the sent password, compare it to the password stored in the users  object
  				var hashedPassword=helpers.hash(password);
  				if(hashedPassword==userData.hashedPassword){
  					//If valid, create new token with a random name. Set expiration date 1 hourin future
  					var tokenId=helpers.createRandomString(20);
  					var expires=Date.now()+1000*60*60;
  					var tokenObject={
  						'phone': phone,
  						'id': tokenId,
  						'expires': expires
  					};
  					//Store the token
  					_data.create('tokens',tokenId,tokenObject,function(err){
  						if(!err){
  							callback(200,tokenObject);
  						}else{
  							callback(500,{'Error':'could not create the new token'});
  						}
  					});  
  				}else{
  					callback(400,{'Error':'password did not match the specified users stored password '});
  				}
  			}else{
  				callback(400,{'Error':'could not find the specified user'});
  			}

  		  });
  		}
};

//Tokens - get 
handlers._tokens.get=function(data,callback){
console.log(data.qso.tid);
	 //Check that id is valid 	
	 var id=typeof(data.qso.tid)=='string' && data.qso.tid.trim().length == 20 ? data.qso.tid.trim() : false;
	 if(id){
		//look up the token
		_data.read('tokens',id,function(err,tokenData){
			if(!err && tokenData){
				
				callback(202,tokenData);
			}else{
				callback(404);
			}
		});
	}else{
		callback(400,{'Error':'Missing required fields '});
	}
};

//Tokens - put 
//Required data:id extend
//Optional data:none
handlers._tokens.put=function(data,callback){
   var id = typeof(data.payload.tid) == 'string' && data.payload.tid.trim().length == 20 ? data.payload.tid.trim() : false;
   var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
   if(id && extend){
      //Lookup the token
      _data.read('tokens',id,function(err,tokenData){
        if(!err && tokenData){
          // Check to the make sure the token isnt already expired
          if(tokenData.expires > Date.now()){
            //Set the expiration an hour from now
            tokenData.expires=Date.now() + 1000 * 60 * 60;

            //Store the new updates
            _data.update('tokens',id,tokenData,function(err){
              if(!err){
                callback(200);
              }else{
                callback(500,{'Error':'Could not update the token\'s expiration  '})
              }
            });
          }else{
              callback(400,{'Error':'Token has already expired'});        
          }
        }else{
          callback(400,{'Error':'Missing required fields or fields are invalid'});      
        }

      });
   }else{
    callback(400,{'Error':'Missing required fields or fields are invalid'});
  }

};

//Tokens - delete 
handlers._tokens.delete=function(data,callback){

};


// Tokens
handlers.checks = function(data,callback){
  var acceptableMethods = ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._checks[data.method](data,callback);
  } else {
    callback(405);
  }
};
//containers for all checks methods
handlers._checks={};

//Checks : post
//Required data: protocol,url,method,successCodes,timeoutSeconds
//Optional data:none

handlers._checks.post=function(data,callback){
  //Validate inputs
   var protocol = typeof(data.payload.protocol) == 'string' &&  ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
   var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
   var method = typeof(data.payload.method) == 'string' &&  ['post','put','get','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
   var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array  && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
   var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds<=5  ? data.payload.timeoutSeconds : false;

   if(protocol && url && method && successCodes && timeoutSeconds){
    //Get the token from headers
    var token=typeof(data.headers.token)=='string' ? data.headers.token : false;

    //Lookup the user by reading the token
    _data.read('tokens',token,function(err,tokenData){
      if(!err && tokenData){
        var userPhone=tokenData.phone;

        //Lookup the user data
        _data.read('users',userPhone,function(err,userData){
          if(!err && userData){
            var userChecks=typeof(userData.checks)=='object' && userData.checks instanceof Array ? userData.checks : [];
            //verify that the user has less than the number of max-checks-per-user
            if(userChecks.length < config.maxChecks){
                //Create a random id for checks 
                var checkId=helpers.createRandomString(20);

                //Create the check object, and include the user phone.
                var checkObject={
                  'id' : checkId,
                  'userPhone' : userPhone,
                  'protocol' : protocol,
                  'url': url,
                  'method':method,
                  'successCodes':successCodes,
                  'timeoutSeconds':timeoutSeconds
                };
                //Save the object
                _data.create('checks',checkId,checkObject,function(err){
                  if(!err){
                    //Add the check id to the users object
                    userData.checks=userChecks;
                    userData.checks.push(checkId);
                    //Save the new user data
                    _data.update('users',userPhone,userData,function(err){
                      if(!err){
                        //Return the data about the new check
                        callback(200,checkObject);
                      }else{
                        callback(500,{'Error':'Coudnot update the user with new check'});
                      }
                    });

                  }else{
                    callback(500,{'Error':'Could not create the new check'});
                  }
                });
            }else{
              callback(400,{'Error' : 'The user already has the maximum number of checks ('+config.maxChecks+')'});
            }
          }else{
            callback(403);
          }
        });
      }else{
        callback(403)
      }
    });

   }else{
     callback(400,{'Error' : 'Missing required inputs Or inputs are invalid'});
   }
} 


//export the module
module.exports=handlers                                                                                                       