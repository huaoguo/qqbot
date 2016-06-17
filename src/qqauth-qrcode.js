'use strict';

function getUserHome() {
  return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}

const fs = require('fs');
const http = require('http');
const Path = require('path');
const Log = require('log');
const client = require('./httpclient');

const log = new Log('debug');

const client_id = 53999199;

const prepare_login = function (callback) {
  client.update_cookies('RK=OfeLBai4FB; ptcz=ad3bf14f9da2738e09e498bfeb93dd9da7540dea2b7a71acfb97ed4d3da4e277; pgv_pvi=911366144; ptisp=ctc; pgv_info=ssid=s5714472750; pgv_pvid=1051433466; qrsig=hJ9GvNx*oIvLjP5I5dQ19KPa3zwxNI62eALLO*g2JLbKPYsZIRsnbJIxNe74NzQQ;'.split(' '));
  const url = 'https://ui.ptlogin2.qq.com/cgi-bin/login?daid=164&target=self&style=16&mibao_css=m_webqq&appid=501004106&enable_qlogin=0&no_verifyimg=1&s_url=http%3A%2F%2Fw.qq.com%2Fproxy.html&f_url=loginerroralert&strong_login=1&login_state=10&t=20131024001';

  return client.url_get(url, function (err, resp, body) {
    return callback([]);
  });
};

const check_qq_verify = function (callback) {
  const options = {
    protocol: 'https:',
    host: 'ssl.ptlogin2.qq.com',
    path: '/ptqrlogin?webqq_type=10&remember_uin=1&login2qq=1&aid=501004106&u1=http%3A%2F%2Fw.qq.com%2Fproxy.html%3Flogin2qq%3D1%26webqq_type%3D10&ptredirect=0&ptlang=2052&daid=164&from_ui=1&pttype=1&dumy=&fp=loginerroralert&action=0-0-' + (Math.random() * 900000 + 1000000) + '&mibao_css=m_webqq&t=undefined&g=1&js_type=0&js_ver=10141&login_sig=&pt_randsalt=0',
    headers: {
      'Cookie': client.get_cookies_string(),
      'Referer':'https://ui.ptlogin2.qq.com/cgi-bin/login?daid=164&target=self&style=16&mibao_css=m_webqq&appid=501004106&enable_qlogin=0&no_verifyimg=1&s_url=http%3A%2F%2Fw.qq.com%2Fproxy.html&f_url=loginerroralert&strong_login=1&login_state=10&t=20131024001'
    }
  };

  return client.url_get(options, function (err, resp, body) {
    const ret = body.match(/\'(.*?)\'/g).map(function (i) {
      const last = i.length - 2;
      return i.substr(1, last);
    });
    return callback(ret);
  });
};

let img_server = null;

const create_img_server = function (host, port, body, origin_headers) {
  if (img_server) {
    return;
  }

  const dir_path = Path.join(getUserHome(), '.tmp');
  if (! fs.existsSync(dir_path)) {
    fs.mkdirSync(dir_path);
  }

  const file_path = Path.join(getUserHome(), '.tmp', 'qrcode.jpg');
  fs.writeFileSync(file_path, body, 'binary');

  if (process.platform !== 'darwin') {
    img_server = http.createServer(function (req, res) {
      res.writeHead(200, origin_headers);
      res.end(body, 'binary');
    });
    img_server.listen(port);
  }
};

const stop_img_server = function () {
  if (img_server) {
    img_server.close();
  }
  img_server = null;
};

const get_qr_code = function (qq, host, port, callback) {
  const url = 'https://ssl.ptlogin2.qq.com/ptqrshow?appid=501004106&e=0&l=M&s=5&d=72&v=4&t=' + Math.random();

  return client.url_get(url, function (err, resp, body) {
    create_img_server(host, port, body, resp.headers);
    return callback();
  }, function (resp) {
    resp.setEncoding('binary');
  });
};

const finish_verify_code = function () {
  stop_img_server();
};

const get_ptwebqq = function (url, callback) {
  return client.url_get(url, function (err, resp, body) {
    // console.log(body);
    if (! err)
      return callback(body);
  });
};

const get_vfwebqq = function (ptwebqq, callback) {
  return client.url_get({
    method: 'GET',
    protocol: 'http:',
    host: 's.web2.qq.com',
    path: '/api/getvfwebqq?ptwebqq=' + ptwebqq + '&clientid=' + client_id + '&psessionid=&t=' + Math.random(),
    headers: {
      'Cookie': client.get_cookies_string(),
      'Origin': 'http://s.web2.qq.com',
      'Referer': 'http://s.web2.qq.com/proxy.html?v=20130916001&callback=1&id=1',
    }
  }, function (err, resp, body) {
    // console.log(body);
    const ret = JSON.parse(body);
    return callback(ret);
  });
};

