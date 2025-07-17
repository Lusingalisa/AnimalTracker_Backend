const WebSocket = require('ws');

class WebSocketServer {
  constructor(port) {
    this.wss = new WebSocket.Server({ port });
    this.setup();
  }

  setup() {
    this.wss.on('connection', (ws) => {
      console.log('New client connected');
      
      ws.on('close', () => {
        console.log('Client disconnected');
      });
    });
  }

  broadcast(data) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }
}

// Create WebSocket server on port 8080
const wss = new WebSocketServer(8080);

module.exports = wss;