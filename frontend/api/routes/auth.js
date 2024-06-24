const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user'); // Убедитесь, что путь правильный
const router = express.Router();

router.post('/register', async (req, res) => {
    console.log(req.body);
    try {
        const { username, email, password } = req.body;

        // Проверка, что все поля присутствуют
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Все поля обязательны: username, email, password' });
        }

        // Хэширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });

        // Сохранение пользователя в базе данных
        await newUser.save();
        res.status(201).json({ message: 'Регистрация успешна!' });
    } catch (err) {
        console.error(err);
        if (err.code === 11000) {
            res.status(400).json({ error: 'Пользователь с таким email уже существует.' });
        } else {
            res.status(500).json({ error: 'Ошибка при регистрации пользователя: ' + err.message });
        }
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && await bcrypt.compare(password, user.password)) {
            res.status(200).json({ message: 'Успешный вход в систему!' });
            console.log("Success");
            // Здесь должен быть код для установления сессии или выдачи токена
        } else {
            res.status(401).json({ error: 'Неправильный email или пароль' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Произошла ошибка при входе в систему: ' + err.message });
    }
});

module.exports = router;
