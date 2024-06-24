const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const userRoutes = require('./routes/auth'); // Импорт роутов для пользователей

require('dotenv').config();



const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb+srv://eternaki:JdP6Op0YE8oJ6vey@eternity-cluster.xb3ut94.mongodb.net/?retryWrites=true&w=majority&appName=Eternity-Cluster', { 
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Успешное подключение к MongoDB');
}).catch(err => {
  console.error('Ошибка подключения к MongoDB:', err);
});

// Использование роутов
app.use('/api/users', userRoutes); // Подключение роутов пользователей

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});


// password of cluster - HywXqXxu878zZbD, username - eternity