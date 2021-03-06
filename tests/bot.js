var QQBot, api, auth_info, bot, config, cookies, defaults, group, jsons, log;

log = new (require('log'))('debug');

jsons = JSON.stringify;

api = require("../src/qqapi");

QQBot = require("../src/qqbot");

defaults = require('../src/defaults');

config = require('../config');

cookies = defaults.data('cookie');

auth_info = defaults.data('auth');

bot = new QQBot(cookies, auth_info, config);

group = null;

bot.listen_group("qqbot群", function(_group, error) {
  log.info("enter long poll mode, have fun");
  bot.runloop();
  group = _group;
  return group.on_message(function(content, send, robot, message) {
    log.info('received', content);
    if (content.match(/^wow/)) {
      return send('mom');
    }
  });
});
