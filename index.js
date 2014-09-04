var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var app = express();

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
  extended: false,
}));

app.get('/', function(req, res) {
  res.sendfile('www/index.html');
});

app.post('/', function(req, res) {
  // parse given target url
  var targetUrl = req.body.targetUrl;
  console.log("targetUrl:", targetUrl);

  // fetch target url
  http.get(targetUrl, function(res) {
    console.log("Fetching:", targetUrl);
    console.log("GET Status:", res.statusCode);

    // collectData(res, function(data) {
    //   console.log(data);
    // });

  }).on('error', function(e) {
    console.log("Error retrieving:", targetUrl);
    console.log("Error:", e.message);
  });

  var events = [];
  res.send(200, events);
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
});

// collect data chunks
function collectData(res, callback) {
  var data = ''
  res.on('data', function(chunk) {
    data += chunk;
  });
  res.on('end', function() {
    callback(data);
  });
};
