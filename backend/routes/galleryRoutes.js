const express = require('express');
const multer = require('multer');
const Image = require('../models/Image');
const { authenticate, authorize } = require('../middleware/auth');
const path = require('path');
const router = express.Router();

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Admin-only upload
router.post(
  '/upload',
  authenticate,
  authorize(['admin']),
  upload.single('image'),
  async (req, res) => {
    const image = await Image.create({
      title: req.body.title,
      description: req.body.description,
      filename: req.file.filename
    });
    res.status(201).json(image);
  }
);

// Paginated image fetch
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 6;
  const skip = (page - 1) * limit;
  const images = await Image.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  res.json(images);
});

// Add comment
router.post('/:id/comments', authenticate, async (req, res) => {
  const img = await Image.findById(req.params.id);
  if (!img) return res.status(404).send('Not found');
  img.comments.push({ userId: req.user.id, text: req.body.text });
  await img.save();
  res.status(201).json(img.comments);
});

// Get comments
router.get('/:id/comments', authenticate, async (req, res) => {
  const img = await Image.findById(req.params.id).populate('comments.userId', 'username');
  if (!img) return res.status(404).send('Not found');
  res.json(img.comments);
});

module.exports = router;
