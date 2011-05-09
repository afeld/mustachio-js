var temp = require('temp'),
  request = require('request'),
  fs = require('fs'),
  spawn = require('child_process').spawn;

// note: doesn't handle query strings
function fileExt(filenameOrUrl){
  var parts = filenameOrUrl.split('.');
  return parts[parts.length-1];
}

exports.processSrc = function(src, res){
  var extension = '.' + fileExt(src);
  temp.open({prefix: 'mustachio_', suffix: extension}, function(err, tmpFile){
    var path = tmpFile.path;
    
    var ws = fs.createWriteStream(path);
    ws.on('close', function(){
      exports.mustachify(path, res);
    });
    
    // download image
    request({uri: src}).pipe(ws);
  });
};

exports.mustachify = function(filename, res){
  var convert = spawn('convert', [filename, '-resize', '100x', '-']);
  
  convert.stdout.on('data', function (data) {
    res.write(data);
  });
  
  convert.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });
  
  convert.on('exit', function (code) {
    res.end();
    if ( code !== 0 ){
      console.log('child process exited with code ' + code);
    }
  });
};
