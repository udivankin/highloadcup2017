const autocannon = require('autocannon');
const fs = require('fs');
const port = process.argv[2];
const isTest = fs.statSync('/tmp/data/data.zip').size < 10 * 1000 * 1000;
const timeOffset = isTest ? 3000 : 30 * 1000;
const duration = isTest ? 10 : 60;

const warmup = () => {
  var requests = [];
  console.log('Warming up JIT in' + (isTest ? ' test ' : ' reating ') + 'mode. Duration ' + duration + 'sec');

  for (var i = 1; i < 10; i++) {
    requests.push(
      { path: '/users/' + i },
      { path: '/users/bad' },
      { path: '/locations/' + i },
      { path: '/visits/' + i },
      { path: '/users/' + i + '/visits' },
      { path: '/users/' + i + '/visits?fromDate=1231' },
      { path: '/locations/' + i + '/avg' },
      { path: '/locations/' + i + '/avg?gender=f' },
      { path: '/locations/' + i + '/avg?gender=awdaff' }
    )
  }

  const instance = autocannon({
    url: 'http://localhost:' + port,
    connections: 3,
    pipelining: 1,
    duration,
    overallRate: 100,
    requests,
  });

  autocannon.track(instance, { renderProgressBar: false });
}

setTimeout(warmup, timeOffset);
