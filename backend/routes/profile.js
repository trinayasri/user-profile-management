const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Setup storage engine for Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads');
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Save file with a unique name: userId-timestamp.ext
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// File filter to allow only image files
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|gif|webp/;
  const mimeType = allowedFileTypes.test(file.mimetype);
  const extName = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimeType && extName) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (jpeg, jpg, png, gif, webp) are allowed!'));
  }
};

// Multer upload configurations (limits size to 5MB)
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
}).single('image');

// @route   PUT api/profile/update
// @desc    Update user profile details
// @access  Private
router.put('/update', auth, async (req, res) => {
  const { name, email, phone, bio } = req.body;

  // Build profile update object
  const profileFields = {};
  if (name !== undefined) profileFields.name = name.trim();
  if (bio !== undefined) profileFields.bio = bio.trim();
  if (phone !== undefined) profileFields.phone = phone.trim();
  if (email !== undefined) profileFields.email = email.trim().toLowerCase();

  // Field Validations
  if (email) {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
  }

  try {
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If email is changing, ensure it's not already taken
    if (email && email !== user.email) {
      const emailTaken = await User.findOne({ email });
      if (emailTaken) {
        return res.status(400).json({ message: 'Email is already registered by another user' });
      }
    }

    // Update user
    user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: profileFields },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/profile/upload-image
// @desc    Upload / Update profile image
// @access  Private
router.post('/upload-image', auth, (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Image size limit is 5MB' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      // An unknown error occurred.
      return res.status(400).json({ message: err.message });
    }

    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Please select an image file to upload' });
    }

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        // Delete uploaded file if user not found
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: 'User not found' });
      }

      // Delete old profile image if it exists and is not empty
      if (user.profileImage) {
        // Extract relative or full path of the old image
        const oldImagePath = path.join(__dirname, '../../', user.profileImage);
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
          } catch (unlinkErr) {
            console.error('Failed to delete old profile image:', unlinkErr);
          }
        }
      }

      // Save relative path to DB
      const relativeImagePath = `uploads/${req.file.filename}`;
      user.profileImage = relativeImagePath;
      await user.save();

      res.json({
        message: 'Profile image updated successfully',
        profileImage: relativeImagePath
      });
    } catch (err) {
      console.error(err.message);
      // Clean up uploaded file in case of server error
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).send('Server Error');
    }
  });
});

module.exports = router;
