const http = require('http');
const port = 8080;

function requestHandler(request, response) {
  response.statusCode = 200;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Connection', 'close');
  response.setHeader('Content-Length', 0);
  response.end();
  console.log(request.url);
};

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
  if (err) {
    return console.log('Error creating http server', err)
  }

  console.log('Listening on port', port);
});
