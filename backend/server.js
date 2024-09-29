import express from 'express';
import cors from 'cors';
import { initOrbitDB, addMessage, getMessages, editMessage, deleteMessage, addUser, getUsers, saveUserContacts, getUserContacts } from './index.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

let isInitialized = false;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

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

    // Обновляем контакты получателя
    const recipientContacts = await getUserContacts(message.to);
    if (!recipientContacts.includes(message.from)) {
      await saveUserContacts(message.to, [...recipientContacts, message.from]);
    }

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

app.put('/api/message', async (req, res) => {
  try {
    const { chatId, messageHash, newText } = req.body;
    console.log('Editing message:', { chatId, messageHash, newText });
    const result = await editMessage(chatId, messageHash, newText);
    console.log('Message edited successfully:', result);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Failed to edit message:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.delete('/api/message', async (req, res) => {
  try {
    const { chatId, messageHash } = req.body;
    console.log('Deleting message:', { chatId, messageHash });
    if (!chatId || !messageHash) {
      throw new Error('chatId and messageHash are required');
    }
    const result = await deleteMessage(chatId, messageHash);
    console.log('Message deleted successfully:', result);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Failed to delete message:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.post('/api/user', async (req, res) => {
  try {
    const { address, name } = req.body;
    console.log('Adding user:', { address, name });
    await addUser(address, name);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to add user:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    console.log('Fetching users');
    const users = await getUsers();
    res.json(users);
  } catch (error) {
    console.error('Failed to get users:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.post('/api/unreadCount', async (req, res) => {
  try {
    const { chatId, recipient, count } = req.body;
    console.log('Updating unread count:', { chatId, recipient, count });
    await updateUnreadCount(chatId, recipient, count);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to update unread count:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.get('/api/unreadCounts/:recipient', async (req, res) => {
  try {
    const { recipient } = req.params;
    console.log('Fetching unread counts for recipient:', recipient);
    const unreadCounts = await getUnreadCounts(recipient);
    res.json(unreadCounts);
  } catch (error) {
    console.error('Failed to get unread counts:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.post('/api/group', async (req, res) => {
  try {
    const group = req.body;
    console.log('Adding group:', group);
    await addGroup(group);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to add group:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.get('/api/groups', async (req, res) => {
  try {
    console.log('Fetching groups');
    const groups = await getGroups();
    res.json(groups);
  } catch (error) {
    console.error('Failed to get groups:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.put('/api/group', async (req, res) => {
  try {
    const group = req.body;
    console.log('Updating group:', group);
    await updateGroup(group);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to update group:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.delete('/api/group/member', async (req, res) => {
  try {
    const { groupId, memberAddress } = req.body;
    console.log('Removing member from group:', { groupId, memberAddress });
    await removeMemberFromGroup(groupId, memberAddress);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to remove member from group:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.post('/api/user-contacts', async (req, res) => {
  try {
    const { userAddress, contacts } = req.body;
    console.log('Saving user contacts:', { userAddress, contacts });
    await saveUserContacts(userAddress, contacts);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to save user contacts:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.get('/api/user-contacts/:userAddress', async (req, res) => {
  try {
    const { userAddress } = req.params;
    console.log('Fetching user contacts for:', userAddress);
    const contacts = await getUserContacts(userAddress);
    res.json(contacts);
  } catch (error) {
    console.error('Failed to get user contacts:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (req.file) {
    const fileUrl = `${req.protocol}://${req.get('host')}/api/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  } else {
    res.status(400).json({ error: 'No file uploaded' });
  }
});

// Обновите этот маршрут
app.post('/api/upload-multiple', upload.array('files', 10), (req, res) => {
  if (req.files && req.files.length > 0) {
    const fileUrls = req.files.map(file => 
      `${req.protocol}://${req.get('host')}/api/uploads/${file.filename}`
    );
    res.json({ urls: fileUrls });
  } else {
    res.status(400).json({ error: 'No files uploaded' });
  }
});

// Обновите эту строку, чтобы использовать абсолютный пут
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

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