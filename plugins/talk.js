module.exports = function(content, send, robot, message) {
  if (content.indexOf('hello') >= 0) {
    send('world');
  }
  return "nothing";
};
