'use strict';

const hasProp = {}.hasOwnProperty;
const slice = [].slice;
const hubot = require('hubot');
const Adapter = hubot.Adapter;
const TextMessage = hubot.TextMessage;
const auth = require('../src/qqauth');
const QQBot = require('../src/qqbot');
const defaults = require('../src/defaults');

const extend = function (child, parent) {
  for (const key in parent) {
    if (hasProp.call(parent, key)) {
      child[key] = parent[key];
    }
  }
  function ctor() {
    this.constructor = child;
  }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
  child.__super__ = parent.prototype; return child;
};

const QQHubotAdapter = (function (superClass) {
  extend(QQHubotAdapter, superClass);

  function QQHubotAdapter() {
    return QQHubotAdapter.__super__.constructor.apply(this, arguments);
  }

  QQHubotAdapter.prototype.send = function () {
    const strings = arguments.length >= 2 ? slice.call(arguments, 1) : [];
    this.robot.logger.info('hubot is sending ' + strings);
    const results = [];
    for (let i = 0, len = strings.length; i < len; i++) {
      const str = strings[i];
      results.push(this.group.send(str));
    }
    return results;
  };

  QQHubotAdapter.prototype.reply = function () {
    const user = arguments[0];
    const strings = arguments.length >= 2 ? slice.call(arguments, 1) : [];
    return this.send.apply(this, [user].concat(slice.call(strings)));
  };

  QQHubotAdapter.prototype.emote = function () {
    const envelope = arguments[0];
    const strings = arguments.length >= 2 ? slice.call(arguments, 1) : [];
    const results = [];
    for (let i = 0, len = strings.length; i < len; i++) {
      const str = strings[i];
      results.push(this.send(envelope, '* ' + str));
    }
    return results;
  };

  QQHubotAdapter.prototype.run = function () {
    const options = {
      account: process.env.HUBOT_QQ_ID || 2769546520,
      password: process.env.HUBOT_QQ_PASS,
      groupname: process.env.HUBOT_QQ_GROUP || 'qqbot群',
      port: process.env.HUBOT_QQ_IMGPORT || 3000,
      host: process.env.HUBOT_QQ_IMGHOST || 'localhost',
      plugins: ['help']
    };
    const skip_login = process.env.HUBOT_QQ_SKIP_LOGIN === 'true';
    if (!(options.account && options.password && options.groupname)) {
      this.robot.logger.error('请配置qq 密码 和监听群名字，具体查阅帮助');
      process.exit(1);
    }
    return this.login_qq(skip_login, options, (function (_this) {
      return function (cookies, auth_info) {
        _this.qqbot = new QQBot(cookies, auth_info, options);
        _this.qqbot.update_buddy_list(function (ret, error) {
          if (error) {
            console.error(error);
          } else if (ret) {
            return _this.robot.logger.info('√ buddy list fetched');
          }
          return null;
        });
        return _this.qqbot.listen_group(options.groupname, function (group, error) {
          if (error) {
            console.error(error);
          }
          _this.group = group;
          _this.robot.logger.info('enter long poll mode, have fun');
          _this.qqbot.runloop();
          _this.emit('connected');
          return _this.group.on_message(function (content, send, robot, message) {
            _this.robot.logger.info(message.from_user.nick + ' : ' + content);
            const user = _this.robot.brain.userForId(message.from_uin, {
              name: message.from_user.nick,
              room: options.groupname
            });
            return _this.receive(new TextMessage(user, content, message.uid));
          });
        });
      };
    })(this));
  };

  QQHubotAdapter.prototype.login_qq = function (skip_login, options, callback) {
    defaults.set_path('/tmp/store.json');
    if (skip_login) {
      const cookies = defaults.data('qq-cookies');
      const auth_info = defaults.data('qq-auth');
      this.robot.logger.info('skip login', auth_info);
      return callback(cookies, auth_info);
    }
    return auth.login(options, (function () {
      return function (cookies, auth_info) {
        if (process.env.HUBOT_QQ_DEBUG) {
          defaults.data('qq-cookies', cookies);
          defaults.data('qq-auth', auth_info);
          defaults.save();
        }
        return callback(cookies, auth_info);
      };
    })(this));
  };

  return QQHubotAdapter;

})(Adapter);

exports.use = function (robot) {
  return new QQHubotAdapter(robot);
};
