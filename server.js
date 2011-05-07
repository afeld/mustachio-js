var connect = require('connect');

connect(
  connect.logger(),
  
  connect.router(function(app){
    app.get('/', function(req, res, next){
      res.end('Hello world');
    });
  })
).listen(8080);

console.log('Server running at http://localhost:8080');
