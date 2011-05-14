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
  height: 105,
  topOffset: -5.0, // from nose
  bottomOffset: -15.0 // from center of mouth
};

// note: doesn't handle query strings
function fileExt(filenameOrUrl){
  var parts = filenameOrUrl.split('.');
  return parts[parts.length-1];
}

function photoDataToPx(photoData){
  FACE_POS_ATTRS.forEach(function(attr){
    photoData.tags.forEach(function(faceData, i){
      if (photoData.tags[i][attr]){
        photoData.tags[i][attr].x *= ( photoData.width / 100.0 );
        photoData.tags[i][attr].y *= ( photoData.height / 100.0 );
      } else {
        console.warn("WARN: missing position attribute " + attr);
      }
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
      if (err || faceRes.statusCode !== 200) {
        console.error("ERROR: face detection failed:", err)
      } else {
        var faceApiData = JSON.parse(body);
        photoData = photoDataToPx(faceApiData.photos[0]);
        
        if (imageDownloaded){
          console.log("download finished first");
          exports.mustachify(path, photoData, res);
        }
      }
    });
    
    // download image
    var ws = fs.createWriteStream(path);
    ws.on('close', function(){
      imageDownloaded = true;
      
      if (photoData) {
        console.log("Face API finished first");
        exports.mustachify(path, photoData, res);
      }
    });
    request({uri: src}).pipe(ws);
  });
};

exports.mustachify = function(filename, photoData, res){
  var i;
  var convertArgs = [filename, '-virtual-pixel', 'transparent']
  photoData.tags.forEach(function(face){
    // perform affine transform, such that the top-center
    // of the mustache is mapped to the nose, and the bottom-center
    // of the stache is mapped to the center of the mouth
    var affineParams = [
      [ MUSTACHE.width / 2.0, MUSTACHE.topOffset ], // top-center of stache
      [ face.nose.x, face.nose.y  ], // nose
      
      [ MUSTACHE.width / 2.0, MUSTACHE.height + MUSTACHE.bottomOffset ], // bottom-center of stache
      [ face.mouth_center.x, face.mouth_center.y ] // center of mouth
    ]
    
    var affineParamsStr = affineParams.map( function(subAry){ return subAry.join(','); } ).join(' ');
    
    convertArgs = convertArgs.concat(
      ['(', MUSTACHE.filename, '-matte', '+distort', 'Affine', "'"+affineParamsStr+"'", ')']
    );
  });
  convertArgs = convertArgs.concat(['-flatten', '-']);
  
  var convert = spawn('convert', convertArgs);
  
  convert.stdout.on('data', function (data) {
    res.write(data);
  });
  
  convert.stderr.on('data', function (data) {
    console.warn('WARN: ' + data);
    res.write(data);
  });
  
  convert.on('exit', function (code) {
    if ( code !== 0 ){
      res.statusCode = 500;
      console.error('ERROR: child process exited with code ' + code);
    }
    res.end();
  });
};
