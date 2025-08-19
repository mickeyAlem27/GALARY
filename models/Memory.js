const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  mediaUrl: {
    type: String,
    required: [true, 'Media URL is required']
  },
  mediaType: {
    type: String,
    required: [true, 'Media type is required'],
    enum: ['image', 'video']
  },
  location: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Add text index for search functionality
memorySchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Memory', memorySchema);