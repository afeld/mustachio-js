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
  console.log('processSrc');
  var extension = '.' + fileExt(src);
  temp.open({prefix: 'mustachio', suffix: extension}, function(err, tmpFile){
    var path = tmpFile.path;
    console.log('tmpfile: ', path);
    
    var ws = fs.createWriteStream(path);
    // ws.on('data', function(chunk){
    //   console.log('stream data');
    // });
    // ws.on('end', function(){
    //   console.log('stream end');
    //   exports.mustachify(path, res);
    // });
    ws.on('close', function(){
      console.log('stream closed');
      exports.mustachify(path, res);
    });
    
    var r = request({uri: src});
    r.pipe(ws);
  });
};

exports.mustachify = function(filename, res){
  console.log("Resizing " + filename);
  var convert = spawn('convert', [filename, '-resize', '100x', '-']);
  
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
};
