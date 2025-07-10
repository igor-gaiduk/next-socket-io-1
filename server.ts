
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer, WebSocket } from 'ws'; // Import WebSocketServer and WebSocket

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// When using a custom server, you need to create a Next.js app instance.
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store connected WebSocket clients
const clients: Set<WebSocket> = new Set();

app.prepare().then(() => {
  // Create an HTTP server to host both Next.js and the WebSocket server
  const httpServer = createServer((req, res) => {
    // Parse the URL to handle Next.js routes
    // Ensure that requests to the WebSocket path are not handled by Next.js
    const parsedUrl = parse(req.url!, true);
    if (parsedUrl.pathname?.startsWith('/message')) { // Check if the path is for WebSockets
      // Let WebSocketServer handle this path, do nothing here for Next.js
      return;
    }
    handle(req, res, parsedUrl);
  });

  // Initialize WebSocket server
  // Attach the WebSocket server to the existing HTTP server
  const wss = new WebSocketServer({ server: httpServer, path: '/message' });

  // WebSocket connection handling
  wss.on('connection', (ws: WebSocket) => {
    console.log(`WebSocket client connected: ${ws.url}`);
    clients.add(ws); // Add new client to the set

    // Send a welcome message to the newly connected client
    ws.send('Welcome to the native WebSocket server!');

    // Listen for messages from clients
    ws.on('message', (message: string) => {
      console.log(`Received message from client: ${message}`);
      // Broadcast the message to all connected clients
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(`Client: ${message}`);
        }
      });
    });

    // Listen for client disconnections
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws); // Remove disconnected client from the set
    });

    // Listen for errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Start the HTTP server
  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Native WebSocket server running on ws://${hostname}:${port}/message`);
  });
}).catch((err) => {
  console.error('Error preparing Next.js app:', err);
  process.exit(1);
});

