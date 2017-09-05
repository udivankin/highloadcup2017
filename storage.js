const fs = require('fs');
const { setCache, uCache, vCache, lCache } = require('./cache.js');
const { getNow } = require('./helpers.js');
const dataDir = fs.existsSync('/tmp/data/data.zip')
  ? __dirname + '/data/'
  : __dirname + '/data_fallback/';

let now;
const locations = new Map();
const users =  new Map();
const visits = new Map();
const userVisits = new Map();
const userAge = new Map();
const locationVisits = new Map();

const emptyUserVisits = Buffer.from('{"visits":[]}');
const emptyAvg = Buffer.from('{"avg":0}');
const emptyObject = {};

const getAvg = (arr) => {
  var sum = 0;
  for (var i = 0; i < arr.length; i++) sum += arr[i];
  return arr.length === 0 ? 0 : Number((sum / arr.length).toFixed(5)).valueOf();
};
const getAge = u => ~~((now - u.birth_date * 1000) / (31556736000));
const validateGender = g => typeof g === 'undefined' ? true : g.length === 1 && (g === 'f' || g === 'm');
const validateString = s => typeof s === 'undefined' ? true : typeof s === 'string'
const validateNumber = n => typeof n === 'undefined' ? true : typeof n === 'number' && isFinite(n);
const stringifyAvg = res => Buffer.from('{"avg":' + getAvg(res) + '}');
const stringifyVisit = (m, v, p) => ('{"mark":' + m + ',"visited_at":' + v + ',"place":"' + p + '"}');
const stringifyVisits = (v) => Buffer.from('{"visits":[' + v.join(',') + ']}', 'utf-8');

function userVisitsSorter(a, b) {
  if (a === 0 || b === 0) return 0;
  var vA = visits.get(a);
  var vB = visits.get(b);
  if (vA.visited_at < vB.visited_at) return -1;
  if (vA.visited_at > vB.visited_at) return 1;
  return 0;
}

const addUserVisit = (v) => {
  if (!userVisits.has(v.user)) {
    userVisits.set(v.user, [v.id]);
    return;
  }

  var record = userVisits.get(v.user);
  record.push(v.id);
  record.sort(userVisitsSorter);
}

const addLocationVisit = (v) => {
  if (!locationVisits.has(v.location)) {
    locationVisits.set(v.location, [v.id]);
    return;
  }

  locationVisits.get(v.location).push(v.id);
}

function prefetchData() {
  const files = fs.readdirSync(dataDir);
  now = getNow();

  files.forEach(filename => {
    const data = require(dataDir + filename);

    if (filename.indexOf('locations') > -1) {
      for (var i = 0, l = data.locations.length; i < l; i++) {
        locations.set(data.locations[i].id, data.locations[i]);
        setCache(lCache, data.locations[i].id, data.locations[i]);
      }
      return;
    }

    if (filename.indexOf('users') > -1) {
      for (var i = 0, l = data.users.length; i < l; i++) {
        userAge.set(data.users[i].id, getAge(data.users[i]));
        users.set(data.users[i].id, data.users[i]);
        setCache(uCache, data.users[i].id, data.users[i]);
      }
      return;
    }

    if (filename.indexOf('visits') > -1) {
      for (var i = 0, l = data.visits.length; i < l; i++) {
        visits.set(data.visits[i].id, data.visits[i]);
        setCache(vCache, data.visits[i].id, data.visits[i]);
      }
      return;
    }
  });

  visits.forEach((visit) => {
    addUserVisit(visit);
    addLocationVisit(visit);
  });
}

const updateUserVisit = (v, newId) => {
  var oldId = v.user;

  if (oldId !== newId) {
    var record = userVisits.get(oldId);

    for (var i = 0, l = record.length; i < l; i++) {
      if (record[i] === v.id) record[i] = 0;
    }

    addUserVisit({ id: v.id, user: newId });
  }
}

const updateLocationVisit = (v, newId) => {
  var oldId = v.location;

  if (oldId !== newId) {
    var record = locationVisits.get(oldId);

    for (var i = 0, l = record.length; i < l; i++) {
      if (record[i] === v.id) record[i] = 0;
    }

    addLocationVisit({ id: v.id, location: newId });
  }
}

const validateLocation = f => validateNumber(f.distance) && validateString(f.city) && validateString(f.place) && validateString(f.country);
const validateUser = f => validateGender(f.gender) && validateString(f.email) && validateString(f.first_name) && validateString(f.last_name) && validateNumber(f.birth_date);
const validateVisit = f => validateNumber(f.mark) && validateNumber(f.user) && validateNumber(f.location) && validateNumber(f.visited_at);

const validateUpdateLocation = (lId, f) => {
  if (!locations.has(lId)) return 0;
  if (f.id || !validateLocation(f)) return -1;
  return 1;
}

const updateLocation = (lId, f) => {
  var record = locations.get(lId);

  if (typeof f.distance !== 'undefined') record.distance = f.distance;
  if (f.city) record.city = f.city;
  if (f.place) record.place = f.place;
  if (f.country) record.country = f.country;

  setCache(lCache, lId, record);
};

const validateUpdateUser = (uId, f) => {
  if (!users.has(uId)) return 0;
  if (f.id || !validateUser(f)) return -1;
  return 1;
}

