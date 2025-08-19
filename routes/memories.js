const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getMemories,
  getMemory,
  createMemory,
  updateMemory,
  deleteMemory
} = require('../controllers/memoryController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'memory-' + uniqueSuffix + ext);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Accept images and videos
  if (
    file.mimetype.startsWith('image/') || 
    file.mimetype.startsWith('video/')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed!'), false);
  }
};

// Initialize multer middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: fileFilter
});

// Route definitions
router
  .route('/')
  .get(getMemories)
  .post(upload.single('media'), createMemory);

router
  .route('/:id')
  .get(getMemory)
  .put(upload.single('media'), updateMemory)
  .delete(deleteMemory);

module.exports = router;