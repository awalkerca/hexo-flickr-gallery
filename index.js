'use strict';

var https = require('https');
var Promise = require('bluebird');
var hexoUtil = require('hexo-util');
var tagUtil = require('./flickrTagUtil');
var htmlTag = require('html-tag');
var APIKey = hexo.config.flickr_api_key || false;

/**
 * promise Flickr API request
 * @param  {Array} tagArgs Tag args ex: ['15905712665', 'z']
 * @resolve {Object} image attrs
 */
var promiseRequest = function (tagArgs) {
  if (!APIKey) {
    throw new Error('flickr_api_key configuration is required');
  }

  var tag = tagUtil.convertAttr(tagArgs);

  return new Promise(function (resolve, reject) {
    var url = 'https://api.flickr.com/services/rest/?method=flickr.photos.getInfo' +
      '&api_key=' + APIKey +
      '&photo_id=' + tag.id +
      '&format=json' +
      '&nojsoncallback=1';

    https.get(url, function (res) {
      var data = '';

      res.on('data', function (chunk) {
        data += chunk;
      });

      res.on('end', function () {
        var json = JSON.parse(data);
        if (json.stat === 'ok') {
          resolve(tagUtil.imgFormat(tag, json));
        } else {
          return reject('Flickr Tag Error: ' + tag.id + ' ' +  json.message);
        }
      });

    }).on('error', function (e) {
      return reject('Fetch Flickr API error: ' + e);
    });
  });

};

hexo.extend.helper.register('flickr_gallery', function(args, content){
  var params = args.slice(' ');
  var size = params[0];
  var imgs = params.slice(1);
  return Promise.all(Promise.map(imgs, function (img) {
    return promiseRequest([img, size]);
  })).then(function (imgAttrs) {
    //console.log('attrs', imgAttrs);
    var imgs = imgAttrs.map(function (imgAttr) {return hexoUtil.htmlTag('img', imgAttr)}).join('');
    return `<div class='flickr-gallery'>${imgs}</div>`;
  });
}, {async: true});