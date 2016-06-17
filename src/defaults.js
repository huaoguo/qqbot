'use strict';

let defaults = {};
const fs = require('fs');
const Path = require('path');

function getUserHome() {
  return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}
let path = Path.join(getUserHome(), '.tmp', 'store.json');

const empty = function (obj) {
  return Object.keys(obj).length === 0;
};

exports.set_path = function (newpath) {
  path = newpath;
};

exports.save = function () {
  const dir_path = Path.join(getUserHome(), '.tmp');
  if (! fs.existsSync(dir_path)) {
    fs.mkdirSync(dir_path);
  }

  return fs.writeFileSync(path, JSON.stringify(defaults));
};

const read = exports.read = function () {
  try {
    defaults = JSON.parse(fs.readFileSync(path));
  } catch (error) {
    console.log(error);
  }
};

exports.data = function (key, value) {
  if (typeof empty === 'function' ? empty(defaults) : void 0) {
    read();
  }
  if (key && value) {
    defaults[key] = value;
  } else if (key) {
    return defaults[key];
  } else {
    return defaults;
  }
};
