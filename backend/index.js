import OrbitDB from 'orbit-db';
import * as IPFS from 'ipfs-core';

let orbitdb;
let chats = {};
let usersDB;
let unreadCountsDB;
let groupsDB;
let userContactsDB;

export async function initOrbitDB() {
  const ipfs = await IPFS.create();
  orbitdb = await OrbitDB.createInstance(ipfs);
  console.log('OrbitDB initialized');
  usersDB = await orbitdb.keyvalue('users');
  await usersDB.load();
  console.log('Users DB initialized');
  unreadCountsDB = await orbitdb.keyvalue('unreadCounts');
  await unreadCountsDB.load();
  console.log('Unread Counts DB initialized');
  groupsDB = await orbitdb.keyvalue('groups');
  await groupsDB.load();
  console.log('Groups DB initialized');
  userContactsDB = await orbitdb.keyvalue('userContacts');
  await userContactsDB.load();
  console.log('User Contacts DB initialized');
}

async function getChatDB(chatId) {
  if (!chats[chatId]) {
    chats[chatId] = await orbitdb.feed(chatId);
    await chats[chatId].load();
  }
  return chats[chatId];
}

export async function addMessage(chatId, message) {
  const db = await getChatDB(chatId);
  console.log('Adding message to DB:', JSON.stringify(message, null, 2));
  const messageToSave = {
    from: message.from,
    to: message.to,
    text: message.text,
    timestamp: message.timestamp,
    imageUrls: message.imageUrls // Add this line
  };
  const hash = await db.add(JSON.stringify(messageToSave));
  console.log('Message added with hash:', hash);

  // Добавляем отправителя в контакты получателя
  await addContactForUser(message.to, message.from);

  return hash;
}

// Новая функция для добавления контакта
async function addContactForUser(userAddress, contactAddress) {
  let contacts = await userContactsDB.get(userAddress) || [];
  if (!contacts.includes(contactAddress)) {
    contacts.push(contactAddress);
    await userContactsDB.put(userAddress, contacts);
    console.log(`Added ${contactAddress} to ${userAddress}'s contacts`);
  }
}

export async function getMessages(chatId) {
  const db = await getChatDB(chatId);
  const messages = await db.iterator({ limit: -1 }).collect();
  console.log('Raw messages from OrbitDB:', JSON.stringify(messages, null, 2));
  return messages.map(message => ({
    hash: message.hash,
    payload: {
      value: JSON.parse(message.payload.value)
    }
  }));
}

export async function editMessage(chatId, messageHash, newText) {
  const db = await getChatDB(chatId);
  const messages = await db.iterator({ limit: -1 }).collect();
  const updatedMessages = messages.map(entry => {
    if (entry.hash === messageHash) {
      let parsedValue;
      try {
        parsedValue = JSON.parse(entry.payload.value);
        parsedValue.text = newText;
      } catch (error) {
        console.error('Error parsing message:', error);
        parsedValue = { text: 'Error parsing message', timestamp: 0 };
      }
      return { ...entry, payload: { ...entry.payload, value: JSON.stringify(parsedValue) } };
    }
    return entry;
  });
  await db.drop();
  await db.load();
  for (const msg of updatedMessages) {
    await db.add(msg.payload.value);
  }
  return { success: true };
}

export async function deleteMessage(chatId, messageHash) {
  try {
    const db = await getChatDB(chatId);
    console.log('Deleting message with hash:', messageHash);
    await db.remove(messageHash);
    console.log('Message deleted successfully');
    return { success: true, message: 'Message deleted successfully' };
  } catch (error) {
    console.error('Error in deleteMessage:', error);
    return { success: false, message: error.message };
  }
}

export async function addUser(address, name) {
  await usersDB.put(address, { name });
  console.log(`User ${name} added with address ${address}`);
}

export async function getUsers() {
  const users = usersDB.all;
  console.log('Fetched users:', users);
  return users;
}

export async function updateUnreadCount(chatId, recipient, count) {
  const recipientData = await unreadCountsDB.get(recipient) || {};
  recipientData[chatId] = count;
  await unreadCountsDB.put(recipient, recipientData);
  console.log(`Unread count updated for ${recipient} in chat ${chatId}`);
}

export async function getUnreadCounts(recipient) {
  const unreadCounts = await unreadCountsDB.get(recipient) || {};
  console.log(`Fetched unread counts for ${recipient}:`, unreadCounts);
  return unreadCounts;
}

export async function addGroup(group) {
  await groupsDB.put(group.id, group);
  console.log(`Group ${group.name} added with id ${group.id}`);
}

export async function getGroups() {
  const groups = groupsDB.all;
  console.log('Fetched groups:', groups);
  return groups;
}

export async function updateGroup(group) {
  await groupsDB.put(group.id, group);
  console.log(`Group ${group.name} updated with id ${group.id}`);
}

export async function removeMemberFromGroup(groupId, memberAddress) {
  const group = await groupsDB.get(groupId);
  if (group) {
    group.members = group.members.filter(member => member !== memberAddress);
    await groupsDB.put(groupId, group);
    console.log(`Member ${memberAddress} removed from group ${groupId}`);
  }
}

export async function saveUserContacts(userAddress, contacts) {
  await userContactsDB.put(userAddress, contacts);
  console.log(`Contacts saved for user ${userAddress}`);
}

export async function getUserContacts(userAddress) {
  const contacts = await userContactsDB.get(userAddress) || [];
  console.log(`Fetched contacts for user ${userAddress}:`, contacts);
  return contacts;
}