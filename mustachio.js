var temp = require('temp'),
  request = require('request'),
  fs = require('fs'),
  spawn = require('child_process').spawn;

var MUSTACHIO_FACE_API_KEY = process.env.MUSTACHIO_FACE_API_KEY;
if (!MUSTACHIO_FACE_API_KEY){
  throw "Please set MUSTACHIO_FACE_API_KEY.";
}
var MUSTACHIO_FACE_API_SECRET = process.env.MUSTACHIO_FACE_API_SECRET;
if (!MUSTACHIO_FACE_API_SECRET){
  throw "Please set MUSTACHIO_FACE_API_SECRET.";
}

// note: doesn't handle query strings
function fileExt(filenameOrUrl){
  var parts = filenameOrUrl.split('.');
  return parts[parts.length-1];
}

exports.processSrc = function(src, res){
  var extension = '.' + fileExt(src);
  temp.open({prefix: 'mustachio_', suffix: extension}, function(err, tmpFile){
    var path = tmpFile.path,
      imageDownloaded = false,
      faceData = null,
      faceUrl = 'http://api.face.com/faces/detect.json?api_key=' + MUSTACHIO_FACE_API_KEY + '&api_secret=' + MUSTACHIO_FACE_API_SECRET + '&urls=' + src;
    
    request({uri: faceUrl}, function(err, faceRes, body){
      if (!err && faceRes.statusCode == 200) {
        faceData = JSON.parse(body);
        if (imageDownloaded){
          exports.mustachify(path, res); // TODO pass faceData
        }
      }
    });
    
    var ws = fs.createWriteStream(path);
    ws.on('close', function(){
      imageDownloaded = true;
      if (faceData) {
        exports.mustachify(path, res); // TODO pass faceData
      }
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
    res.write(data);
  });
  
  convert.on('exit', function (code) {
    res.end();
    if ( code !== 0 ){
      console.log('child process exited with code ' + code);
    }
  });
};
