import express from 'express';
import cors from 'cors';
import { initOrbitDB, addMessage, getMessages } from './index.js';

const app = express();
app.use(cors());
app.use(express.json());

let isInitialized = false;

app.post('/api/init', async (req, res) => {
  try {
    if (!isInitialized) {
      console.log('Initializing OrbitDB...');
      await initOrbitDB();
      isInitialized = true;
      console.log('OrbitDB initialized successfully');
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to initialize OrbitDB:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.post('/api/message', async (req, res) => {
  try {
    console.log('Received message request:', req.body);
    if (!isInitialized) {
      console.log('OrbitDB not initialized, initializing now...');
      await initOrbitDB();
      isInitialized = true;
    }
    const { chatId, message } = req.body;
    console.log('Adding message to chat:', chatId);
    const hash = await addMessage(chatId, message);
    console.log('Message added successfully, hash:', hash);
    res.json({ hash });
  } catch (error) {
    console.error('Failed to add message:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.get('/api/messages/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    console.log('Fetching messages for chat:', chatId);
    const messages = await getMessages(chatId);
    console.log('Fetched messages:', messages);
    res.json(messages);
  } catch (error) {
    console.error('Failed to get messages:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initOrbitDB().then(() => {
    isInitialized = true;
    console.log('OrbitDB initialized on server start');
  }).catch(error => {
    console.error('Failed to initialize OrbitDB on server start:', error);
  });
});