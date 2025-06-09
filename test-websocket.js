const WebSocket = require('ws');

console.log('🔗 Attempting to connect to ws://localhost:3001/gameHub');

const ws = new WebSocket('ws://localhost:3001/gameHub');

let connected = false;

ws.on('open', function open() {
  connected = true;
  console.log('✅ Connected to WebSocket server');
  
  // Send a test message
  console.log('📤 Sending test input message');
  ws.send(JSON.stringify({
    type: 'SendInput',
    direction: 'Up'
  }));
});

ws.on('message', function message(data) {
  try {
    const parsed = JSON.parse(data);
    console.log('📨 Received parsed message:', JSON.stringify(parsed, null, 2));
  } catch (e) {
    console.log('📨 Received raw message:', data.toString());
  }
});

ws.on('close', function close(code, reason) {
  console.log('🔌 Connection closed with code:', code, 'reason:', reason.toString());
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err.message);
  console.error('❌ Full error:', err);
});

// Keep alive for 10 seconds
setTimeout(() => {
  console.log('🏁 Test timeout - closing connection');
  if (connected) {
    ws.close();
  } else {
    console.log('❌ Connection was never established');
  }
}, 10000);
