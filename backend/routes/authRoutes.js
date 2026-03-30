const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const SECRET = process.env.JWT_SECRET;

// Register
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  const existing = await User.findOne({ username });
  if (existing) {
    return res.status(400).send('User already exists');
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, password: hash, role });
  res.status(201).json({ id: user._id, username: user.username, role });
});


// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).send('Invalid credentials');

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).send('Invalid credentials');

  const token = jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    SECRET,
    { expiresIn: '2h' }
  );

  res.json({ token });
});


module.exports = router;
