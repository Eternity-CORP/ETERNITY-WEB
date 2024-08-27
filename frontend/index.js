import IPFS from 'ipfs-http-client';
import OrbitDB from 'orbit-db';

async function setup() {
  // Создаем IPFS клиент
  const ipfs = IPFS.create();
  
  // Создаем OrbitDB экземпляр
  const orbitdb = await OrbitDB.createInstance(ipfs);

  // Создаем лог-базу данных
  const db = await orbitdb.log('chat');

  // Добавляем сообщение в базу данных
  await db.add({ message: 'Hello from the frontend!' });

  // Читаем все сообщения из базы данных
  const messages = db.iterator({ limit: -1 }).collect();
  messages.forEach((entry) => console.log(entry.payload.value));
}

setup().catch(console.error);
