# Port of [mustachio (Ruby on Sinatra)](https://github.com/afeld/mustachio) to NodeJS.

## Looking for a brave hosting company to deploy it to!

## Requirements:

* NodeJS v0.4.1+
* ImageMagick v6
* caching (recommended)

## Installation

* Set `MUSTACHIO_FACE_API_KEY` and `MUSTACHIO_FACE_API_SECRET` environment variables - see [developer.face.com](http://developers.face.com).
* Set `PORT` - otherwise defaults to 8080

---

Sample from the Ruby version:

![dubya](http://mustachio.heroku.com/magickly/?mustachify=true&src=http://www.librarising.com/astrology/celebs/images2/QR/queenelizabethii.jpg)

    http://mustachio.heroku.com/?src=YOUR-IMAGE-URL
