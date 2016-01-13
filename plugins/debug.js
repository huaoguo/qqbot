/*
  send group|buddy|discuss name message
  reload
  relogin
  run method
*/

module.exports = function(content, send, robot, message) {
  var group, method, msg, ref, ret, to, type;
  if (content.match(/^die$/i)) {
    robot.die("debug");
  }
  if (content.match(/^reload$/i)) {
    robot.dispatcher.reload_plugin();
    send("重新加载插件");
  }
  if (content.match(/^relogin$/i)) {
    robot.relogin(function(success) {
      return send(success ? "成功" : "失败");
    });
  }
  ret = content.match(/^run\s+(.*)/i);
  if (ret) {
    method = ret[1];
    console.log(method);
    robot[method]();
  }
  ret = content.match(/^send\s+(.*?)\s+(.*?)\s+(.*)/i);
  if (ret) {
    ref = ret.slice(1, 4), type = ref[0], to = ref[1], msg = ref[2];
    switch (type) {
    case 'group':
      group = robot.get_group({
        name: to
      });
      return robot.send_message_to_group(group, msg, function(ret, e) {
        if (e) {
          return send("消息发送失败 " + e);
        } else {
          return send("消息已发送");
        }
      });
    case 'buddy':
      return "";
    case 'discuss':
      return "";
    }
  }
};
