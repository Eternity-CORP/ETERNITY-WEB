import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

let orbitdb: any;

export async function initOrbitDB() {
  try {
    const response = await axios.post(`${API_URL}/init`);
    orbitdb = response.data;
    return orbitdb;
  } catch (error) {
    console.error('Failed to initialize OrbitDB:', error);
    throw error;
  }
}

export async function addMessage(chatId: string, message: { from: string; to: string; text: string; timestamp: number }) {
  try {
    const response = await axios.post(`${API_URL}/message`, { chatId, message });
    return response.data.hash;
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

export async function editMessage(chatId: string, messageHash: string, newText: string) {
  try {
    const response = await axios.put(`${API_URL}/message`, { chatId, messageHash, newText });
    return response.data;
  } catch (error) {
    console.error('Failed to edit message:', error);
    throw error;
  }
}

export async function deleteMessage(chatId: string, messageHash: string) {
  try {
    const response = await axios.delete(`${API_URL}/message`, { data: { chatId, messageHash } });
    return response.data;
  } catch (error: any) {
    console.error('Failed to delete message:', error.response?.data || error.message);
    throw error;
  }
}

export async function addUser(address: string, name: string) {
  try {
    const response = await axios.post(`${API_URL}/user`, { address, name });
    return response.data;
  } catch (error) {
    console.error('Failed to add user:', error);
    throw error;
  }
}

export async function getUsers() {
  try {
    const response = await axios.get(`${API_URL}/users`);
    return response.data;
  } catch (error) {
    console.error('Failed to get users:', error);
    throw error;
  }
}

export async function updateUnreadCount(chatId: string, recipient: string, count: number) {
  try {
    const response = await axios.post(`${API_URL}/unreadCount`, { chatId, recipient, count });
    return response.data;
  } catch (error) {
    console.error('Failed to update unread count:', error);
    throw error;
  }
}

export async function getUnreadCounts(recipient: string) {
  try {
    const response = await axios.get(`${API_URL}/unreadCounts/${recipient}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get unread counts:', error);
    throw error;
  }
}

export async function addGroup(group: { id: string; name: string; members: string[]; unreadCount: number; creator: string }) {
  try {
    const response = await axios.post(`${API_URL}/group`, group);
    return response.data;
  } catch (error) {
    console.error('Failed to add group:', error);
    throw error;
  }
}

export async function getGroups() {
  try {
    const response = await axios.get(`${API_URL}/groups`);
    return response.data;
  } catch (error) {
    console.error('Failed to get groups:', error);
    throw error;
  }
}

export async function updateGroup(group: { id: string; name: string; members: string[]; unreadCount: number; creator: string }) {
  try {
    const response = await axios.put(`${API_URL}/group`, group);
    return response.data;
  } catch (error) {
    console.error('Failed to update group:', error);
    throw error;
  }
}

export async function removeMemberFromGroup(groupId: string, memberAddress: string) {
  try {
    const response = await axios.delete(`${API_URL}/group/member`, { data: { groupId, memberAddress } });
    return response.data;
  } catch (error) {
    console.error('Failed to remove member from group:', error);
    throw error;
  }
}

export const getChatId = (address1: string, address2: string) => {
  return [address1, address2].sort().join('_');
};

export async function saveUserContacts(userAddress: string, contacts: string[]) {
  try {
    const response = await axios.post(`${API_URL}/user-contacts`, { userAddress, contacts });
    return response.data;
  } catch (error) {
    console.error('Failed to save user contacts:', error);
    throw error;
  }
}

export async function getUserContacts(userAddress: string) {
  try {
    const response = await axios.get(`${API_URL}/user-contacts/${userAddress}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get user contacts:', error);
    throw error;
  }
}