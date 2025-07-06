
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// When using a custom server, you need to create a Next.js app instance.
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create an HTTP server to host both Next.js and Socket.IO
  const httpServer = createServer((req, res) => {
    // Parse the URL to handle Next.js routes
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.IO server
  const io = new SocketIOServer(httpServer, {
    // CORS configuration for Socket.IO.
    // Adjust 'origin' to match your client-side application's URL.
    cors: {
      origin: `http://${hostname}:${port}`, // Allow connections from your Next.js frontend
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Listen for 'message' events from clients
    socket.on('message', (msg: string) => {
      console.log(`Message from ${socket.id}: ${msg}`);
      // Broadcast the message to all connected clients
      io.emit('message', `${socket.id}: ${msg}`);
    });

    // Listen for 'disconnect' events
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });

    // Send a welcome message to the newly connected client
    socket.emit('message', 'Welcome to the Socket.IO server!');
  });

  // Start the HTTP server
  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO server running on ws://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error('Error preparing Next.js app:', err);
  process.exit(1);
});
