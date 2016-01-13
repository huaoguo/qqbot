var defaults = {};
var fs = require('fs');
var os = require('os');
var Path = require('path');

function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}
var path = Path.join(getUserHome(), '.tmp', 'store.json');

var empty = function(obj) {
  return Object.keys(obj).length === 0;
};

exports.set_path = function(newpath) {
  return path = newpath;
};

exports.data = function(key, value) {
  if (typeof empty === "function" ? empty(defaults) : void 0) {
    read();
  }
  if (key && value) {
    return defaults[key] = value;
  } else if (key) {
    return defaults[key];
  } else {
    return defaults;
  }
};

exports.save = function() {
  var dir_path = Path.join(getUserHome(), ".tmp");
  if(! fs.existsSync(dir_path)) fs.mkdirSync(dir_path);

  return fs.writeFileSync(path, JSON.stringify(defaults));
};

var read = exports.read = function() {
  var error, error1;
  try {
    return defaults = JSON.parse(fs.readFileSync(path));
  } catch (error1) {
    error = error1;
    return console.log(error);
  }
};
