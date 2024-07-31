const WebSocket = require('ws');
const Cloudinary = require('cloudinary').v2;

const port = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port }, () => {
  console.log(`Server started on port ${port}`);
});

let clients = {};

wss.on('connection', (ws, req) => {
  const client = req.headers['sec-websocket-key'];
  clients[client] = ws;
  ws.on('message', (msg) => receive(msg, client));
  ws.on('close', () => {
    delete clients[client];
    console.log(`Closed connection: ${client}`);
  });
});

const send = (msg, client) => {
  if (clients[client]) {
    clients[client].send(JSON.stringify(msg), (error) => {
      if (error) {
        delete clients[client];
        console.log(`Error sending message to ${client}:`, error);
      } else {
        console.log(`Sent message to ${client}:`, msg);
      }
    });
  }
};

const receive = (msg, sender) => {
  console.log(`Received message from ${sender}:`, msg);
  broadcast(msg, sender);
};

const broadcast = (msg, sender) => {
  const message = JSON.parse(msg);
  Object.keys(clients).forEach((client) => {
    if (client !== sender) {
      if (message.image) {
        Cloudinary.uploader.unsigned_upload(
          `data:image/jpeg;base64,${message.image}`,
          'myPreset',
          { cloud_name: 'zafer' },
          (err, result) => {
            if (result) {
              message.image = result.url;
              send(message, client);
            } else {
              console.error('Image upload error:', err);
            }
          }
        );
      } else {
        send(message, client);
      }
    }
  });
};
