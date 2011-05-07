var connect = require('connect'),
  url = require('url'),
  mustachio = require('./mustachio.js');

connect(
  connect.logger(),
  
  connect.router(function(app){
    app.get('/', function(req, res, next){
      var src = url.parse(req.url, true).query.src;
      if (src){
        console.log('processing ' + src);
        mustachio.processSrc(src, res);
      } else {
        res.end("no src provided");
      }
    });
  })
).listen(8080);

console.log('Server running at http://localhost:8080');
