var http=require('http');
var https=require('https');
var url=require('url');
var string_decoder=require('string_decoder').StringDecoder;
var config=require('./lib/config');
var fs=require('fs');
var handlers=require('./lib/handlers');
var helpers=require('./lib/helpers');

// instantiating http server
var httpServer=http.createServer(function(req,res){	
	unifiedserver(req,res);
	
});

//start the http server and have it listen on port 3000
httpServer.listen(config.httpPort,function(){
	console.log("server is listening on port "+ config.httpPort+" in "+ config.envName);
});

// instantiating http server
var httpsServerOption={
	"key":fs.readFileSync('./https/key.pem'),
	"cert":fs.readFileSync('./https/cert.pem'),
};
var httpsServer=https.createServer(httpsServerOption,function(req,res){
	
	unifiedserver(req,res);
	
});

//start the http server and have it listen on port 3000
httpsServer.listen(config.httpsPort,function(){
	console.log("server is listening on port "+ config.httpsPort+" in "+ config.envName);
});

//all the server logic for both http and https server
var unifiedserver=function(req,res){
	
	//get the url and parse it
	var parsedurl=url.parse(req.url,true);
	
	//get the pathname
	var path=parsedurl.pathname;
	var trimmedpath=path.replace(/^\/+|\/+$/g,'');
	
	//get the http method
	var method=req.method.toLowerCase();
	
	// get query string parameter
	var qs=parsedurl.query;
	
	//get the headers as an object
	var headers=req.headers;
	
	//get the payload if any
	var decoder=new string_decoder('utf-8');
	var buffer='';
	req.on('data',function(data){
		buffer+=decoder.write(data);
	});
	req.on('end',function(){
		buffer +=decoder.end();
		
	//choose the handler this request should go to, if one is not found go notFound handler	
	var chosenHandler=typeof(router[trimmedpath])!=='undefined' ? router[trimmedpath] : handlers.notFound;
	//construct the data object to send to the handler

	var data={
		'trimmedpath':trimmedpath,
		'qso':qs,
		'method':method,
		'headers':headers,
		'payload':helpers.parseJsonToObject(buffer)
	}
	
	//Route the request to handler specified in the router
	chosenHandler(data,function(statusCode,payload){
		//use the statuscode called back by handlers,or default to 200
		statusCode=typeof(statusCode)=='number' ? statusCode : 200;
		//use the payload called back by the handler ,or default to an empty object
		payload=typeof(payload)=='object' ? payload : {};
		
		//convert the payload to a string
		var payloadString=JSON.stringify(payload);
			
			//return the response
			res.setHeader('content-type','application/json');
			res.writeHead(statusCode);
			res.end(payloadString);
			//log req path
			
	console.log("return response ",statusCode,payloadString);
	  });
	
	});
	
};


//define request router
var router={
	'ping':handlers.ping,
	'hello':handlers.hello,
	'users':handlers.users,
	'tokens':handlers.tokens,
	'checks':handlers.checks
};