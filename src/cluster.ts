const Master = require('./master');

exports.startCluster = function(options) {
  new Master(options);
};