const updateUser = (uId, f) => {
  var record = users.get(uId);

  if (typeof f.birth_date !== 'undefined') {
    record.birth_date = f.birth_date;
    userAge.set(uId, getAge(record));
  }

  if (f.first_name) record.first_name = f.first_name;
  if (f.last_name) record.last_name = f.last_name;
  if (f.gender) record.gender = f.gender;
  if (f.email) record.email = f.email;

  setCache(uCache, uId, record);
};

const validateUpdateVisit = (vId, f) => {
  if (!visits.has(vId)) return 0;
  if (f.id || !validateVisit(f)) return -1;
  if ((f.user && !users.has(f.user)) || (f.location && !locations.has(f.location))) return 0;
  return 1;
};

const updateVisit = (vId, f) => {
  var record = visits.get(vId);

  if (f.user || f.location) { // todo optimize
    var newUserId = f.user || record.user;
    var newLocationId = f.location || record.location;
    updateUserVisit(record, newUserId);
    updateLocationVisit(record, newLocationId);
    record.user = newUserId;
    record.location = newLocationId;
  }

  if (typeof f.visited_at !== 'undefined') {
    record.visited_at = f.visited_at;
    userVisits.get(record.user).sort(userVisitsSorter);
  }

  if (typeof f.mark !== 'undefined') record.mark = f.mark;

  setCache(vCache, vId, record);
};

const getUserVisits = (uId, p) => {
  if (!users.has(uId)) return 0;
  if (!validateNumber(p.fromDate) || !validateNumber(p.toDate) || !validateNumber(p.toDistance) || !validateString(p.country)) return -1;

  var uvs = userVisits.get(uId);

  if (!uvs) return emptyUserVisits;

  var res = [];

  if (!p.fromDate && !p.toDate && !p.toDistance && !p.country) {
    for (var i = 0, l = uvs.length, v; i < l; i++) {
      if (uvs[i] === 0) continue;
      v = visits.get(uvs[i]);
      res.push(stringifyVisit(v.mark, v.visited_at, locations.get(v.location).place));
    }

    return stringifyVisits(res);
  }

  for (var i = 0, l = uvs.length, v, loc; i < l; i++) {
    if (uvs[i] === 0) continue;
    v = visits.get(uvs[i]);
    loc = locations.get(v.location);

    if (
      !(p.fromDate && v.visited_at <= p.fromDate)
        && !(p.toDate && v.visited_at >= p.toDate)
        && !(p.toDistance && loc.distance >= p.toDistance)
        && !(p.country && loc.country !== p.country)
    ) {
      res.push(stringifyVisit(v.mark, v.visited_at, loc.place));
    }
  }

  return stringifyVisits(res);
};

const getLocationAvg = (lId, p) => {
  if (!locations.has(lId)) return 0;
  if (!validateNumber(p.fromDate) || !validateNumber(p.toDate) || !validateNumber(p.fromAge) || !validateNumber(p.toAge) || !validateGender(p.gender)) return -1;
  var lvs = locationVisits.get(lId);

  if (!lvs) return emptyAvg;

  var res = [];

  if (!p.fromAge && !p.toAge && !p.fromDate && !p.toDate && !p.gender) {
    for (var i = 0, l = lvs.length, v; i < l; i++) {
      if (lvs[i] === 0) continue;
      v = visits.get(lvs[i]);
      if (v) res.push(v.mark);
    }

    return stringifyAvg(res);
  }

  for (var i = 0, l = lvs.length, v, u, a; i < l; i++) {
    if (lvs[i] === 0) continue;
    v = visits.get(lvs[i]);
    u = users.get(v.user);
    a = userAge.get(v.user);

    if (
      !(p.fromAge && a < p.fromAge)
        && !(p.toAge && a >= p.toAge)
        && !(p.fromDate && v.visited_at <= p.fromDate)
        && !(p.toDate && v.visited_at >= p.toDate)
        && !(p.gender && u.gender !== p.gender)
    ) {
      res.push(v.mark);
    }
  }

  return stringifyAvg(res);
};

const validateAddLocation = f => validateNumber(f.id) && validateLocation(f) ? 1 : -1;
const validateAddUser = f => validateNumber(f.id) && validateUser(f) ? 1 : -1;
const validateAddVisit = f => validateNumber(f.id) && validateVisit(f) ? 1 : -1;

const addLocation = f => {
  locations.set(f.id, f);
  setCache(lCache, f.id, f);
};

const addUser = f => {
  users.set(f.id, f);
  userAge.set(f.id, getAge(f));
  setCache(uCache, f.id, f);
};

const addVisit = f => {
  visits.set(f.id, f);
  addLocationVisit(f);
  addUserVisit(f, locations.get(f.location));
  setCache(vCache, f.id, f);
};

const getLocation = lId => lCache.get(lId) || 0;
const getUser = uId => uCache.get(uId) || 0;
const getVisit = vId => vCache.get(vId) || 0;

const hasLocation = lId => locations.has(lId);
const hasUser = uId => users.has(uId);
const hasVisit = vId => visits.has(vId);

module.exports = {
  addUser, addVisit, addLocation,
  getVisit, getLocation, getLocationAvg, getUser, getUserVisits,
  hasUser, hasLocation, hasVisit,
  updateUser, updateVisit, updateLocation,
  prefetchData,
  validateUpdateUser, validateUpdateVisit, validateUpdateLocation,
  validateAddLocation, validateAddUser, validateAddVisit,
};
