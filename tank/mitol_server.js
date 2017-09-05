const http = require('mitol');
const port = process.argv[2];

function respond(response, code, data) {
  response.statusCode = code;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Connection', 'keep-alive');
  response.setHeader('Content-Length', data.length);
  response.end(data);
}

function requestHandler(request, response) {
  switch (request.method) {
    case 'GET':
      respond(response, 200, Buffer.from(request.url));
      break;
    case 'POST': {
      var chunks = [];

      request.on('data', chunk => { chunks.push(Buffer.from(chunk)); });

      request.on('end', () => {
        var requestString = Buffer.concat(chunks).toString('utf-8');
        respond(response, 200, Buffer.from(requestString));
      });

      break;
    }
    default:
      respond(response, 404, Buffer.from(request.method + ' method not supported'));
  }
};

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
  if (err) {
    return console.log('Error creating http server', err)
  }

  console.log('Listening on port', port);
});
