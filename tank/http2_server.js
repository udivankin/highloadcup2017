const http2 = require('http2');

function requestHandler(request, response) {
  console.log(request);
    response.end('ok');
};

const server = http2.createServer(requestHandler);

server.listen(8083, (err) => {
  if (err) {
    return console.log('Error creating http server', err)
  }

  console.log('Listening on port', 8083);
});
