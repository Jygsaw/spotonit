var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var https = require('https');
var cheerio = require('cheerio');
var app = express();

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
  extended: false,
}));

// display startUrl input form
app.get('/', function(req, res) {
  res.sendfile('www/index.html');
});

// extract sibling events of startUrl
app.post('/', function(req, res) {
  // parse given target url
  var startUrl = req.body.startUrl;
// TODO remove debugging
// startUrl = "http://calendar.boston.com/lowell_ma/events/show/274127485-mrt-presents-shakespeares-will";
// startUrl = "http://www.sfmoma.org/exhib_events/exhibitions/513";
// startUrl = "http://www.workshopsf.org/?page_id=140&id=1328";
// startUrl = "http://events.stanford.edu/events/353/35309/";
// console.log("========== startUrl:", startUrl, "==========");

  // initialize link store for coordinating data between asynch http requests
  var linkStore = {
    visited: {},
    events: {},
  };
  linkStore.visited[startUrl] = false;

  // start web crawler using startUrl
  crawlLinks(linkStore,
    function(data) {
      // respond with final links if extract succeeded
      res.send(200, Object.keys(data.events));
    },
    function(err) {
      // respond with error if extract failed
      res.send(400, err.message);
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
function parseLinks(html, baseUrl) {
  $ = cheerio.load(html);
  var links = $('a');

  var storage = {
    visited: {},
    events: {},
  }
  for (var i = 0; i < links.length; i++) {
    var link = links[i].attribs.href;
    if (link) {
      // TODO need to optimize baseUrl prepending and url validation
      // prepending baseUrl if relative link
      if (!link.match(/^[^:]+?:/)) {
        link = baseUrl + link;
      }

      // saving link only if valid and from same domain
      if (link.match(baseUrl)) {
        if (validateUrl(link)) {
          storage.visited[link] = storage.visited[link] || false;
        }

        // saving link if event
        if (isEvent(link, baseUrl)) {
          storage.events[link] = storage.events[link] || true;
        }
      }
    }
  }

  return storage;
}

// url validation function
function validateUrl(textval) {
  // TODO need to find better way to validate urls
  // NOTE regex barfs on urls with lots of dashes
  var urlregex = new RegExp(
    "^(http|https|ftp)\://([a-zA-Z0-9\.\-]+(\:[a-zA-Z0-9\.&amp;%\$\-]+)*@)*((25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9])\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[0-9])|([a-zA-Z0-9\-]+\.)*[a-zA-Z0-9\-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(\:[0-9]+)*(/($|[a-zA-Z0-9\.\,\?\'\\\+&amp;%\$#\=~_\-]+))*$");
  return urlregex.test(textval);
}

// retrieve page
function fetchPage(targetUrl, successCB, errorCB) {
  // fetch target url
  if (targetUrl.match(/^https/)) {
    protocol = https;
  } else {
    protocol = http;
  }
  protocol.get(targetUrl, function(res) {
    // successful fetch of url
    console.log(">>> Fetch succeeded:", targetUrl);

    // receive page contents and execute success callback
    collectData(res, successCB);
  }).on('error', function(err) {
      // error while fetching url
      console.log("Fetch failed:", targetUrl);

      // fire error callback
      errorCB(err);
  });
}

// collect links from target url
function collectLinks(targetUrl, successCB, errorCB) {
  fetchPage(targetUrl,
    function(data) {
      // parse all links from page
      var baseUrl = targetUrl.match(/(https?:\/\/[^\/]+)\/?/)[1];
      var newLinks = parseLinks(data, baseUrl);

      // fire success callback
      successCB(newLinks);
    }, errorCB);
}

// return array of unvisited urls in linkStore
function unvisitedUrls(linkStore) {
  var result = [];
  for (var url in linkStore.visited) {
    if (!linkStore.visited[url]) {
      result.push(url);
    }
  }
  return result;
}

// merge two hashes without overwriting original value
function mergeHash(target, source, defaultVal) {
  for (var key in source) {
    target[key] = target[key] || defaultVal;
  }
}

// crawl links listed in linkStore
function crawlLinks(linkStore, successCB, errorCB) {
  // TODO move crawlSet and minEventsFound to global config vars
  // crawlSet = number of urls to crawl for each iteration
  var crawlSet = 1;
  // minEventsFound = minimum number of events to find before ending crawl
  var minEventsFound = 10;
  var unvisited = unvisitedUrls(linkStore).slice(0, crawlSet);

  // fire success callback when no unvisited links or enough events found
  if (!unvisited.length ||
      Object.keys(linkStore.events).length >= minEventsFound) {
    return successCB(linkStore);
  }

  // crawl unvisited urls for more links
  var visitCount = 0;
  for (var i = 0; i < unvisited.length; i++) {
    var targetUrl = unvisited[i];

    // mark link as visited
    linkStore.visited[targetUrl] = true;

    // collect links from target url
    collectLinks(targetUrl,
      function(links) {
        // merge links into linkStore
        mergeHash(linkStore.visited, links.visited, false);
        mergeHash(linkStore.events, links.events, true);

        // recurse after all requests completed
        visitCount++;
        if (visitCount === unvisited.length) {
          crawlLinks(linkStore, successCB, errorCB);
        }
      }, 
      errorCB);
  }
}

// filter for determining whether a link seems like an event
function isEvent(link, filterKey) {
  // site specific filters to determine whether a link is an event
  // default filter used if no specific filter is found
  // filters currently use regex on link but can be changed to pull and analyze page structure
  var filters = {
    'http://calendar.boston.com': function(link) {
      return link.match('^http://calendar.boston.com/[^\/]+?/events/show/\\d+');
    },
    'http://www.sfmoma.org': function(link) {
      return link.match('^http://www.sfmoma.org/exhib_events/events/');
    },
    'http://www.workshopsf.org': function(link) {
      return link.match('^http://www.workshopsf.org/.*\?page_id=140');
    },
    'http://events.stanford.edu': function(link) {
      return link.match('^http://events.stanford.edu/events/\\d+?/\\d+?');
    },
    // default filter looks for a path that starts with filterKey(ie. the baseUrl), containing 'event',
    // and ending numerical path under the assumption that event links will contain some ID
    default: function(link) {
      return link.match('^' + filterKey + '.*?event.*?\\d+');
    },
  };
  var filter = filters[filterKey] || filters['default'];

  return filter(link);
}
