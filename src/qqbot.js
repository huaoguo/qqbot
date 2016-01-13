var auth = require('./qqauth-qrcode');
var api = require('./qqapi');
var Log = require('log');
var Dispatcher = require('./dispatcher');
var log = new Log('debug');

var MsgType = {
  Default: 'message',
  Sess: 'sess_message',
  Group: 'group_message',
  Discuss: 'discu_message'
};


/*
  cookie , auth 登录需要参数
  config:  配置信息，将 config.yaml
  plugins: 插件
*/

var QQBot = (function() {
  function QQBot(cookies, auth1, config) {
    this.cookies = cookies;
    this.auth = auth1;
    this.config = config;
    this.buddy_info = {};
    this.group_info = {};
    this.groupmember_info = {};
    this.dgroup_info = {};
    this.dgroupmember_info = {};
    this.user_account_table = {};
    this.group_account_table = {};
    api.cookies(this.cookies);
    this.api = api;
    this.dispatcher = new Dispatcher(this.config.plugins, this);
    this.started = true;
  }

  QQBot.prototype.save_group_member = function(group, info) {
    return this.groupmember_info[group.gid] = info;
  };

  QQBot.prototype.get_user = function(uin) {
    var users = this.buddy_info.info.filter(function(item) {
      return item.uin === uin;
    });
    return users.pop();
  };

  QQBot.prototype.get_user_ex = function(options) {
    var users = this.buddy_info.info.filter(function(item) {
      var key, value;
      for (key in options) {
        value = options[key];
        return item[key] === value;
      }
    });
    return users.pop();
  };

  QQBot.prototype.get_user_ingroup = function(uin, gid) {
    var info, users;
    info = this.groupmember_info[gid];
    users = info.minfo.filter(function(item) {
      return item.uin === uin;
    });
    return users.pop();
  };

  QQBot.prototype.get_group = function(options) {
    var groups = this.group_info.gnamelist.filter(function(item) {
      var key, value;
      for (key in options) {
        value = options[key];
        return item[key] === value;
      }
    });
    return groups.pop();
  };

  QQBot.prototype.get_dgroup = function(options) {
    var groups;
    try {
      groups = this.dgroup_info.dnamelist.filter(function(item) {
        var key, value;
        for (key in options) {
          value = options[key];
          return item[key] === value;
        }
      });
      return groups.pop();
    } catch (undefined) {}
  };

  QQBot.prototype.get_user_in_dgroup = function(uin, did) {
    var info, user, users;
    try {
      info = this.dgroupmember_info[did];
      users = (function() {
        var i, len, ref, results;
        ref = info.mem_info;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          user = ref[i];
          if (user.uin === uin) {
            results.push(user);
          }
        }
        return results;
      })();
      return users.pop();
    } catch (undefined) {}
  };

  QQBot.prototype.update_group_list = function(callback) {
    log.info('fetching group list...');
    var self = this;
    return this.api.get_group_list(this.auth, function(ret, e) {
      if(e) {
        log.error(e);
        if(callback) return callback(false, e);
      } else {
        if (ret.retcode === 0) {
          self.group_info = ret.result;
          var info = self.group_info.gnamelist;
          var n = info.length;
          if(n > 0) {
            info.forEach(function(inf) {
              self.get_group_account(inf.gid, function(err, account) {
                if (!err) inf.account = account;
                if(-- n <= 0) {
                  if(callback) return callback((!err), err);
                }
              });
            });
          } else {
            if(callback) return callback(true, 'ok');
          }
        } else {
          if(callback) return callback(false, 'retcode isnot 0');
        }
      }
    });
  };

  QQBot.prototype.update_buddy_list = function(callback) {
    log.info('fetching buddy list...');
    var self = this;
    return this.api.get_buddy_list(this.auth, function(ret, e) {
      if(e) {
        log.error(e);
        if(callback) return callback(false, e);
      } else {
        if (ret.retcode === 0) {
          self.buddy_info = ret.result;
          var info = self.buddy_info.info;
          var n = info.length;
          if(n > 0) {
            info.forEach(function(inf){
              self.get_user_account(inf.uin, function(err, account) {
                if (!err) inf.account = account;
                if(--n <= 0) return callback((!err), err);
              });
            });
          } else {
            if(callback) return callback(true, 'ok');
          }
        } else {
          if(callback) return callback(false, 'retcode isnt 0');
        }
      }
    });
  };

  QQBot.prototype.update_group_member = function(options, callback) {
    var group;
    group = options.code ? options : this.get_group(options);
    return this.api.get_group_member(group.code, this.auth, (function(_this) {
      return function(ret, e) {
        if (ret.retcode === 0) {
          _this.save_group_member(group, ret.result);
        }
        if (callback) {
          return callback(ret.retcode === 0, e);
        }
      };
    })(this));
  };

  QQBot.prototype.update_dgroup_list = function(callback) {
    log.info("fetching discuss group list");
    return this.api.get_discuss_list(this.auth, (function(_this) {
      log.info("update discuss group list");
      return function(ret, e) {
        if (e) {
          log.error(e);
        }
        if (ret.retcode === 0) {
          _this.dgroup_info = ret.result;
        }
        if (callback) {
          return callback(ret.retcode === 0, e || 'retcode isnot 0');
        }
      };
    })(this));
  };

  QQBot.prototype.update_dgroup_member = function(dgroup, callback) {
    var did;
    log.info("update discuss group member " + dgroup.did);
    did = dgroup.did;
    return this.api.get_discuss_member(did, this.auth, (function(_this) {
      return function(ret, e) {
        if (ret.retcode === 0) {
          _this.dgroupmember_info[did] = ret.result;
        }
        if (callback) {
          return callback(ret.retcode === 0, e);
        }
      };
    })(this));
  };

  QQBot.prototype.update_all_group_member = function(callback) {
    var all, finished, group, groups, i, len, results, successed;
    finished = successed = 0;
    groups = this.group_info.gnamelist || [];
    all = groups.length;
    if (all === 0) {
      callback(true, 0, 0);
    }
    results = [];
    for (i = 0, len = groups.length; i < len; i++) {
      group = groups[i];
      results.push(this.update_group_member(group, function(ret, error) {
        finished += 1;
        successed += ret;
        log.debug("groupmember all" + all + " fin" + finished + " succ" + successed);
        if (error) {
          log.debug(error);
        }
        if (finished === all) {
          return callback(successed === all, finished, successed);
        }
      }));
    }
    return results;
  };

  QQBot.prototype.update_all_members = function(callback) {
    var actions, check;
    actions = {
      buddy: [0, 0],
      group: [0, 0],
      groupmember: [0, 0]
    };
    check = function() {
      var all, finished, i, item, key, len, stats, successed, value;
      finished = successed = 0;
      all = Object.keys(actions).length;
      stats = (function() {
        var results;
        results = [];
        for (key in actions) {
          value = actions[key];
          results.push(value);
        }
        return results;
      })();
      for (i = 0, len = stats.length; i < len; i++) {
        item = stats[i];
        finished += item[0];
        successed += item[1];
      }
      log.debug("updating all: all " + all + " finished " + finished + " success " + successed);
      if (finished === all) {
        return callback(successed === all);
      }
    };

    this.update_buddy_list(function(ret) {
      actions.buddy = [1, ret];
      return check();
    });

    this.update_group_list((function(_this) {
      return function(ret) {
        actions.group = [1, ret];
        if (!ret) {
          callback(false);
          return;
        }
        log.info('fetching all groupmember...');
        return _this.update_all_group_member(function(ret, all, successed) {
          actions.groupmember = [1, ret];
          return check();
        });
      };
    })(this));

    return this.update_dgroup_list();
  };

  QQBot.prototype.get_account_info_general = function(table, uin, type, callback) {
    var acc, call_callbacks, callbacks, info, key;
    key = "uin" + uin;
    if (info = table[key]) {
      if (acc = info.account) {
        return callback(null, acc);
      } else {
        return info.callbacks.push(callback);
      }
    } else {
      callbacks = [callback];
      table[key] = {
        callbacks: callbacks
      };
      call_callbacks = function(err, account) {
        var func, i, len, results;
        results = [];
        for (i = 0, len = callbacks.length; i < len; i++) {
          func = callbacks[i];
          results.push(func(err, account));
        }
        return results;
      };
      log.info("fetching account info: type" + type + ", uin" + uin);
      return this.api.get_friend_uin2(uin, type, this.auth, (function(_this) {
        return function(ret, e) {
          var account, account_key, func, funcs, i, len, ref, result;
          delete table[key];
          if (!ret) {
            call_callbacks({}, null);
            return;
          }
          if (ret.retcode === 0) {
            result = table[key] = ret.result;
            if (type === 4) {
              //result.account -= 3890000000;
            }
            account = result.account;
            account_key = "acc" + account;
            funcs = (ref = table[account_key]) != null ? ref.callbacks : void 0;
            table[account_key] = result;
            if (funcs) {
              for (i = 0, len = funcs.length; i < len; i++) {
                func = funcs[i];
                func(null, uin);
              }
            }
            return call_callbacks(null, account);
          } else {
            return call_callbacks(ret, null);
          }
        };
      })(this));
    }
  };

  QQBot.prototype.get_uin_general = function(table, account, callback) {
    var info, key, uin;
    key = "acc" + account;
    if (info = table[key]) {
      if (uin = info.uin) {
        if (callback) {
          callback(null, uin);
        }
        return uin;
      } else {
        info.callbacks.push(callback);
        return null;
      }
    } else {
      if (callback) {
        table[key] = {
          callbacks: [callback]
        };
      }
      return null;
    }
  };

  QQBot.prototype.get_user_account = function(uin_or_user, callback) {
    var uin;
    uin = typeof uin_or_user === 'object' ? uin_or_user.uin : uin_or_user;
    return this.get_account_info_general(this.user_account_table, uin, 1, callback);
  };

  QQBot.prototype.get_user_uin = function(account, callback) {
    return this.get_uin_general(this.user_account_table, account, callback);
  };

  QQBot.prototype.get_group_account = function(gid_or_group, callback) {
    var uin;
    uin = typeof gid_or_group === 'object' ? gid_or_group.gid : gid_or_group;
    return this.get_account_info_general(this.group_account_table, uin, 4, callback);
  };

  QQBot.prototype.get_group_gid = function(account, callback) {
    return this.get_uin_general(this.group_account_table, account, callback);
  };

  QQBot.prototype.on_die = function(callback) {
    return this.cb_die = callback;
  };

  QQBot.prototype.runloop = function(callback) {
    return this.api.long_poll(this.auth, (function(_this) {
      return function(ret, e) {
        if (_this.started) {
          _this.handle_poll_responce(ret, e);
          if (callback) {
            callback(ret, e);
          }
        }
        return _this.started;
      };
    })(this));
  };

  QQBot.prototype.reply_message = function(message, content, callback) {
    log.info("发送消息：", content);
    switch (message.type) {
    case MsgType.Group:
      return this.api.send_msg_2group(message.from_gid, content, this.auth, callback);
    case MsgType.Default:
      return this.api.send_msg_2buddy(message.from_uin, content, this.auth, callback);
    case MsgType.Discuss:
      return this.api.send_msg_2discuss(message.from_did, content, this.auth, callback);
    case MsgType.Sess:
      return this.api.send_msg_2sess(message.from_gid, message.from_uin, content, this.auth, callback);
    }
  };

  QQBot.prototype.send_message = function(uin_or_user, content, callback) {
    var uin;
    uin = typeof uin_or_user === 'object' ? uin_or_user.uin : uin_or_user;
    log.info("send msg " + content + " to user" + uin);
    return api.send_msg_2buddy(uin, content, this.auth, callback);
  };

  QQBot.prototype.send_message_to_group = function(gid_or_group, content, callback) {
    var gid;
    gid = typeof gid_or_group === 'object' ? gid_or_group.gid : gid_or_group;
    log.info("send msg " + content + " to group" + gid);
    return api.send_msg_2group(gid, content, this.auth, callback);
  };

  QQBot.prototype.send_message_to_discuss = function(did, content, callback) {
    log.info("send msg " + content + " to discuss" + did);
    return api.send_msg_2discuss(did, content, this.auth, callback);
  };

  QQBot.prototype.die = function(message, info) {
    this.dispatcher.stop_plugin();
    this.started = false;
    if (message) {
      log.error("QQBot will die! message: " + message);
    }
    if (message) {
      console.log("QQBot will die! message: " + message);
    }
    if (info) {
      log.error("QQBot will die! info " + (JSON.stringify(info)));
    }
    if (info) {
      console.log("QQBot will die! info " + (JSON.stringify(info)));
    }
    if (this.cb_die) {
      return this.cb_die();
    } else {
      return process.exit(1);
    }
  };

  QQBot.prototype.handle_poll_responce = function(resp, e) {
    if (e) {
      log.error("poll with error " + e);
    }
    var code = resp ? resp.retcode : -1;
    switch (code) {
    case -1:
      return log.error("resp is null, error on parse ret", resp);
    case 0:
      var results = [];
      if( resp.result ) {
        var self = this;
        resp.result.forEach(function(event){
          results.push(self._handle_poll_event(event));
        });
      }
      return results;
    case 102:
      return 'nothing happened, waiting for next loop';
    case 116:
      return this._update_ptwebqq(resp);
    case 103:
    case 121:
      return this.die("登录异常 " + code, resp);
    case 100012:
      return this.relogin();
    default:
      return log.debug(resp);
    }
  };


  /*
    重新登录获取token
    @callback success:bool
  */

  QQBot.prototype.relogin = function(callback) {
    log.info("relogin...");
    var self = this;
    log.debug('before', self.auth);
    return auth.auto_login(self.auth.ptwebqq, function(cookies, auth_info){
      self.auth = auth_info;
      log.debug('after', self.auth);
      if (callback) return callback(true);
    });
  };

  QQBot.prototype._update_ptwebqq = function(ret) {
    log.debug('need to update ptwebqq ', ret);
    return this.auth.ptwebqq = ret.p;
  };

  QQBot.prototype._handle_poll_event = function(event) {
    switch (event.poll_type) {
    case MsgType.Default:
    case MsgType.Sess:
    case MsgType.Group:
    case MsgType.Discuss:
      return this._on_message(event, event.poll_type);
    case 'input_notify':
      return "";
    case 'buddies_status_change':
      return "";
    default:
      return log.warning("unimplemented event", event.poll_type, "content: ", JSON.stringify(event));
    }
  };

  QQBot.prototype._on_message = function(event, msg_type) {
    var msg, replied, reply, value;
    value = event.value;
    msg = {
      content: value.content.slice(-1).pop(), //.trim(),
      time: new Date(value.time * 1000),
      from_uin: value.from_uin,
      type: msg_type,
      uid: value.msg_id
    };
    if (msg_type === MsgType.Group) {
      msg.from_gid = msg.from_uin;
      msg.group_code = value.group_code;
      msg.from_uin = value.send_uin;
      msg.from_group = this.get_group({
        gid: msg.from_gid
      });
      msg.from_user = this.get_user_ingroup(msg.from_uin, msg.from_gid);
      if (!msg.from_group) {
        this.update_group_list;
      }
      if (!msg.from_user) {
        this.update_group_member({
          gid: msg.from_gid
        });
      }
      if (msg.from_group == null) {
        msg.from_group = {};
      }
      if (msg.from_user == null) {
        msg.from_user = {};
      }
      try {
        log.debug("[群组消息]", "[" + msg.from_group.name + "] " + msg.from_user.nick + ":" + msg.content + " " + msg.time);
      } catch (undefined) {}
    } else if (msg_type === MsgType.Discuss) {
      msg.from_did = value.did;
      msg.from_uin = value.send_uin;
      msg.from_dgroup = this.get_dgroup({
        did: value.did
      });
      msg.from_user = this.get_user_in_dgroup(msg.from_uin, msg.from_did);
      if (!msg.from_dgroup) {
        this.update_dgroup_list();
      }
      if (!msg.from_user) {
        this.update_dgroup_member({
          did: value.did
        });
      }
      if (msg.from_dgroup == null) {
        msg.from_dgroup = {};
      }
      if (msg.from_user == null) {
        msg.from_user = {};
      }
      try {
        log.debug("[讨论组消息]", "[" + msg.from_dgroup.name + "] " + msg.from_user.nick + ":" + msg.content + " " + msg.time);
      } catch (undefined) {}
    } else if (msg_type === MsgType.Default) {
      msg.from_user = this.get_user(msg.from_uin);
      if (!msg.from_user) {
        this.update_buddy_list();
      }
      try {
        log.debug("[好友消息]", msg.from_user.nick + ":" + msg.content + " " + msg.time);
      } catch (undefined) {}
    } else if (msg_type === MsgType.Sess) {
      msg.from_gid = value.id;
      msg.from_uin = value.from_uin;
      msg.from_group = this.get_group({
        gid: msg.from_gid
      });
      msg.from_user = this.get_user_ingroup(msg.from_uin, msg.from_gid);
      if (!msg.from_group) {
        this.update_group_list();
      }
      if (!msg.from_user) {
        this.update_group_member({
          gid: msg.from_gid
        });
      }
      if (msg.from_group == null) {
        msg.from_group = {};
      }
      if (msg.from_user == null) {
        msg.from_user = {};
      }
      try {
        log.debug("[临时消息]", msg.from_user.nick + ":" + msg.content + " " + msg.time);
      } catch (undefined) {}
    }
    if (this.config.offline_msg_keeptime && new Date().getTime() - msg.time.getTime() > this.config.offline_msg_keeptime * 1000) {
      return;
    }
    replied = false;
    reply = (function(_this) {
      return function(content) {
        if (!replied) {
          _this.reply_message(msg, content);
        }
        return replied = true;
      };
    })(this);
    return this.dispatcher.dispatch(msg.content, reply, this, msg);
  };

  QQBot.prototype.listen_group = function(name, callback) {
    log.info('fetching group list');
    return this.update_group_list((function(_this) {
      return function(ret, e) {
        log.info('√ group list fetched');
        log.info("fetching groupmember " + name);
        return _this.update_group_member({
          name: name
        }, function(ret, error) {
          var group, groupinfo;
          log.info('√ group memeber fetched');
          groupinfo = _this.get_group({
            name: name
          });
          group = new Group(_this, groupinfo.gid);
          _this.dispatcher.add_listener([group, "dispatch"]);
          return callback(group);
        });
      };
    })(this));
  };

  return QQBot;

})();


/*
  为hubot专门使用，提供两个方法
  - send
  - on_message (content,send_fun, bot , message_info) ->
*/

var Group = (function() {
  function Group(bot, gid1) {
    this.bot = bot;
    this.gid = gid1;
  }

  Group.prototype.send = function(content, callback) {
    return this.bot.send_message_to_group(this.gid, content, function(ret, e) {
      if (callback) {
        return callback(ret, e);
      }
    });
  };

  Group.prototype.on_message = function(msg_cb) {
    this.msg_cb = msg_cb;
  };

  Group.prototype.dispatch = function(content, send, robot, message) {
    if (message.from_gid === this.gid && this.msg_cb) {
      return this.msg_cb(content, send, robot, message);
    }
  };

  return Group;

})();

module.exports = QQBot;
