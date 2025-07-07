// This is a simple Next.js page that connects to the Socket.IO server.

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Define the type for the Socket.IO client instance
interface ClientSocket extends Socket {
  // You can add custom event types here if needed
}

let socket: ClientSocket; // Declare socket outside to persist across re-renders

const Home = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection only once
    if (!socket) {
      socket = io(':3000/'); // Connect to your custom server URL

      socket.on('connect', () => {
        console.log('Connected to Socket.IO server');
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from Socket.IO server');
        setIsConnected(false);
      });

      // Listen for 'message' events from the server
      socket.on('message', (msg: string) => {
        setMessages((prevMessages) => [...prevMessages, msg]);
      });

      socket.on('connect_error', (err) => {
        console.error('Socket.IO connection error:', err.message);
      });
    }

    // Clean up the socket connection when the component unmounts
    return () => {
      if (socket && socket.connected) {
        socket.disconnect();
        console.log('Socket disconnected on component unmount');
      }
    };
  }, []); // Empty dependency array ensures this runs once on mount

  const sendMessage = () => {
    if (socket && socket.connected && message.trim()) {
      socket.emit('message', message); // Emit 'message' event to the server
      setMessage(''); // Clear input field
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans">
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />

      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Next.js Socket.IO Chat
        </h1>

        <div className="mb-4 text-center">
          <p className={`text-lg font-semibold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            Status: {isConnected ? 'Connected' : 'Disconnected'}
          </p>
        </div>

        <div className="h-64 bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-y-auto mb-6">
          {messages.length === 0 ? (
            <p className="text-gray-500 italic">No messages yet. Type something!</p>
          ) : (
            messages.map((msg, index) => (
              <p key={index} className="text-gray-700 leading-relaxed mb-1">
                {msg}
              </p>
            ))
          )}
        </div>

        <div className="flex space-x-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                sendMessage();
              }
            }}
            placeholder="Type your message..."
            className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected || !message.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
