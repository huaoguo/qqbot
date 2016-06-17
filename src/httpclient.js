'use strict';

const _ = require('underscore');
const https = require('https');
const http = require('http');
const querystring = require('querystring');
const URL = require('url');

let all_cookies = [];

const get_cookies = function () {
  return all_cookies;
};

const get_cookies_string = function () {
  const cookie_map = {};
  all_cookies.forEach(function (ck) {
    const v = ck.split(' ')[0];
    const kv = v.trim().split('=');
    if (kv[1] !== ';') {
      cookie_map[kv[0]] = kv[1];
    }
  });
  const cks = [];
  for (const k in cookie_map) {
    cks.push(k + '=' + cookie_map[k]);
  }
  return cks.join(' ');
};

const update_cookies = function (cks) {
  if (cks) {
    all_cookies = _.union(all_cookies, cks);
  }
};

const global_cookies = function (cookie) {
  if (cookie) {
    update_cookies(cookie);
  }
  return get_cookies();
};

const url_get = function (url_or_options, callback, pre_callback) {
  let http_or_https = http;

  if (((typeof url_or_options === 'string') && (url_or_options.indexOf('https:') === 0)) ||
      ((typeof url_or_options === 'object') && (url_or_options.protocol === 'https:'))) {
    http_or_https = https;
  }

  if (process.env.DEBUG) {
    console.log(url_or_options);
  }
  return http_or_https.get(url_or_options, function (resp) {
    if (pre_callback !== undefined) {
      pre_callback(resp);
    }

    update_cookies(resp.headers['set-cookie']);

    const res = resp;
    let body = '';
    resp.on('data', function (chunk) {
      body += chunk;
    });
    return resp.on('end', function () {
      if (process.env.DEBUG) {
        console.log(resp.statusCode);
        console.log(resp.headers);
        console.log(body);
      }
      return callback(0, res, body);
    });
  }).on('error', function (e) {
    console.log(e);
  });
};

const handle_resp_body = function (body, options, callback) {
  let ret = null;
  try {
    ret = JSON.parse(body);
  } catch (err) {
    console.log('解析出错', options.url, body);
    return callback(null, err);
  }
  return callback(ret, null);
};

const url_post = function (options, form, callback) {
  let http_or_https = http;

  if (((typeof options === 'object') && (options.protocol === 'https:'))) {
    http_or_https = https;
  }

  const postData = querystring.stringify(form);
  if (typeof options.headers !== 'object') options.headers = {};
  options.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
  options.headers['Content-Length'] = Buffer.byteLength(postData);
  options.headers['Cookie'] = get_cookies_string();
  options.headers['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:27.0) Gecko/20100101 Firefox/27.0';
  if (process.env.DEBUG) {
    console.log(options.headers);
    console.log(postData);
  }
  const req = http_or_https.request(options, function (resp) {
    const res = resp;
    let body = '';
    resp.on('data', function (chunk) {
      body += chunk;
    });
    return resp.on('end', function () {
      if (process.env.DEBUG) {
        console.log(resp.statusCode);
        console.log(resp.headers);
        console.log(body);
      }
      return callback(0, res, body);
    });
  }).on('error', function (e) {
    return console.log(e);
  });
  req.write(postData);
  return req.end();
};

const http_request = function (options, params, callback) {
  const aurl = URL.parse(options.url);
  options.host = aurl.host;
  options.path = aurl.path;
  options.headers || (options.headers = {});
  const client = aurl.protocol === 'https:' ? https : http;
  let body = '';
  if (params && options.method === 'POST') {
    const data = querystring.stringify(params);
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
    options.headers['Content-Length'] = Buffer.byteLength(data);
  } else if (params && options.method === 'GET') {
    const query = querystring.stringify(params);
    const append = aurl.query ? '&' : '?';
    options.path += append + query;
  }
  options.headers['Cookie'] = get_cookies_string();
  options.headers['Referer'] = 'http://d1.web2.qq.com/proxy.html?v=20151105001&callback=1&id=2';
  // options.headers['Referer'] = 'http://s.web2.qq.com/proxy.html?v=20130916001&callback=1&id=1';
  options.headers['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.86 Safari/537.36';
  if (process.env.DEBUG) {
    console.log(options);
    console.log(params);
  }
  const req = client.request(options, function (resp) {
    if (options.debug) {
      console.log('response: ' + resp.statusCode);
      console.log('cookie: ' + resp.headers['set-cookie']);
    }
    resp.on('data', function (chunk) {
      body += chunk;
    });
    return resp.on('end', function () {
      if (process.env.DEBUG) {
        console.log(resp.statusCode);
        console.log(resp.headers);
        console.log(body);
      }
      return handle_resp_body(body, options, callback);
    });
  });
  req.on('error', function (e) {
    return callback(null, e);
  });
  if (params && options.method === 'POST') {
    const data = querystring.stringify(params);
    req.write(data);
  }
  return req.end();
};

const http_get = function (url, params, callback) {
  if (!callback) {
    callback = params;
    params = null;
  }
  const options = {
    method: 'GET',
    url: url
  };
  return http_request(options, params, callback);
};

const http_post = function (options, body, callback) {
  options.method = 'POST';
  return http_request(options, body, callback);
};

module.exports = {
  global_cookies: global_cookies,
  get_cookies: get_cookies,
  update_cookies: update_cookies,
  get_cookies_string: get_cookies_string,
  request: http_request,
  get: http_get,
  post: http_post,
  url_get: url_get,
  url_post: url_post
};
