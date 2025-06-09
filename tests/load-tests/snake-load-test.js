import { check, sleep } from 'k6';
import ws from 'k6/ws';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom metrics
const connectionErrors = new Counter('connection_errors');
const messageLatency = new Trend('message_latency');
const connectionSuccess = new Rate('connection_success');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 200 },   // Stay at 200 users
    { duration: '1m', target: 500 },   // Ramp up to 500 users  
    { duration: '2m', target: 500 },   // Stay at 500 users
    { duration: '30s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    connection_success: ['rate>0.95'],        // 95% connection success rate
    message_latency: ['p(95)<180'],           // 95th percentile latency < 180ms
    connection_errors: ['count<10'],          // Less than 10 connection errors
  },
};

const ENGINE_URL = __ENV.ENGINE_URL || 'ws://localhost:3001';
const SIGNALR_HUB_URL = `${ENGINE_URL}/gameHub`;

export default function() {
  const playerId = `player_${__VU}_${__ITER}`;
  let messagesSent = 0;
  let messagesReceived = 0;
  let lastMessageTime = 0;

  console.log(`🎮 Player ${playerId} connecting to ${SIGNALR_HUB_URL}`);

  const response = ws.connect(SIGNALR_HUB_URL, {
    tags: { player: playerId },
  }, function(socket) {
    connectionSuccess.add(1);
    console.log(`✅ Player ${playerId} connected`);

    // Send join message
    socket.send(JSON.stringify({
      type: 'join',
      playerId: playerId,
      timestamp: Date.now()
    }));
    messagesSent++;

    // Handle incoming messages
    socket.on('message', function(message) {
      messagesReceived++;
      
      try {
        const data = JSON.parse(message);
        const now = Date.now();
        
        // Calculate latency if this is a response to our message
        if (data.timestamp && lastMessageTime > 0) {
          const latency = now - lastMessageTime;
          messageLatency.add(latency);
        }

        // Handle different message types
        switch (data.type) {
          case 'playerJoined':
            console.log(`👤 Player ${playerId} joined game`);
            startGameplay(socket, playerId);
            break;
            
          case 'gameUpdate':
            // Game state update - this is the main message type
            handleGameUpdate(data, socket, playerId);
            break;
            
          case 'roundStarted':
            console.log(`🚀 Round started for ${playerId}`);
            break;
            
          case 'roundEnded':
            console.log(`🏁 Round ended for ${playerId}`);
            break;
            
          default:
            console.log(`📨 ${playerId} received: ${data.type}`);
        }
      } catch (error) {
        console.error(`❌ ${playerId} message parse error:`, error);
      }
    });

    socket.on('error', function(error) {
      connectionErrors.add(1);
      console.error(`❌ ${playerId} WebSocket error:`, error);
    });

    socket.on('close', function() {
      console.log(`🔌 Player ${playerId} disconnected`);
    });

    // Keep connection alive for test duration
    socket.setTimeout(function() {
      console.log(`⏱️  ${playerId} test duration complete`);
      socket.close();
    }, 180000); // 3 minutes max test time

  });

  // Check connection success
  check(response, {
    'connection established': (r) => r && r.status === 101,
  });

  if (!response || response.status !== 101) {
    connectionErrors.add(1);
    connectionSuccess.add(0);
    console.error(`❌ Failed to connect player ${playerId}`);
    return;
  }

  // Wait for test completion
  sleep(1);
}

function startGameplay(socket, playerId) {
  // Simulate player input every 200-1000ms
  const inputInterval = Math.random() * 800 + 200;
  
  const gameplayTimer = setInterval(() => {
    sendRandomInput(socket, playerId);
  }, inputInterval);

  // Stop gameplay after 2 minutes
  setTimeout(() => {
    clearInterval(gameplayTimer);
  }, 120000);
}

function sendRandomInput(socket, playerId) {
  const directions = ['up', 'down', 'left', 'right'];
  const direction = directions[Math.floor(Math.random() * directions.length)];
  
  const inputMessage = {
    type: 'input',
    playerId: playerId,
    direction: direction,
    timestamp: Date.now()
  };

  socket.send(JSON.stringify(inputMessage));
  lastMessageTime = Date.now();
  
  console.log(`🎮 ${playerId} sent input: ${direction}`);
}

function handleGameUpdate(data, socket, playerId) {
  // Simulate client-side game state processing
  if (data.players && data.players.length > 0) {
    const myPlayer = data.players.find(p => p.id === playerId);
    if (myPlayer) {
      console.log(`📊 ${playerId} score: ${myPlayer.score}, alive: ${myPlayer.isAlive}`);
    }
  }

  // Randomly send input based on game state (simulate reactive gameplay)
  if (Math.random() < 0.1) { // 10% chance to react to game update
    sendRandomInput(socket, playerId);
  }
}

// Summary function to display results
export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    stdout: `
🎮 Mato Royale Load Test Results
===============================

📊 Connection Metrics:
- Connection Success Rate: ${(data.metrics.connection_success.values.rate * 100).toFixed(2)}%
- Connection Errors: ${data.metrics.connection_errors.values.count}

⚡ Performance Metrics:
- Average Latency: ${data.metrics.message_latency.values.avg.toFixed(2)}ms
- 95th Percentile Latency: ${data.metrics.message_latency.values['p(95)'].toFixed(2)}ms
- Max Latency: ${data.metrics.message_latency.values.max.toFixed(2)}ms

🕐 Test Duration: ${(data.state.testRunDurationMs / 1000).toFixed(2)}s
👥 Virtual Users: ${data.metrics.vus.values.max}
📨 Total Checks: ${data.metrics.checks.values.passes + data.metrics.checks.values.fails}
✅ Passed Checks: ${data.metrics.checks.values.passes}
❌ Failed Checks: ${data.metrics.checks.values.fails}

${data.metrics.checks.values.fails === 0 ? '🎉 All tests passed!' : '⚠️  Some tests failed - check the logs above'}
    `
  };
}
