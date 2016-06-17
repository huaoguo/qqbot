'use strict';

module.exports = function (content, send, robot, message) {
  console.log(message.from_user);
  if (content === 'roll') {
    const num = Math.round(Math.random() * 100);
    send(`${message.from_user.nick} 扔出了 ${num} 点`);
  }
};
