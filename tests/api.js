var api, auth, auth_opts, config, defaults, int, jsons, log, pass, qq, test_api;

int = function(v) {
  return parseInt(v);
};

log = console.log;

auth = require("../src/qqauth");

api = require("../src/qqapi");

defaults = require('../src/defaults');

config = require('../config');

qq = config.account;

pass = config.password;

jsons = JSON.stringify;

api.cookies(defaults.data('cookie'));

auth_opts = defaults.data('auth');


/*
  auth_opts ={
  psessionid
  clientid
  ptwebqq
  uin
  vfwebqq
  }
*/

test_api = function() {
  return api.send_msg_2group(3600594460, "庆贺一郎 " + (new Date()), auth_opts, function(ret, e) {
    return log("group send ret:", ret);
  });
};

test_api();
