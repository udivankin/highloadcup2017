const { prefetchData } = require('./storage');
const createServer = require('./server');
const { forceGc } = require('./helpers');
const port = process.argv[2];

console.time('Prefetch');
prefetchData();
console.timeEnd('Prefetch');

forceGc();

createServer(port);
