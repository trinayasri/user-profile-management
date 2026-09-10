const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET api/users
// @desc    Get all registered users
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/users
// @desc    Add a new user (Admin / User Management)
// @access  Private
router.post('/', auth, async (req, res) => {
  const { username, email, password, name, phone, bio } = req.body;

  // Basic validation
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required' });
  }

  if (username.length < 3) {
    return res.status(400).json({ message: 'Username must be at least 3 characters' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address' });
  }

  try {
    // Check if user already exists
    let existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'Email is already registered' });
      }
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const newUser = new User({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
      name: name ? name.trim() : '',
      phone: phone ? phone.trim() : '',
      bio: bio ? bio.trim() : ''
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(password, salt);

    await newUser.save();

    const userObj = await User.findById(newUser.id).select('-password');
    res.status(201).json(userObj);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/:id
// @desc    Update any user's profile details
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { name, email, phone, bio, username } = req.body;

  const profileFields = {};
  if (name !== undefined) profileFields.name = name.trim();
  if (bio !== undefined) profileFields.bio = bio.trim();
  if (phone !== undefined) profileFields.phone = phone.trim();
  if (username !== undefined) profileFields.username = username.trim();
  if (email !== undefined) profileFields.email = email.trim().toLowerCase();

  if (email) {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
  }

  try {
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check for email collision
    if (email && email !== user.email) {
      const emailTaken = await User.findOne({ email });
      if (emailTaken) {
        return res.status(400).json({ message: 'Email is already taken by another user' });
      }
    }

    // Check for username collision
    if (username && username !== user.username) {
      const usernameTaken = await User.findOne({ username });
      if (usernameTaken) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
    }

    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: profileFields },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/users/:id
// @desc    Delete a user by ID
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove uploaded profile photo if present
    if (user.profileImage) {
      const oldImagePath = path.join(__dirname, '../../', user.profileImage);
      if (fs.existsSync(oldImagePath)) {
        try {
          fs.unlinkSync(oldImagePath);
        } catch (unlinkErr) {
          console.error('Failed to remove image file:', unlinkErr);
        }
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully', userId: req.params.id });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
