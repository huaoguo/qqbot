'use strict';

const hasProp = {}.hasOwnProperty;
const slice = [].slice;
const Log = require('log');
const log = new Log('debug');
const EventEmitter = require('events').EventEmitter;

const extend = function (child, parent) {
  for (const key in parent) {
    if (hasProp.call(parent, key)) {
      child[key] = parent[key];
    }
  }
  function ctor() {
    this.constructor = child;
  }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
  child.__super__ = parent.prototype; return child;
};

const requireForce = function (module_name) {
  try {
    delete require.cache[require.resolve(module_name)];
    return require(module_name);
  } catch (error) {
    log.error('Load module ' + (JSON.stringify(module_name)) + ' failed');
    log.error(JSON.stringify(error));
  }
};

const Dispatcher = (function (superClass) {
  extend(Dispatcher, superClass);

  function Dispatcher(plugins, robot) {
    this.plugins = plugins ? plugins : [];
    this.robot = robot;
    this.listeners = [];
    this.obj_listeners = [];
    this.stop_funcs = [];
    this.reload_plugin();
  }

  Dispatcher.prototype.dispatch = function () {
    const params = arguments.length >= 1 ? slice.call(arguments, 0) : [];
    try {
      const ref = this.listeners;
      for (let i = 0, len = ref.length; i < len; i++) {
        const plugin = ref[i];
        plugin.apply(null, params);
      }
      const ref1 = this.obj_listeners;
      const results = [];
      for (let j = 0, len1 = ref1.length; j < len1; j++) {
        const plugin = ref1[j];
        const obj = plugin[0], method = plugin[1];
        results.push(obj[method].apply(obj, params));
      }
      return results;
    } catch (error) {
      log.error(error);
    }
  };

  /*
    针对 对象的方法
    请传入 [obj,'methodname']
    methodname 直接调用 methodname 会破坏内部变量 this.xxx
  */

  Dispatcher.prototype.add_listener = function (listener) {
    if (listener instanceof Function) {
      return this.listeners.push(listener);
    }
    return this.obj_listeners.push(listener);
  };

  Dispatcher.prototype.stop_plugin = function () {
    const ref = this.stop_funcs;
    const results = [];
    for (let i = 0, len = ref.length; i < len; i++) {
      const func = ref[i];
      results.push(func(this.robot));
    }
    return results;
  };

  Dispatcher.prototype.reload_plugin = function () {
    this.stop_plugin();
    this.listeners = [];
    const ref = this.plugins;
    const results = [];
    for (let i = 0, len = ref.length; i < len; i++) {
      const plugin_name = ref[i];
      log.debug('Loading Plugin ' + plugin_name);
      const plugin = requireForce('../plugins/' + plugin_name);
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
