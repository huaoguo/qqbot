var http_get, slice = [].slice;

http_get = function() {
  var args, callback, params, ref, url;
  args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
  url = args[0], params = args[1], callback = args[2];
  if (!callback) {
    ref = [null, params], params = ref[0], callback = ref[1];
  }
  console.log(url);
  console.log(params);
  return console.log(callback);
};

http_get(1, 2, 3);
