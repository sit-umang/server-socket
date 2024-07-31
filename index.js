const WebSocket = require('ws');
const Cloudinary = require('cloudinary').v2;

Cloudinary.config({
  cloud_name: 'dtngugfk0',
  api_key: '629878265372427',
  api_secret: '6u7oxWyT78FkCdDjYmNp_o6AR-o',
});

const port = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port }, () => {
  console.log(`Server started on port ${port}`);
});

const clients = {};

wss.on('connection', (ws, req) => {
  let username;

  ws.on('message', (msg) => {
    let message;
    try {
      message = JSON.parse(msg);
    } catch (error) {
      console.error('Failed to parse message:', msg, error);
      return;
    }

    switch (message.type) {
      case 'register':
        username = message.username;
        clients[username] = ws;
        console.log(`User ${username} connected`);
        break;
      case 'message':
        handleMessage(message);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  });

  ws.on('close', () => {
    if (username) {
      delete clients[username];
      console.log(`User ${username} disconnected`);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

const handleMessage = (message) => {
  const { to, from, text, image } = message;

  if (image) {
    // Upload image to Cloudinary
    Cloudinary.uploader.unsigned_upload(
      `data:image/jpeg;base64,${image}`,
      'umang_unsigned',
      (err, result) => {
        if (err) {
          console.error('Image upload error:', err);
        } else {
          // Update message with Cloudinary URL
          const updatedMessage = { ...message, image: result.url, text: undefined };
          sendToClient(to, updatedMessage);
        }
      }
    );
  } else {
    sendToClient(to, message);
  }
};

const sendToClient = (username, message) => {
  const clientWs = clients[username];
  if (clientWs) {
    clientWs.send(JSON.stringify(message), (error) => {
      if (error) {
        console.error(`Failed to send message to ${username}:`, error);
      } else {
        console.log(`Message sent to ${username}:`, message);
      }
    });
  } else {
    console.log(`Client ${username} not connected`);
  }
};
