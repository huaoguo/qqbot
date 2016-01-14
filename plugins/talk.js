module.exports = function(content, send, robot, message) {
  if (content === 'hello') {
    send('world');
  }
  return "nothing";
};
