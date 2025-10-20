const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { readDB } = require('./db');
const { performance } = require('perf_hooks'); // Use Node's high-precision timer

const clients = new Map();
const listeners = new Map();

// A buffer (in ms) to schedule actions in the future.
// This gives messages time to travel over the network and for clients to prepare.
const ACTION_SCHEDULE_BUFFER = 250;

function initializeWebSocketServer(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('[WebSocket] Client connected.');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        switch (data.type) {
          case 'authenticate':
            handleAuthentication(ws, data.token);
            break;
          case 'NTP_REQUEST':
            handleNtpRequest(ws, data);
            break;
          case 'BROADCAST_ACTION':
            handleBroadcastAction(ws, data.payload);
            break;
          case 'START_LISTENING':
            handleStartListening(ws, data.targetUserId);
            break;
          case 'STOP_LISTENING':
            handleStopListening(ws);
            break;
        }
      } catch (e) {
        console.error('[WebSocket] Failed to process message:', e);
      }
    });

    ws.on('close', () => {
      handleDisconnect(ws);
    });
  });

  console.log('✅ WebSocket Server initialized.');
}

function handleAuthentication(ws, token) {
  if (!token) return ws.close();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = readDB();
    const user = db.users.find(u => u.id === decoded.id);
    if (user) {
      ws.userId = user.id;
      clients.set(user.id, ws);
      console.log(`[WebSocket] User ${user.email} authenticated and connected.`);
    } else { ws.close(); }
  } catch (e) { ws.close(); }
}

function handleNtpRequest(ws, data) {
  const T1 = performance.timeOrigin + performance.now(); // Server receipt time
  const response = {
    type: 'NTP_RESPONSE',
    T0: data.T0,
    T1,
    T2: performance.timeOrigin + performance.now(), // Server send time
  };
  ws.send(JSON.stringify(response));
}

function handleBroadcastAction(ws, payload) {
  if (!ws.userId) return;

  // The time in the future when all clients must execute this action
  const serverTimeToExecute = (performance.timeOrigin + performance.now()) + ACTION_SCHEDULE_BUFFER;
  
  const scheduledAction = {
    type: 'SCHEDULED_ACTION',
    action: payload,
    serverTimeToExecute,
  };
  
  // Send to all listeners of the broadcaster
  for (const [listenerId, targetId] of listeners.entries()) {
    if (targetId === ws.userId) {
      const listenerWs = clients.get(listenerId);
      if (listenerWs && listenerWs.readyState === WebSocket.OPEN) {
        listenerWs.send(JSON.stringify(scheduledAction));
      }
    }
  }
}

function handleStartListening(ws, targetUserId) {
  if (!ws.userId) return;
  const db = readDB();
  const targetUser = db.users.find(u => u.id === targetUserId);

  if (targetUser) {
    listeners.set(ws.userId, targetUserId);
    console.log(`[WebSocket] User ${ws.userId} is now listening to ${targetUserId}`);
    // Immediately schedule the target's current state for the new listener
    if (targetUser.nowPlaying) {
      // We pass the broadcaster's user ID so the `handleBroadcastAction` can find their listeners
      handleBroadcastAction({ userId: targetUserId }, targetUser.nowPlaying);
    }
  }
}

function handleStopListening(ws) {
  if (ws.userId && listeners.has(ws.userId)) {
    listeners.delete(ws.userId);
    console.log(`[WebSocket] User ${ws.userId} stopped listening.`);
  }
}

function handleDisconnect(ws) {
  if (ws.userId) {
    clients.delete(ws.userId);
    listeners.delete(ws.userId);
    console.log(`[WebSocket] User ${ws.userId} disconnected.`);
  } else {
    console.log('[WebSocket] Anonymous client disconnected.');
  }
}

module.exports = { initializeWebSocketServer };
