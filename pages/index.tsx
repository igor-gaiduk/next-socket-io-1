
import { useEffect, useState, useRef } from 'react';

// Define the type for the WebSocket client instance
interface ClientWebSocket extends WebSocket {
  // You can add custom properties or methods here if needed
}

const Home = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<ClientWebSocket | null>(null); // Use useRef to hold WebSocket instance

  useEffect(() => {
    // Get the WebSocket server URL from an environment variable
    // In Next.js, environment variables prefixed with NEXT_PUBLIC_ are exposed to the browser.
    const WS_SERVER_BASE_URL = process.env.NEXT_PUBLIC_SOCKET_IO_SERVER_URL || 'ws://localhost:3000';
    const WS_PATH = '/message'; // The custom path for WebSockets

    // Construct the full WebSocket URL
    const fullWsUrl = `${WS_SERVER_BASE_URL}${WS_PATH}`;

    // Initialize WebSocket connection only once
    if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
      const ws = new WebSocket(fullWsUrl);

      ws.onopen = () => {
        console.log('Connected to native WebSocket server');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        setMessages((prevMessages) => [...prevMessages, event.data as string]);
      };

      ws.onclose = () => {
        console.log('Disconnected from native WebSocket server');
        setIsConnected(false);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false); // Update connection status on error
      };

      wsRef.current = ws as ClientWebSocket; // Store the WebSocket instance in the ref
    }

    // Clean up the WebSocket connection when the component unmounts
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
        console.log('WebSocket disconnected on component unmount');
      }
    };
  }, []); // Empty dependency array ensures this runs once on mount

  const sendMessage = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && message.trim()) {
      wsRef.current.send(message); // Send message via WebSocket
      setMessage(''); // Clear input field
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans">
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />

      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Next.js Native WebSocket Chat
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
