import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export async function initOrbitDB() {
  try {
    const response = await axios.post(`${API_URL}/init`);
    return response.data;
  } catch (error) {
    console.error('Failed to initialize OrbitDB:', error);
    throw error;
  }
}

export async function addMessage(chatId: string, message: { from: string; to: string; text: string; timestamp: number }) {
  try {
    const response = await axios.post(`${API_URL}/message`, { chatId, message });
    return response.data.hash; // Возвращаем хеш сообщения
  } catch (error) {
    console.error('Failed to add message:', error);
    throw error;
  }
}

export async function getMessages(chatId: string) {
  try {
    const response = await axios.get(`${API_URL}/messages/${chatId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get messages:', error);
    throw error;
  }
}