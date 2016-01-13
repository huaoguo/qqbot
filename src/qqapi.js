/*
  QQAPI 包含获取好友，群信息，发送消息，长轮询
  - 使用前需要设置 cookies()
*/

var all_cookies, change_status, client, cookies, fs, get_buddy_list, get_discuss_list, get_discuss_member, get_friend_uin2, get_group_list, get_group_member, jsons, log, long_poll, msg_id, send_msg_2buddy, send_msg_2discuss, send_msg_2group, send_msg_2sess;

all_cookies = [];

fs = require('fs');

jsons = JSON.stringify;

client = require('./httpclient');

log = new (require('log'))('debug');

msg_id = 43690001;

cookies = function(cookie) {
  if (cookie) {
    all_cookies = cookie;
    client.global_cookies(all_cookies);
  }
  return all_cookies;
};


/*
 * 长轮询，默认一分钟
 *  @param : [clientid,psessionid]
 *  @param callback: ret, e  callback 返回值 true 才会循环 loop poll
 *  @return ret retcode 102，正常空消息
 */

long_poll = function(auth_opts, callback) {
  log.debug("polling...");
  var params = {
    r: JSON.stringify({
      ptwebqq: auth_opts.ptwebqq,
      clientid: auth_opts.clientid,
      psessionid: auth_opts.psessionid,
      key: ""
    })
  };
  //log.debug("params: " + params.r);
  return client.post({
    url: "http://d1.web2.qq.com/channel/poll2"
  }, params, function(ret, e) {
    var need_next_runloop = callback(ret, e);
    if (need_next_runloop) {
      return long_poll(auth_opts, callback);
    }
  });
};

var hash_func = function(x, K) {
  x += "";
  for (var N = [], T = 0; T < K.length; T++) N[T % 4] ^= K.charCodeAt(T);
  var U = ["EC", "OK"],
      V = [];
  V[0] = x >> 24 & 255 ^ U[0].charCodeAt(0);
  V[1] = x >> 16 & 255 ^ U[0].charCodeAt(1);
  V[2] = x >> 8 & 255 ^ U[1].charCodeAt(0);
  V[3] = x & 255 ^ U[1].charCodeAt(1);
  U = [];
  for (T = 0; T < 8; T++) U[T] = T % 2 == 0 ? N[T >> 1] : V[T >> 1];
  N = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];
  V = "";
  for (T = 0; T < U.length; T++) {
    V += N[U[T] >> 4 & 15];
    V += N[U[T] & 15]
  }
  return V;
};

get_buddy_list = function(auth_opts, callback) {
  var opt, r, url;
  opt = auth_opts;
  url = "http://s.web2.qq.com/api/get_user_friends2";
  r = {
    hash: hash_func(opt.uin, opt.ptwebqq),
    vfwebqq: opt.vfwebqq
  };
  return client.post({
    url: url
  }, {
    r: jsons(r)
  }, function(ret, e) {
    return callback(ret, e);
  });
};

get_friend_uin2 = function(tuin, type, auth_opts, callback) {
  var opt, params, url;
  opt = auth_opts;
  url = "http://s.web2.qq.com/api/get_friend_uin2";
  params = {
    tuin: tuin,
    type: type,
    vfwebqq: opt.vfwebqq,
    t: new Date().getTime()
  };
  return client.get(url, params, function(ret, e) {
    return callback(ret, e);
  });
};

send_msg_2buddy = function(to_uin, msg, auth_opts, callback) {
  var opt, params, r, url;
  url = "http://d1.web2.qq.com/channel/send_buddy_msg2";
  opt = auth_opts;
  r = {
    to: to_uin,
    face: 0,
    msg_id: msg_id++,
    clientid: opt.clientid,
    psessionid: opt.psessionid,
    content: jsons([
      "" + msg, [
        "font", {
          name: "宋体",
          size: "10",
          style: [0, 0, 0],
          color: "000000"
        }
      ]
    ])
  };
  params = {
    r: jsons(r)
  };
  return client.post({
    url: url
  }, params, function(ret, e) {
    log.debug('send2user', jsons(ret));
    if (callback) {
      return callback(ret, e);
    }
  });
};

