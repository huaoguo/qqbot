var Adapter, EnterMessage, LeaveMessage, QQBot, QQHubotAdapter, Robot, TextMessage, api, auth, defaults, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

ref = require('hubot'), Robot = ref.Robot, Adapter = ref.Adapter, EnterMessage = ref.EnterMessage, LeaveMessage = ref.LeaveMessage, TextMessage = ref.TextMessage;

auth = require("../src/qqauth");

api = require("../src/qqapi");

QQBot = require("../src/qqbot");

defaults = require("../src/defaults");

QQHubotAdapter = (function(superClass) {
  extend(QQHubotAdapter, superClass);

  function QQHubotAdapter() {
    return QQHubotAdapter.__super__.constructor.apply(this, arguments);
  }

  QQHubotAdapter.prototype.send = function() {
    var envelope, i, len, results, str, strings;
    envelope = arguments[0], strings = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    this.robot.logger.info("hubot is sending " + strings);
    results = [];
    for (i = 0, len = strings.length; i < len; i++) {
      str = strings[i];
      results.push(this.group.send(str));
    }
    return results;
  };

  QQHubotAdapter.prototype.reply = function() {
    var strings, user;
    user = arguments[0], strings = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    return this.send.apply(this, [user].concat(slice.call(strings)));
  };

  QQHubotAdapter.prototype.emote = function() {
    var envelope, i, len, results, str, strings;
    envelope = arguments[0], strings = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    results = [];
    for (i = 0, len = strings.length; i < len; i++) {
      str = strings[i];
      results.push(this.send(envelope, "* " + str));
    }
    return results;
  };

  QQHubotAdapter.prototype.run = function() {
    var options, self, skip_login;
    self = this;
    options = {
      account: process.env.HUBOT_QQ_ID || 2769546520,
      password: process.env.HUBOT_QQ_PASS,
      groupname: process.env.HUBOT_QQ_GROUP || 'qqbot群',
      port: process.env.HUBOT_QQ_IMGPORT || 3000,
      host: process.env.HUBOT_QQ_IMGHOST || 'localhost',
      plugins: ['help']
    };
    skip_login = process.env.HUBOT_QQ_SKIP_LOGIN === 'true';
    if (!((options.account != null) && (options.password != null) && (options.groupname != null))) {
      this.robot.logger.error("请配置qq 密码 和监听群名字，具体查阅帮助");
      process.exit(1);
    }
    return this.login_qq(skip_login, options, (function(_this) {
      return function(cookies, auth_info) {
        _this.qqbot = new QQBot(cookies, auth_info, options);
        _this.qqbot.update_buddy_list(function(ret, error) {
          if (ret) {
            return _this.robot.logger.info('√ buddy list fetched');
          }
        });
        return _this.qqbot.listen_group(options.groupname, function(group, error) {
          _this.group = group;
          _this.robot.logger.info("enter long poll mode, have fun");
          _this.qqbot.runloop();
          _this.emit("connected");
          return _this.group.on_message(function(content, send, robot, message) {
            var user;
            _this.robot.logger.info(message.from_user.nick + " : " + content);
            user = _this.robot.brain.userForId(message.from_uin, {
              name: message.from_user.nick,
              room: options.groupname
            });
            return _this.receive(new TextMessage(user, content, message.uid));
          });
        });
      };
    })(this));
  };

  QQHubotAdapter.prototype.login_qq = function(skip_login, options, callback) {
    var auth_info, cookies;
    defaults.set_path('/tmp/store.json');
    if (skip_login) {
      cookies = defaults.data('qq-cookies');
      auth_info = defaults.data('qq-auth');
      this.robot.logger.info("skip login", auth_info);
      return callback(cookies, auth_info);
    } else {
      return auth.login(options, (function(_this) {
        return function(cookies, auth_info) {
          if (process.env.HUBOT_QQ_DEBUG != null) {
            defaults.data('qq-cookies', cookies);
            defaults.data('qq-auth', auth_info);
            defaults.save();
          }
          return callback(cookies, auth_info);
        };
      })(this));
    }
  };

  return QQHubotAdapter;

})(Adapter);

exports.use = function(robot) {
  return new QQHubotAdapter(robot);
};
