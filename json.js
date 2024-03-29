/*!
 * Connect - json
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var utils = require(__dirname + '/utils')
  , _limit = require(__dirname + '/limit');

/**
 * JSON:
 *
 * Parse JSON request bodies, providing the
 * parsed object as `req.body`.
 *
 * Options:
 *
 *   - `strict`  when `false` anything `JSON.parse()` accepts will be parsed
 *   - `reviver`  used as the second "reviver" argument for JSON.parse
 *   - `limit`  byte limit defaulting to "1mb"
 *
 * @param {Object} options
 * @return {Function}
 * @api public
 */

exports = module.exports = function(options){
  var options = options || {}
    , strict = options.strict === false
      ? false
      : true;

  var limit = _limit(options.limit || '1mb');

  return function json(req, res, next) {
    if (req._body) return next();
    req.body = req.body || {};

    // check Content-Type
    if ('application/json' != utils.mime(req)) return next();

    // flag as parsed
    req._body = true;

    // parse
    limit(req, res, function(err){
      if (err) return next(err);
      var buf = '';
      req.setEncoding('utf8');
      req.on('data', function(chunk){ buf += chunk });
      req.on('end', function(){
        if (buf.indexOf('%') != -1) {buf = decodeURIComponent(buf); }
        if (strict && '{' != buf[0] && '[' != buf[0]) return next(utils.error(400));
        try {
          req.body = JSON.parse(buf, options.reviver);
          next();
        } catch (err){
          err.body = buf;
          err.status = 400;
          next(err);
        }
      });
    });
  }
};
