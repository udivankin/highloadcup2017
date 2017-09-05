function parseHeaders(headerLines) {
  var headers = {};

  for (var i = 0, len = headerLines.length, key, line, parts; i < len; i++) {
    line = headerLines[i];
    parts = line.split(':');
    key = parts.shift();
    headers[key] = parts.join(':').trim();
  }

  return headers;
};

function parseRequestLine(requestLineString) {
  var parts = requestLineString.split(' ');

  return {
    method: parts[0],
    url: parts[1],
    protocol: parts[2],
  };
};

function parseRequest(requestString) {
  var line;
  var request = {};
  var lines = requestString.split(/\r?\n/);
  var parsedRequestLine = parseRequestLine(lines.shift());
  var headerLines = [];

  while (lines.length > 0) {
    line = lines.shift();
    if (line === '') break;
    headerLines.push(line);
  }

  return {
    method: parsedRequestLine.method,
    url: parsedRequestLine.url,
    headers: parseHeaders(headerLines),
    body: lines.join('\r\n'),
  };
};

module.exports = parseRequest;
