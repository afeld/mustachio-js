var connect = require('connect'),
  url = require('url'),
  mustachio = require('./mustachio.js'),
  jade = require('jade'),
  port = process.env.PORT || 8080;

// process.on('uncaughtException', function (err) {
//   console.error('ERROR: ' + err);
// });

connect(
  connect.logger(),
  connect.favicon(__dirname + '/public/favicon.ico'),
  
  connect.router(function(app){
    app.get('/', function(req, res, next){
      var src = url.parse(req.url, true).query.src;
      if (src){
        res.setHeader('Cache-Control', 'public, max-age=86400000'); // one year
        var encodedSrc = encodeURI(src);
        mustachio.processSrc(encodedSrc, res);
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
).listen(port);

console.log('Server running at http://localhost:' + port);
