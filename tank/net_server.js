const net = require('net');
const port = 8080;

const headers200 = (content) => (
  'HTTP/1.1 200 OK\n' +
  'Connection: close\n' +
  'Content-Length: ' + content.length + '\n\n' +
  content
);

const headers400 = (
  'HTTP/1.1 400 Bad Request\n' + // todo do not write Bad Request
  'Connection: close\n' +
  'Content-Type: text/html; charset=UTF-8\n' +
  'Content-Length: 0'
);

const headers404 = (
  'HTTP/1.1 404 Not Found\n' + // todo do not write Not Found
  'Connection: close\n' +
  'Content-Type: text/html; charset=UTF-8\n' +
  'Content-Length: 0'
);

const bufferEmpty200 = new Buffer(headers200('OK'), 'utf-8');
const buffer400 = new Buffer(headers200, 'utf-8');
const buffer404 = new Buffer(headers200, 'utf-8');

/*
 * Callback method executed when a new TCP socket is opened.
 */
function newSocket(socket) {
  socket.setNoDelay();

  socket.on('data', (data) => {
    // console.log(data.toString());
    socket.cork();
    socket.write(bufferEmpty200);
    socket.uncork();
    socket.end();
  });

  socket.on('error', (e) => console.log('error', e));
  socket.on('end', (a) => {

    // console.log('end', a);

  });
  socket.on('close', (a) => {
    // console.log('close and unref', a);
    socket.unref();
  });
  socket.on('drain', (a) => console.log('drain', a));

  // socket.on('data', (data) => {
  //   let m = data.toString().replace(/[\n\r]*$/, '');
  //   console.log(`We got your message (${m}). Thanks!\n`);
  // });
  //
  // socket.on('end', () => {
  //   console.log(`disconnected.`);
  // });
}

// Create a new server and provide a callback for when a connection occurs
var server = net.createServer(newSocket);

// Listen on port 8888
server.listen(port);
