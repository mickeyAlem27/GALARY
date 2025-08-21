const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { storage, fileFilter } = require('../config/cloudinary');
const {
  getMemories,
  getMemory,
  createMemory,
  updateMemory,
  deleteMemory
} = require('../controllers/memoryController');

// Initialize multer middleware with Cloudinary storage
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1
  },
  fileFilter: fileFilter
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 50MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message || 'Error uploading file.'
    });
  } else if (err) {
    console.error('File upload error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Error processing file upload.'
    });
  }
  next();
};

// Route definitions
router
  .route('/')
  .get(getMemories)
  .post(upload.single('media'), handleMulterError, createMemory);

router
  .route('/:id')
  .get(getMemory)
  .put(upload.single('media'), updateMemory)
  .delete(deleteMemory);

module.exports = router;