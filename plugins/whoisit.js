'use strict';

const regex = /(日|干|搞|上|操)(.+)/;

module.exports = function(content, send, robot, message) {
  let ret = content.match(regex);
  if (ret) {
    // 根据逗号和空格分句
    let who = ret[2].split(/,|，|\s/)[0];
    send(`${who} 是谁`);
  }
};
