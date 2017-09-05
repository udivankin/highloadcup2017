const {
  addUser, addVisit, addLocation,
  getUser, getLocation, getLocationAvg, getVisit, getUserVisits,
  hasUser, hasLocation, hasVisit,
  updateUser, updateVisit, updateLocation,
  validateUpdateUser, validateUpdateVisit, validateUpdateLocation,
  validateAddLocation, validateAddUser, validateAddVisit,
} = require('./storage');
const { getUrlParams, parseJson } = require('./helpers');
const isDev = process.argv[3] === 'dev';
const http = require('http');

const CONTENT_LENGTH_HEAD = 'Content-Length';
const CONTENT_TYPE_HEAD = 'Content-Type';
const CONTENT_TYPE = 'application/json; charset=utf-8';
const CONNECTION_HEAD = 'Connection';
const CONNECTION_CLOSE = 'close';
const CONNECTION_KEEP_ALIVE = 'keep-alive';
const ERROR_HEADERS = {
  [CONTENT_TYPE_HEAD]: CONTENT_TYPE,
  [CONNECTION_HEAD]: CONNECTION_KEEP_ALIVE,
  [CONTENT_LENGTH_HEAD]: 0,
};
const emptyObject = Buffer.from('{}');
const getRequestRegex = /^\/(users|visits|locations)\/(\d+)(?:\/)?(visits|avg)?/;
const postRequestRegex = /^\/(users|visits|locations)\/(\d+|new)/;

function respondRaw(response, code, data, shouldClose) {
  response.writeHead(
    code,
    {
      [CONTENT_TYPE_HEAD]: CONTENT_TYPE,
      [CONNECTION_HEAD]: shouldClose === true ? CONNECTION_CLOSE : CONNECTION_KEEP_ALIVE,
      [CONTENT_LENGTH_HEAD]: data.length,
    }
  )
  response.end(data);
}

function respondError(response, code) {
  response.writeHead(code, ERROR_HEADERS);
  response.end();
}

function respond(response, result) {
  if (typeof result !== 'number') {
    respondRaw(response, 200, result);
    return;
  }

  switch (result) {
    case -1:
      respondError(response, 400);
      break;
    case 0:
      respondError(response, 404);
      break;
    case 1:
      respondRaw(response, 200, emptyObject, true);
      break;
    default:
  }
}

function getModel(model, id) {
  switch (model) {
    case 'users':
      return getUser(id);
      break;
    case 'visits':
      return getVisit(id);
      break;
    case 'locations':
      return getLocation(id);
      break;
    default:
      return 0;
  }
}

function getComposite(model, id, action, request) {
  var urlParams = getUrlParams(request.url.split('?')[1]);

  if (model === 'users' && action === 'visits') {
    return getUserVisits(id, urlParams);
  }

  if (model === 'locations' && action === 'avg') {
    return getLocationAvg(id, urlParams);
  }

  return 0;
}

function getHandler(request) {
  var url = getRequestRegex.exec(request.url);

  if (url === null || url.length < 3) {
    return 0;
  }

  var id = Number(url[2]).valueOf();

  if (typeof url[3] === 'undefined') {
    return getModel(url[1], id);
  }

  return getComposite(url[1], id, url[3], request);
}

function addModel(model, postData) {
  var validStatus = 0;

  switch (model) {
    case 'users':
      validStatus = validateAddUser(postData);
      if (validStatus === 1) addUser(postData);
      break;
    case 'visits':
      validStatus = validateAddVisit(postData);
      if (validStatus === 1) addVisit(postData);
      break;
    case 'locations':
      validStatus = validateAddLocation(postData);
      if (validStatus === 1) addLocation(postData);
      break;
  }

  return validStatus;
}

function updateModel(model, intId, postData) {
  var validStatus = 0;

  switch (model) {
    case 'users':
      validStatus = validateUpdateUser(intId, postData);
      if (validStatus === 1) updateUser(intId, postData);
      break;
    case 'locations':
      validStatus = validateUpdateLocation(intId, postData);
      if (validStatus === 1) updateLocation(intId, postData);
      break;
    case 'visits':
      validStatus = validateUpdateVisit(intId, postData);
      if (validStatus === 1) updateVisit(intId, postData);
      break;
  }

  return validStatus;
}

function postHandler(request, response) {
  var url = postRequestRegex.exec(request.url);

  if (!url || url.length < 3) {
    respond(response, 0);
    return;
  }

  var chunks = [];
  var requestBody;

  request.on('data', chunk => chunks.push(chunk));

  request.on('end', () => {
    requestBody = Buffer.concat(chunks).toString('utf-8');

    if (requestBody.indexOf('": null') > -1) {
      respond(response, -1);
      return;
    }

    var postData = parseJson(requestBody);

    if (typeof postData === 'undefined') {
      respond(response, -1);
      return;
    }

    if (url[2] === 'new') {
      respond(response, addModel(url[1], postData));
      return;
    }

    var intId = Number(url[2]).valueOf();

    if (intId > 0) { // handle /users/bad
      respond(response, updateModel(url[1], intId, postData));
      return;
    }

    respond(response, 0);
  });
}

function requestHandler(request, response) {
  response.socket.setNoDelay();
  response.sendDate = false;

  switch (request.method) {
    case 'GET':
      response.socket.setKeepAlive(true, 0);
      respond(response, getHandler(request));
      break;
    case 'POST':
      postHandler(request, response);
      break;
    default:
      respondError(response, 404);
  }
};

function createServer(port) {
  var server = http.createServer(requestHandler);

  server.listen(port, (err) => {
    if (err) return console.log('Error creating http server', err)
    console.log('Listening on port');
  });
}

module.exports = createServer;
