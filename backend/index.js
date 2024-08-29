import OrbitDB from 'orbit-db';
import * as IPFS from 'ipfs-core';

let orbitdb;
let chats = {};

export async function initOrbitDB() {
  const ipfs = await IPFS.create();
  orbitdb = await OrbitDB.createInstance(ipfs);
  console.log('OrbitDB initialized');
}

async function getChatDB(chatId) {
  if (!chats[chatId]) {
    chats[chatId] = await orbitdb.feed(chatId);
    await chats[chatId].load();
  }
  return chats[chatId];
}

export async function addMessage(chatId, message) {
  if (!orbitdb) {
    throw new Error('Database not initialized');
  }
  const chatDB = await getChatDB(chatId);
  const hash = await chatDB.add(message);
  return hash;
}

export async function getMessages(chatId) {
  if (!orbitdb) {
    throw new Error('Database not initialized');
  }
  const chatDB = await getChatDB(chatId);
  return chatDB.iterator({ limit: -1 }).collect();
}