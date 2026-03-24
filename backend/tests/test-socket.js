const { io } = require('socket.io-client');

// Paste a real token from your login endpoint here
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijc3OWFjODRiLTRkMjItNGQzOC1hMjQwLTE4ZmJhZWFmMjczMSIsInJvbGUiOiJ0ZWFjaGVyIiwiaWF0IjoxNzczOTg4OTg5LCJleHAiOjE3NzQ1OTM3ODl9.dDM1oxK2Dat3Gei-i0Pgi_zGi_3lIEQkaGpLfQjavbc';
const GROUP_ID = '80da54f2-1c1a-4b50-8522-36e131efddbe';

const socket = io('http://localhost:3000', {
  auth: { token: TOKEN }
});

socket.on('connect', () => {

  // Join a group room
  socket.emit('join_group', GROUP_ID);

  // Send a message after 1 second
  setTimeout(() => {
    socket.emit('send_message', {
      groupId: GROUP_ID,
      content: 'Hello from test script!',
      type: 'text'
    });
  }, 1000);
});

socket.on('new_message', (msg) => {
  console.log('New message received:', msg);
});

socket.on('error', (err) => {
  console.error('Socket error:', err);
});