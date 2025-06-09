const WebSocket = require('ws');

console.log('🔗 Starting comprehensive WebSocket test...');

// Test connection to the game server
const wsUrl = 'ws://localhost:3001/gameHub';
console.log('📍 Connecting to:', wsUrl);

const ws = new WebSocket(wsUrl);

ws.on('open', function open() {
  console.log('✅ WebSocket connection opened successfully!');
  
  // Send a test message
  const testMessage = {
    type: 'test',
    message: 'Hello from test client',
    timestamp: Date.now()
  };
  
  console.log('📤 Sending test message:', testMessage);
  ws.send(JSON.stringify(testMessage));
  
  // Send a player input simulation
  setTimeout(() => {
    const inputMessage = {
      type: 'SendInput',
      direction: 'up'
    };
    console.log('📤 Sending input message:', inputMessage);
    ws.send(JSON.stringify(inputMessage));
  }, 1000);
});

ws.on('message', function message(data) {
  console.log('📨 Received message:', data.toString());
  try {
    const parsed = JSON.parse(data.toString());
    console.log('📊 Parsed data:', parsed);
  } catch (e) {
    console.log('📄 Raw message (not JSON):', data.toString());
  }
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err);
});

ws.on('close', function close(code, reason) {
  console.log('🔌 WebSocket closed. Code:', code, 'Reason:', reason.toString());
  process.exit(0);
});

// Timeout after 2 seconds (very short to avoid environment issues)
setTimeout(() => {
  console.log('⏰ Test timeout reached, closing connection');
  if (ws.readyState === WebSocket.OPEN) {
    ws.close();
  }
  process.exit(0);
}, 2000);
