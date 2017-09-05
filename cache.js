'use strict';

const uCache = new Map();
const vCache = new Map();
const lCache = new Map();

const setCache = (category, key, value) => {
  category.set(key, Buffer.from(JSON.stringify(value), 'utf-8'));
}

module.exports = { setCache, uCache, vCache, lCache };
