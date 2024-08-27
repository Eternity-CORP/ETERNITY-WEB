const IPFS = require('ipfs-core');
const OrbitDB = require('orbit-db');

async function main() {
  // Создаем IPFS узел
  const ipfs = await IPFS.create();

  // Создаем OrbitDB экземпляр
  const orbitdb = await OrbitDB.createInstance(ipfs);

  // Создаем лог-базу данных
  const db = await orbitdb.log('chat');

  // Добавляем сообщение в базу данных
  await db.add({ message: 'Hello from the backend!' });

  // Читаем все сообщения из базы данных
  const messages = db.iterator({ limit: -1 }).collect();
  messages.forEach((entry) => console.log(entry.payload.value));

  // Закрываем соединение
  await orbitdb.disconnect();
  await ipfs.stop();
}

main().catch(console.error);
