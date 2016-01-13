var Dispatcher, EventEmitter, Log, log, requireForce,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

Log = require('log');

log = new Log('debug');

EventEmitter = require('events').EventEmitter;

requireForce = function(module_name) {
  var error, error1;
  try {
    delete require.cache[require.resolve(module_name)];
    return require(module_name);
  } catch (error1) {
    error = error1;
    log.error("Load module " + (JSON.stringify(module_name)) + " failed");
    return log.error(JSON.stringify(error));
  }
};

Dispatcher = (function(superClass) {
  extend(Dispatcher, superClass);

  function Dispatcher(plugins, robot) {
    this.plugins = plugins != null ? plugins : [];
    this.robot = robot;
    this.listeners = [];
    this.obj_listeners = [];
    this.stop_funcs = [];
    this.reload_plugin();
  }

  Dispatcher.prototype.dispatch = function() {
    var error, error1, i, j, len, len1, method, obj, params, plugin, ref, ref1, results;
    params = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    try {
      ref = this.listeners;
      for (i = 0, len = ref.length; i < len; i++) {
        plugin = ref[i];
        plugin.apply(null, params);
      }
      ref1 = this.obj_listeners;
      results = [];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        plugin = ref1[j];
        obj = plugin[0], method = plugin[1];
        results.push(obj[method].apply(obj, params));
      }
      return results;
    } catch (error1) {
      error = error1;
      return log.error(error);
    }
  };


  /*
    针对 对象的方法
    请传入 [obj,'methodname']
    methodname 直接调用 methodname 会破坏内部变量 this.xxx
  */

  Dispatcher.prototype.add_listener = function(listener) {
    if (listener instanceof Function) {
      return this.listeners.push(listener);
    } else {
      return this.obj_listeners.push(listener);
    }
  };

  Dispatcher.prototype.stop_plugin = function() {
    var func, i, len, ref, results;
    ref = this.stop_funcs;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      func = ref[i];
      results.push(func(this.robot));
    }
    return results;
  };

  Dispatcher.prototype.reload_plugin = function() {
    var i, len, plugin, plugin_name, ref, results;
    this.stop_plugin();
    this.listeners = [];
    ref = this.plugins;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      plugin_name = ref[i];
      log.debug("Loading Plugin " + plugin_name);
      plugin = requireForce("../plugins/" + plugin_name);
      if (plugin) {
        if (plugin instanceof Function) {
          results.push(this.listeners.push(plugin));
        } else {
          if (plugin.received) {
            this.listeners.push(plugin.received);
          }
          if (plugin.init) {
            plugin.init(this.robot);
          }
          if (plugin.stop) {
            results.push(this.stop_funcs.push(plugin.stop));
          } else {
            results.push(void 0);
          }
        }
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  return Dispatcher;

})(EventEmitter);

module.exports = Dispatcher;