const login_token = function (ptwebqq, psessionid, callback) {
  if (! psessionid) psessionid = null;
  const form = {
    r: JSON.stringify({
      ptwebqq: ptwebqq,
      clientid: client_id,
      psessionid: psessionid || '',
      status: 'online'
    })
  };
  return client.url_post({
    protocol: 'http:',
    host: 'd1.web2.qq.com',
    path: '/channel/login2',
    method: 'POST',
    headers: {
      'Origin': 'http://d1.web2.qq.com',
      'Referer': 'http://d1.web2.qq.com/proxy.html?v=20151105001&callback=1&id=2'
    }
  }, form, function (err, resp, body) {
    // console.log(body);
    const ret = JSON.parse(body);
    return callback(ret);
  });
};

const get_buddy = function (vfwebqq, psessionid, callback) {
  return client.url_get({
    method: 'GET',
    protocol: 'http:',
    host: 'd1.web2.qq.com',
    path: '/channel/get_online_buddies2?vfwebqq=' + vfwebqq + '&clientid=' + client_id + '&psessionid=' + psessionid + '&t=' + Math.random(),
    headers: {
      'Cookie': client.get_cookies_string(),
      'Origin': 'http://d1.web2.qq.com',
      'Referer': 'http://d1.web2.qq.com/proxy.html?v=20151105001&callback=1&id=2'
    }
  }, function (err, resp, body) {
    // console.log(body);
    const ret = JSON.parse(body);
    return callback(ret);
  });
};

const auto_login = function (ptwebqq, callback) {
  log.info('登录 step3 获取 vfwebqq');
  return get_vfwebqq(ptwebqq, function (ret) {
    if (ret.retcode === 0) {
      const vfwebqq = ret.result.vfwebqq;

      log.info('登录 step4 获取 uin, psessionid');
      return login_token(ptwebqq, null, function (ret) {
        if (ret.retcode === 0) {
          log.info('登录成功');
          const auth_options = {
            clientid: client_id,
            ptwebqq: ptwebqq,
            vfwebqq: vfwebqq,
            uin: ret.result.uin,
            psessionid: ret.result.psessionid
          };
          // console.log(auth_options);
          log.info('登录 step5 获取 好友列表');
          return get_buddy(vfwebqq, ret.result.psessionid, function (ret) {
            return callback(client.get_cookies(), auth_options);
          });
        } else {
          log.info('登录失败');
          return log.error(ret);
        }
      });
    } else {
      log.info('登录失败');
      return log.error(ret);
    }
  });
};

const wait_scan_qrcode = function (callback) {
  log.info('登录 step1 等待二维码校验结果');
  return check_qq_verify(function (ret) {
    const retcode = parseInt(ret[0], 10);
    if (retcode === 0 && ret[2].match(/^http/)) {
      log.info('登录 step2 cookie 获取 ptwebqq');
      return get_ptwebqq(ret[2], function (ret) {
        const ptwebqq = client.get_cookies().filter(function (item) {
          return item.match(/ptwebqq/);
        }).pop().replace(/ptwebqq\=(.*?);.*/, '$1');

        return auto_login(ptwebqq, callback);
      });

    } else if (retcode === 66 || retcode === 67) {
      setTimeout(wait_scan_qrcode, 1000, callback);
    } else {
      log.error('登录 step1 failed', ret);
    }
  });
};

const auth_with_qrcode = function (opt, callback) {
  const qq = opt.account;

  log.info('登录 step0.5 获取二维码');
  return get_qr_code(qq, opt.host, opt.port, function (error) {
    if (process.platform === 'darwin') {
      log.notice('请用 手机QQ 扫描该二维码');
      const file_path = Path.join(getUserHome(), '.tmp', 'qrcode.jpg');
      require('child_process').exec('open ' + file_path);
    } else {
      log.notice('请用 手机QQ 扫描该地址的二维码图片->', 'http://' + opt.host + ':' + opt.port);
    }

    return wait_scan_qrcode(callback);
  });
};

/*
  全局登录函数，如果有验证码会建立一个 http-server ，同时写入 tmp/*.jpg (osx + open. 操作)
  http-server 的端口和显示地址可配置
  @param options {account,password,port,host}
  @callback( cookies , auth_options ) if login success
*/

const login = function (options, callback) {
  const opt = options;
  return prepare_login(function (result) {
    log.info('登录 step0 - 登录方式检测');
    return check_qq_verify(function (ret) {
      const need_verify = parseInt(ret[0], 10);
      if (need_verify == 65 || need_verify == 66) {
        return auth_with_qrcode(opt, callback);
      }
      console.log(result);
    });
  });
};

module.exports = {
  prepare_login: prepare_login,
  check_qq_verify: check_qq_verify,
  get_qr_code: get_qr_code,
  get_ptwebqq: get_ptwebqq,
  get_vfwebqq: get_vfwebqq,
  login_token: login_token,
  get_buddy: get_buddy,
  finish_verify_code: finish_verify_code,
  auth_with_qrcode: auth_with_qrcode,
  auto_login: auto_login,
  login: login
};
