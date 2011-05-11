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

var FACE_POS_ATTRS = ['center', 'eye_left', 'eye_right', 'mouth_left', 'mouth_center', 'mouth_right', 'nose'];

var MUSTACHE = {
  filename: 'mustache_03.png',
  width: 491,
  height: 105
};

// note: doesn't handle query strings
function fileExt(filenameOrUrl){
  var parts = filenameOrUrl.split('.');
  return parts[parts.length-1];
}

function photoDataToPx(photoData){
  FACE_POS_ATTRS.forEach(function(attr){
    photoData.tags.forEach(function(faceData, i){
      photoData.tags[i][attr].x *= ( photoData.width / 100.0 );
      photoData.tags[i][attr].y *= ( photoData.height / 100.0 );
    });
  });
  return photoData;
}

exports.processSrc = function(src, res){
  var extension = '.' + fileExt(src);
  temp.open({prefix: 'mustachio_', suffix: extension}, function(err, tmpFile){
    var path = tmpFile.path,
      imageDownloaded = false,
      photoData = null,
      faceUrl = 'http://api.face.com/faces/detect.json?api_key=' + MUSTACHIO_FACE_API_KEY + '&api_secret=' + MUSTACHIO_FACE_API_SECRET + '&attributes=none&urls=' + src;
    
    // mustachify after Face API response or image download: whichever comes last
    
    // get face data
    request({uri: faceUrl}, function(err, faceRes, body){
      if (!err && faceRes.statusCode == 200) {
        var faceApiData = JSON.parse(body);
        photoData = photoDataToPx(faceApiData.photos[0]);
        
        if (imageDownloaded){
          exports.mustachify(path, photoData, res);
        }
      }
    });
    
    // download image
    var ws = fs.createWriteStream(path);
    ws.on('close', function(){
      imageDownloaded = true;
      
      if (photoData) {
        exports.mustachify(path, photoData, res);
      }
    });
    request({uri: src}).pipe(ws);
  });
};

exports.mustachify = function(filename, photoData, res){
  var i;
  var convertArgs = [filename]
  photoData.tags.forEach(function(face){
    // perform affine transform, such that the top-center
    // of the mustache is mapped to the nose, and the bottom-center
    // of the stache is mapped to the center of the mouth
    var affineParams = [
      [ MUSTACHE.width / 2.0, 0 ], // top-center of stache
      [ face.nose.x, face.nose.y ], // nose
      
      [ MUSTACHE.width / 2.0, MUSTACHE.height ], // bottom-center of stache
      [ face.mouth_center.x, face.mouth_center.y ] // center of mouth
    ]
    
    var affineParamsStr = affineParams.map( function(subAry){ return subAry.join(','); } ).join(' ');
    
    convertArgs = convertArgs.concat(
      ['(', MUSTACHE.filename, '+distort', 'Affine', affineParamsStr, ')']
    );
  });
  convertArgs = convertArgs.concat(['-flatten', '-']);
  
  var convert = spawn('convert', convertArgs);
  
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
