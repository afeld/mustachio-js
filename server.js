var connect = require('connect'),
  spawn = require('child_process').spawn;

connect(
  connect.logger(),
  
  connect.router(function(app){
    app.get('/', function(req, res, next){
      var src = 'dubya.jpeg'; //req.params.src;
      if (src){
        console.log("Resizing " + src);
        var convert = spawn('convert', [src, '-resize', '100x', '-']);
        
        convert.stdout.on('data', function (data) {
          res.write(data);
        });
        
        convert.stderr.on('data', function (data) {
          console.log('stderr: ' + data);
        });
        
        convert.on('exit', function (code) {
          res.end();
          console.log('child process exited with code ' + code);
        });
      }
    });
  })
).listen(8080);

console.log('Server running at http://localhost:8080');
