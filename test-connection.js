const WebSocket = require('ws');

console.log('🔗 Quick WebSocket connection test...');

const ws = new WebSocket('ws://localhost:3001/gameHub');

ws.on('open', function open() {
  console.log('✅ SUCCESS: WebSocket connection established!');
  ws.close();
  process.exit(0);
});

ws.on('error', function error(err) {
  console.error('❌ FAILED: WebSocket error:', err.message);
  process.exit(1);
});

ws.on('close', function close() {
  console.log('🔌 Connection closed');
});

// Very short timeout to avoid environment issues
setTimeout(() => {
  console.log('⏰ Timeout - connection test failed');
  ws.close();
  process.exit(1);
}, 1000);
