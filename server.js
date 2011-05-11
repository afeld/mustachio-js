var connect = require('connect'),
  url = require('url'),
  mustachio = require('./mustachio.js'),
  jade = require('jade');

connect(
  connect.logger(),
  
  connect.router(function(app){
    app.get('/', function(req, res, next){
      var src = url.parse(req.url, true).query.src;
      if (src){
        mustachio.processSrc(src, res);
      } else {
        var jadeOptions = {
          cache: true,
          filename: 'index.jade',
          locals: {
            host: req.headers.host
          }
        };
        jade.renderFile('./views/index.jade', jadeOptions, function(err, html){
          if (err){
            console.log("jade error:", err);
          }
          res.end(html);
        });
      }
    });
  })
).listen(8080);

console.log('Server running at http://localhost:8080');
