var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var cheerio = require('cheerio');
var app = express();

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
  extended: false,
}));

// display targetUrl input form
app.get('/', function(req, res) {
  res.sendfile('www/index.html');
});

// extract sibling events of targetUrl
app.post('/', function(req, res) {
  // parse given target url
  var targetUrl = req.body.targetUrl;
// TODO remove debugging
// targetUrl = "http://calendar.boston.com/lowell_ma/events/show/274127485-mrt-presents-shakespeares-will";
// targetUrl = "http://www.sfmoma.org/exhib_events/exhibitions/513";
// targetUrl = "http://www.workshopsf.org/?page_id=140&id=1328";
// targetUrl = "http://events.stanford.edu/events/353/35309/";
console.log("targetUrl:", targetUrl);

  // fetch target url
  http.get(targetUrl, function(getRes) {
    // successful fetch of url
    console.log("Fetch succeeded:", targetUrl);

    // receive page contents and parse for links
    collectData(getRes, function(data) {
      // parse all links from page
      var links = parseLinks(data);

      // filter out extraneous links
      links = filterLinks(links, targetUrl);

      // respond with final links
      res.send(200, links);
    });
  }).on('error', function(e) {
    // error while fetching url
    console.log("Fetch failed:", targetUrl);
    console.log(">> Error:", e.message);

    // respond with error
    res.send(400, e.message);
  });
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
    return callback(data);
  });
};

// parse links
function parseLinks(html) {
  $ = cheerio.load(html);
  var links = $('a');

  var linkStore = {};
  for (var i = 0; i < links.length; i++) {
    linkStore[links[i].attribs.href] = false;
  }

  return linkStore;
}

// filter links based on potential base pattern
function filterLinks(links, basePattern) {
  // strip off domain
  var partial = basePattern.replace(/^https?:\/\/.*?\//, '/');
  console.log("partial:", partial);

  console.log("===== FILTERING LINKS =====");
  var filtered = [];
// TODO remove debugging sanity check
var loopCount = 0;
  while (filtered.length < 10 && partial.length > 0 && loopCount < 10) {
// TODO remove debugging sanity check
console.log("loopCount:", loopCount);

    // save any links that match truncated pattern
    for (var key in links) {
console.log("checking key:", key);
      if (key.match(partial)) {
console.log("MATCH DETECTED");
console.log("key:", key);
        filtered.push(key);
      }
    }

    // truncate pattern if ending seems to be a numerical id
    if (partial.match(/\/[^\/]*?\d+?[^\/]*?$/)) {
console.log("pre partial:", partial);
      partial = partial.replace(/\/[^\/]*?\d+?[^\/]*?$/, '');
console.log("post partial:", partial);
    } else {
      break;
    }

// TODO remove debugging
// sanity check to abort inifinite loops
loopCount++;
  }

  return filtered;
}
