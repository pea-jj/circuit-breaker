const startCluster = require('../dist/cluster').startCluster;
const path = require('path');

startCluster({path: path.join(__dirname, 'app.js')})