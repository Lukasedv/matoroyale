const WebSocket = require('ws');

console.log('🔗 Testing simple WebSocket connection...');

// Test just a basic WebSocket connection without any specific path
const ws = new WebSocket('ws://localhost:3001');

ws.on('open', function open() {
  console.log('✅ Basic WebSocket connection opened!');
  ws.close();
});

ws.on('error', function error(err) {
  console.error('❌ Basic WebSocket error:', err.message);
});

ws.on('close', function close() {
  console.log('🔌 Basic WebSocket closed');
  process.exit(0);
});

setTimeout(() => {
  console.log('⏰ Timeout - closing');
  ws.close();
}, 3000);
