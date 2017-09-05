'use strict';
const fs = require('fs');

const optionsFileName = fs.existsSync('/tmp/data/options.txt')
  ? '/tmp/data/options.txt'
  : __dirname + '/data_fallback/options.txt';

const emptyObject = {};

function getUrlParams(url) {
  if (!url) { return emptyObject; }

  var paramsArray = url.split(/&|=/);

  return paramsArray.length > 1
    ? paramsArray.reduce(
        function(obj, val, index, arr) {
          if (index % 2 === 0) {
            obj[val] = val === 'gender' || val === 'country'
              ? decodeURIComponent(arr[index + 1].replace('+', '%20'))
              : Number(arr[index + 1]);
          }
          return obj;
        },
        {}
      )
    : emptyObject;
}

function forceGc() {
  if ('gc' in global) {
    console.log('Forcing GC', new Date().toISOString());
    global.gc(); // todo force gc after 1st and 2nd round
  }
}

function getNow() {
  return new Date(fs.readFileSync(optionsFileName, 'utf-8').split('\n')[0] * 1000);
}

function parseJson(str) {
  try {
    return JSON.parse(str);
  } catch(e) {
    return;
  }
}

module.exports = { getUrlParams, getNow, forceGc, parseJson };
