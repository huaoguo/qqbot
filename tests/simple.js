var log, prompt, test1, test2, test3, test4, test5, test6, test7, test8, test_prompt;

log = console.log;

prompt = function(title, callback) {
  process.stdin.resume();
  process.stdout.write(title);
  process.stdin.once("data", function(data) {
    callback(data.toString().trim());
    return process.stdin.pause();
  });
  return process.stdin.on('end', function() {
    process.stdout.write('end');
    return callback();
  });
};

test_prompt = function() {
  log("hello");
  prompt("input something", function(content) {
    return log(content);
  });
  return log("end");
};

test1 = function() {
  var i, k, results, v;
  log('begin');
  k = {
    a: 10,
    b: 20,
    c: 30
  };
  results = [];
  for (i in k) {
    v = k[i];
    results.push(log(i, v));
  }
  return results;
};

test2 = function() {
  var j, k, len, ref, ref1, results, v;
  ref = [10, 2, 3];
  for (j = 0, len = ref.length; j < len; j++) {
    v = ref[j];
    log(v);
  }
  ref1 = {
    a: 10,
    b: 20
  };
  results = [];
  for (k in ref1) {
    v = ref1[k];
    results.push(log(k, v));
  }
  return results;
};

test3 = function() {
  var QQBot, bot;
  QQBot = require('../src/qqbot');
  bot = new QQBot(100);
  bot.save_buddy_info({
    buddy: 100000
  });
  return log(bot);
};

test4 = function() {
  var OOO, v;
  OOO = (function() {
    var test;

    function OOO(name) {
      this.name = name;
    }

    OOO.prototype.ask = function() {
      log("ask", this.name);
      return test();
    };

    test = function() {
      return log("test");
    };

    OOO.prototype.ask2 = function() {
      log("ask2");
      return setTimeout((function(_this) {
        return function() {
          return _this.ask();
        };
      })(this), 500);
    };

    test2 = function() {
      log("test2");
      return test();
    };

    return OOO;

  })();
  v = new OOO('名字');
  v.ask2();
  return log(v.name);
};

test5 = function() {
  var test;
  test = require('hubot-qq');
  return log(test);
};

test6 = function() {
  exports.xx = function() {
    return log("xxxxx");
  };
  return exports.xx();
};

test7 = function() {
  log("hello");
  setTimeout(function() {});
  return log("next", 300);
};

test8 = function() {
  var Readable, rs;
  process.stdin.on("data", function(data) {
    data = data.toString().trim();
    return console.log('received: ', data);
  });
  process.stdin.on('end', function() {
    return console.log('end');
  });
  Readable = require('stream').Readable;
  rs = new Readable();
  rs.push('beep ');
  rs.push('boop\n');
  rs.push(null);
  return process.stdin.resume();
};

test8();
