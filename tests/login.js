var after_logined, api, auth, config, defaults, int, jsons, log, login_next, pass, prompt, qq, test_after_login, test_check_qq, test_encode_password, test_encode_password2, test_get_verify_code, test_login_full, test_login_on_authmodule, test_login_token;

int = function(v) {
  return parseInt(v);
};

log = console.log;

auth = require("../src/qqauth");

api = require("../src/qqapi");

jsons = JSON.stringify;

defaults = require('../src/defaults');

config = require('../config');

qq = config.account;

pass = config.password;

prompt = function(title, callback) {
  process.stdin.resume();
  process.stdout.write(title);
  process.stdin.on("data", function(data) {
    data = data.toString().trim();
    if (data) {
      callback(data);
      return process.stdin.pause();
    }
  });
  return process.stdin.on('end', function() {
    process.stdout.write('end');
    return callback();
  });
};

test_check_qq = function() {
  return auth.check_qq_verify('123774072', function(result) {
    log(int(result[0]));
    log(result[1]);
    return log(result[2]);
  });
};

test_encode_password = function() {
  return log(auth.encode_password(pass, "!PYL", '\\x00\\x00\\x00\\x00\\x07\\x60\\xa4\\x78'));
};

test_encode_password2 = function() {
  return log(auth.encode_password(pass, 'zkmm', '\\x00\\x00\\x00\\x00\\xa5\\x13\\xed\\x18'));
};

test_login_full = function() {
  log("验证帐号...");
  return auth.check_qq_verify(qq, function(result) {
    var bits, is_need_verify_code, new_pass, verify_code;
    is_need_verify_code = int(result[0]);
    verify_code = result[1];
    bits = result[2];
    if (is_need_verify_code) {
      log("需要验证码...获取中...");
      return auth.get_verify_code(qq, config.host, config.port, function(error) {
        require('child_process').exec('open tmp');
        log("http://" + config.host + ":" + config.port);
        return prompt("输入验证码:", function(code) {
          var new_pass;
          auth.finish_verify_code();
          verify_code = code;
          log('验证码：', verify_code);
          new_pass = auth.encode_password(pass, verify_code, bits);
          return login_next(qq, new_pass, verify_code);
        });
      });
    } else {
      new_pass = auth.encode_password(pass, verify_code, bits);
      return login_next(qq, new_pass, verify_code);
    }
  });
};

login_next = function(qq, encoded_pass, verify_code) {
  log("开始登录1 密码校验");
  return auth.login_step1(qq, encoded_pass, verify_code, function(ret) {
    log('登录结果');
    log(ret);
    if (!ret[2].match(/^http/)) {
      return;
    }
    log("开始登录2 cookie获取");
    return auth.login_step2(ret[2], function(ret) {
      log("开始登录3 token 获取");
      return auth.login_token(function(ret, client_id, ptwebqq) {
        if (ret.retcode === 0) {
          log('登录成功');
          api.cookies(auth.cookies());
          api.defaults('psessionid', ret.result.psessionid);
          api.defaults('clientid', client_id);
          api.defaults('ptwebqq', ptwebqq);
          api.defaults('uin', ret.result.uin);
          api.defaults('vfwebqq', ret.result.vfwebqq);
          api.defaults_save();
          return after_logined();
        } else {
          log("登录失败");
          return log(ret);
        }
      });
    });
  });
};

after_logined = function() {
  var auth_opts, clientid, psessionid, ptwebqq, uin, vfwebqq;
  psessionid = api.defaults('psessionid');
  clientid = api.defaults('clientid');
  ptwebqq = api.defaults('ptwebqq');
  uin = api.defaults('uin');
  vfwebqq = api.defaults('vfwebqq');
  auth_opts = {
    psessionid: psessionid,
    clientid: clientid,
    ptwebqq: ptwebqq,
    uin: uin,
    vfwebqq: vfwebqq
  };
  log("轮训");
  return api.long_poll(auth_opts, function(ret) {
    return log(jsons(ret));
  });
};

test_login_token = function() {
  return auth.post(function(ret) {
    return log(ret);
  });
};

test_get_verify_code = function() {
  return auth.get_verify_code(qq, config.host, config.port, function(error) {
    return log('oh yeah');
  });
};

test_after_login = function() {
  api.defaults_read();
  return after_logined();
};

test_login_on_authmodule = function() {
  return auth.login(config, function(cookies, auth_info) {
    log(auth_info);
    defaults.data('auth', auth_info);
    defaults.data('cookie', cookies);
    defaults.save();
    api.cookies(cookies);
    return api.long_poll(auth_info, function(ret) {
      return log(jsons(ret));
    });
  });
};

test_login_on_authmodule();
