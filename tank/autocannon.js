const autocannon = require('autocannon');
const port = process.argv[2];
// const body = '{"khasekufhsakufhslkefhasekluhflkusaehflkuahsf": 1231325423}';
// const headers = {
//   'Connection': 'keep-alive',
//   'Content-Length': body.length,
//   'Content-Type': 'application/json; charset=utf-8',
// };

const instance = autocannon({
  url: 'http://localhost:' + port,
  connections: 10,
  pipelining: 1,
  duration: 10,
  overallRate: 2000,
  requests: [
    { path: '/khasekufhsakufhslkefhasekluhflkusaehflkuahsf' },
    { path: '/fasgeflkugsaeflkhasekufhsakufhslkefhas' },
    { path: '/asefasefasefaesfaesf' },
    { path: '/ausghfuaesgfaesgfasgeflkugsaeflkhasekufhsakufhslkefhasekluhflkusaehflkuahsfk/asefasefasefaesfaesf/easfaesfaesfeas/fesffth/hfgjgfyjfgyjfgyjgfyjgfyjdsgjbxnvdsefseaf' },
  ]
}, console.log);

autocannon.track(instance, { renderProgressBar: true });
