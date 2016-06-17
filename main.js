'use strict';

const log = new (require('log'))('debug');
const auth = require('./src/qqauth-qrcode');
const QQBot = require('./src/qqbot');
const defaults = require('./src/defaults');
const config = require('./config');
const KEY_COOKIES = 'qq-cookies';
const KEY_AUTH = 'qq-auth';

/*
  * 获取接口需要的cookie和token
  * @param isneedlogin : 是否需要登录，or本地获取
  * @param options     : 配置文件涉及的内容
  * @callback (cookies,auth_info)
  */
const get_tokens = function (isneedlogin, options, callback) {
  if (isneedlogin) {
    return auth.login(options, function (cookies, auth_info) {
      defaults.data(KEY_COOKIES, cookies);
      defaults.data(KEY_AUTH, auth_info);
      defaults.save();
      return callback(cookies, auth_info);
    });
  }
  const cookies = defaults.data(KEY_COOKIES);
  const auth_info = defaults.data(KEY_AUTH);
  log.info('skip login');
  return callback(cookies, auth_info);
};

const run = function () {
  const params = process.argv.slice(-1)[0] || '';
  const isneedlogin = params.trim() !== 'nologin';
  return get_tokens(isneedlogin, config, function (cookies, auth_info) {
    const bot = new QQBot(cookies, auth_info, config);
    bot.on_die(function () {
      if (isneedlogin) {
        return run();
      }
    });
    return bot.update_all_members(function (ret) {
      if (ret) {
        log.info('Entering runloop, Enjoy!');
        return bot.runloop();
      }
      log.error('获取信息失败，再次尝试');
      return bot.update_all_members(function (ret) {
        if (ret) {
          log.info('Entering runloop, Enjoy!');
          return bot.runloop();
        }
        log.error('获取信息失败，请重新运行');
        process.exit(1);
      });
    });
  });
};

run();