send_msg_2sess = function(to_gid, to_uin, msg, auth_opts, callback) {
  var opt, url;
  opt = auth_opts;
  url = "http://d1.web2.qq.com/channel/get_c2cmsg_sig2?id=" + to_gid + "&to_uin=" + to_uin + "&clientid=" + opt.clientid + "&psessionid=" + opt.psessionid + "&service_type=0&t=" + new Date().getTime();
  return client.get(url, function(ret, e) {
    var params, r;
    if (!e) {
      url = "http://d1.web2.qq.com/channel/send_sess_msg2";
      r = {
        to: to_uin,
        face: 594,
        msg_id: msg_id++,
        clientid: opt.clientid,
        psessionid: opt.psessionid,
        group_sig: ret.result.value,
        content: jsons([
          "" + msg, [
            "font", {
              name: "宋体",
              size: "10",
              style: [0, 0, 0],
              color: "000000"
            }
          ]
        ])
      };
      params = {
        r: jsons(r)
      };
      return client.post({
        url: url
      }, params, function(ret, e) {
        log.debug('send2user', jsons(ret));
        if (callback) {
          return callback(ret, e);
        }
      });
    }
  });
};

get_group_list = function(auth_opts, callback) {
  var aurl, r;
  aurl = "http://s.web2.qq.com/api/get_group_name_list_mask2";
  r = {
    vfwebqq: auth_opts.vfwebqq,
    hash: hash_func(auth_opts.uin, auth_opts.ptwebqq)
  };
  return client.post({
    url: aurl
  }, {
    r: jsons(r)
  }, function(ret, e) {
    if (callback) {
      return callback(ret, e);
    }
  });
};

get_group_member = function(group_code, auth_opts, callback) {
  var params, url;
  url = "http://s.web2.qq.com/api/get_group_info_ext2";
  params = {
    gcode: group_code,
    vfwebqq: auth_opts.vfwebqq,
    t: new Date().getTime()
  };
  return client.get(url, params, callback);
};

send_msg_2group = function(gid, msg, auth_opts, callback) {
  var opt, params, r, url;
  url = 'http://d1.web2.qq.com/channel/send_qun_msg2';
  opt = auth_opts;
  r = {
    group_uin: gid,
    content: jsons([
      "" + msg, [
        "font", {
          name: "宋体",
          size: 10,
          style: [0, 0, 0],
          color: "000000"
        }
      ]
    ]),
    face: 573,
    clientid: opt.clientid,
    msg_id: msg_id++,
    psessionid: opt.psessionid
  };
  params = {
    r: jsons(r)
  };
  return client.post({
    url: url
  }, params, function(ret, e) {
    log.debug('send2group', jsons(ret));
    if (callback) {
      return callback(ret, e);
    }
  });
};

get_discuss_list = function(auth_opts, callback) {
  var params, url;
  url = "http://s.web2.qq.com/api/get_discus_list";
  params = {
    clientid: auth_opts.clientid,
    psessionid: auth_opts.psessionid,
    vfwebqq: auth_opts.vfwebqq,
    t: new Date().getTime()
  };
  return client.get(url, params, callback);
};

get_discuss_member = function(discuss_id, auth_opts, callback) {
  var params, url;
  url = "http://d1.web2.qq.com/channel/get_discu_info";
  params = {
    did: discuss_id,
    clientid: auth_opts.clientid,
    psessionid: auth_opts.psessionid,
    vfwebqq: auth_opts.vfwebqq,
    t: new Date().getTime()
  };
  return client.get(url, params, callback);
};

send_msg_2discuss = function(discuss_id, msg, auth_opts, callback) {
  var opt, params, r, url;
  url = "http://d1.web2.qq.com/channel/send_discu_msg2";
  opt = auth_opts;
  r = {
    did: "" + discuss_id,
    msg_id: msg_id++,
    face: 573,
    clientid: opt.clientid,
    psessionid: opt.psessionid,
    content: jsons([
      "" + msg, [
        "font", {
          name: "宋体",
          size: 10,
          style: [0, 0, 0],
          color: "000000"
        }
      ]
    ])
  };
  params = {
    r: jsons(r),
    clientid: opt.clientid,
    psessionid: opt.psessionid
  };
  return client.post({
    url: url
  }, params, function(ret, e) {
    log.debug('send2discuss', jsons(ret));
    if (callback) {
      return callback(ret, e);
    }
  });
};

change_status = function(status, auth_opts, callback) {};

module.exports = {
  cookies: cookies,
  long_poll: long_poll,
  get_buddy_list: get_buddy_list,
  get_friend_uin2: get_friend_uin2,
  send_msg_2buddy: send_msg_2buddy,
  send_msg_2sess: send_msg_2sess,
  get_group_list: get_group_list,
  get_group_member: get_group_member,
  send_msg_2group: send_msg_2group,
  get_discuss_list: get_discuss_list,
  get_discuss_member: get_discuss_member,
  send_msg_2discuss: send_msg_2discuss
};
