const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/timetable',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(res.statusCode, data));
});

req.on('error', (e) => console.error(e));
req.write(JSON.stringify({
  sessionId: "2625fb7e-3c22-49f3-8b7c-3f482d790d0b",
  classId: "2625fb7e-3c22-49f3-8b7c-3f482d790d0b",
  sectionId: "2625fb7e-3c22-49f3-8b7c-3f482d790d0b",
  teacherId: "2625fb7e-3c22-49f3-8b7c-3f482d790d0b",
  subjectId: "2625fb7e-3c22-49f3-8b7c-3f482d790d0b",
  dayOfWeek: "MONDAY",
  periodNumber: 1,
  startTime: "08:00",
  endTime: "08:45",
  room: ""
}));
req.end();
