const http = require('http');

const loginBody = JSON.stringify({email:'ops@nicsan.in',password:'Ops@123'});
const loginReq = http.request({
  hostname:'localhost', port:5000, path:'/api/auth/login', method:'POST',
  headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(loginBody)}
}, loginRes => {
  let data = '';
  loginRes.on('data', d => data += d);
  loginRes.on('end', () => {
    const {accessToken} = JSON.parse(data);
    console.log('Token:', accessToken ? 'OK' : 'MISSING');

    const boundary = '----FormBoundary' + Date.now();
    const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj xref 0 4\n0000000000 65535 f\n0000000015 00000 n\n0000000068 00000 n\n0000000125 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref 217\n%%EOF');

    const part1 = Buffer.from('--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="test.pdf"\r\nContent-Type: application/pdf\r\n\r\n');
    const part2 = Buffer.from('\r\n--' + boundary + '--\r\n');
    const body = Buffer.concat([part1, pdfContent, part2]);

    const uploadReq = http.request({
      hostname:'localhost', port:5000, path:'/api/policies/upload', method:'POST',
      headers:{
        'Authorization':'Bearer ' + accessToken,
        'Content-Type':'multipart/form-data; boundary=' + boundary,
        'Content-Length':Buffer.byteLength(body)
      }
    }, uploadRes => {
      let result = '';
      uploadRes.on('data', d => result += d);
      uploadRes.on('end', () => {
        console.log('Status:', uploadRes.statusCode);
        console.log('Body:', result);
      });
    });
    uploadReq.on('error', e => console.error(e));
    uploadReq.write(body);
    uploadReq.end();
  });
});
loginReq.on('error', e => console.error(e));
loginReq.write(loginBody);
loginReq.end();