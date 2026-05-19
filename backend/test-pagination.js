const http = require('http');
const body = JSON.stringify({email:'ops@nicsan.in',password:'Ops@123'});
const loginReq = http.request({hostname:'localhost',port:5000,path:'/api/auth/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}}, loginRes => {
  let d = '';
  loginRes.on('data', c => d += c);
  loginRes.on('end', () => {
    const {accessToken} = JSON.parse(d);
    const req2 = http.request({hostname:'localhost',port:5000,path:'/api/policies?page=1&limit=10',headers:{'Authorization':'Bearer '+accessToken}}, res2 => {
      let d2 = '';
      res2.on('data', c => d2 += c);
      res2.on('end', () => {
        const r = JSON.parse(d2);
        console.log('Total:', r.pagination.total, 'Page:', r.pagination.page, 'TotalPages:', r.pagination.totalPages, 'Limit:', r.pagination.limit);
        console.log('Policies count:', r.policies.length);
      });
    });
    req2.end();
  });
});
loginReq.on('error', e => console.error(e));
loginReq.write(body);
loginReq.end();