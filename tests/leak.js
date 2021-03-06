var Bot, Group, group, log;

log = new (require('log'))('debug');

Group = (function() {
  function Group() {}

  Group.prototype.on = function(callback1) {
    this.callback = callback1;
  };

  Group.prototype.dispatch = function(msg) {
    log.info('dispatch', msg);
    if (this.callback) {
      return this.callback(msg);
    }
  };

  Group.prototype.cb = function() {
    return this.callback;
  };

  return Group;

})();

Bot = (function() {
  function Bot(list) {
    this.list = list != null ? list : [];
    setInterval((function(_this) {
      return function() {
        var i, len, o, ref, results;
        ref = _this.list;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          o = ref[i];
          results.push(o('bbb'));
        }
        return results;
      };
    })(this), 500);
  }

  Bot.prototype.listen_group = function(name, callback) {
    var group;
    group = new Group();
    this.list.push(group.dispatch);
    return callback(group);
  };

  return Bot;

})();


/* DEMO1
   bot = new Bot()
   * ggg = null
   bot.listen_group 'group', (group)->
   group.on (msg)->
   log.info '- received',msg
   group.dispatch 'aaa'
   
   k = group.dispatch 
   k('single')
   * ggg = group
   */


/*期待
  dispatch
  - receive
  dispatch
  - receive
  
  实际结果
  dispatch only
  
  原因猜测
  - js中没class概念 传给list的是个函数，破坏了里面的 this.xx 的概念
*/

group = new Group();

group.on(function(msg) {
  return log.info('- received', msg);
});

group.dispatch('kk');

group['dispatch']('str');
