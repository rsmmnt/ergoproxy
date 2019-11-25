var express = require('express')
var app = express()
var bodyParser = require('body-parser')
var http = require('http').Server(app)
const request = require('request');
var bigiparser = require('json-bigint');
var BigNumber = require('bignumber.js');
var blockdata = "";
var parsed;
var shareCount  = 0;
//OPTIONS:
// poolB = poolMult*realB
var poolMult = 200;
//node address
var addr = "http://88.198.13.202:9052";
//serverport
var serverport = 36217;

var nodeaddr = addr + "/mining/candidate";
var nodeaddr_post = addr + "/mining/solution";
//require('request').debug = true
var syncer = function()
{
    request(nodeaddr, { json: false }, (err, res, body) => {
     if (err) { return console.log(err); }
     //console.log(body);
     
     if(blockdata !== body)
     {
         console.log(body);
         parsed = bigiparser.parse(body);
         console.log(parsed);
     }
     
     blockdata = body;
     
    });
};


app.get('/mining/candidate', function(req,res)
{
    res.contentType("application/json");
    var tmpparsed = bigiparser.parse(bigiparser.stringify(parsed));
    tmpparsed.b = tmpparsed.b.multipliedBy(poolMult).toString(10);
    res.send(tmpparsed);
});

app.post('/mining/solution', function(req,res)
{
    
    shareDiff = parsed.b.multipliedBy(poolMult);
    var bodyStr = '';
    var postResponse;
    req.on("data",function(chunk){
        bodyStr += chunk.toString();
    });
    req.on("end",function(){
    
    console.log(bodyStr);
    
    var postparsed = bigiparser.parse(bodyStr);
    postparsed.d = new BigNumber(postparsed.d);
    //console.log(postparsed);
    var resp;
    if(postparsed.d.isLessThan(shareDiff))
    {
        //res.send("Share accepted");
	resp+="Share accepted";
	console.log("Share accepted");
        shareCount += 1;
        console.log("Shares " + shareCount);
    }
    

    if(parsed.b.isLessThan(postparsed.d))
    {
        res.send(resp + " D is not less than bound");
        res.end();
    }
    else{
    //   console.log(req)
    require('request').debug = true
    request({
        url: nodeaddr_post,
        method: "POST",
        body: bodyStr,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
	 }
    }, function (error, response, body){
        //console.log(body);
        //console.log(response.body);
        postResponse = body;
        console.log(postResponse);
	res.send(resp+postResponse);
	res.end();
    });
		
    require('request').debug = false;		
    
   }});
    
	
});

setInterval(syncer,1000);

http.listen( serverport, "0.0.0.0", function () {
    console.log(' Listening on ' + serverport)
  })
