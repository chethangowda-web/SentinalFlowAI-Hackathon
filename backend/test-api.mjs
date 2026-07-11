import http from 'http';

function checkUrl(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: data.slice(0, 100) }));
    });
    req.on('error', (err) => resolve({ error: err.code }));
  });
}

async function run() {
  console.log('Testing 3000:');
  console.log(await checkUrl('http://localhost:3000/custom/v1/health'));
  console.log(await checkUrl('http://localhost:3000/api/custom/v1/health'));
  
  console.log('\nTesting 4111:');
  console.log(await checkUrl('http://localhost:4111/custom/v1/health'));
  console.log(await checkUrl('http://localhost:4111/api/custom/v1/health'));
}

run();
