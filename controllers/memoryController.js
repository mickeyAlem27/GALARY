const Memory = require('../models/Memory');
const { deleteFile } = require('../config/cloudinary');

// @desc    Create a new memory
// @route   POST /api/memories
// @access  Public
exports.createMemory = async (req, res) => {
  console.log('Creating new memory...');
  console.log('Request body:', req.body);
  console.log('Uploaded file:', req.file);
  
  try {
    const { title, description, location, tags } = req.body;
    
    // Check if file was uploaded
    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({
        success: false,
        message: 'Please upload a file',
        error: 'NO_FILE_UPLOADED'
      });
    }

    // Validate required fields
    if (!title || !description) {
      console.error('Missing required fields');
      // Clean up uploaded file if validation fails
      if (req.file && req.file.path) {
        await deleteFile(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Title and description are required',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    try {
      // Create memory with Cloudinary URL
      const memory = await Memory.create({
        title,
        description,
        location: location || 'Unknown',
        tags: tags && typeof tags === 'string' 
          ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
          : [],
        mediaUrl: req.file.path, // Cloudinary URL
        mediaType: req.file.mimetype.startsWith('image/') ? 'image' : 'video',
        cloudinaryPublicId: req.file.filename // Store Cloudinary public ID for future deletion
      });

      console.log('Memory created successfully:', memory._id);
      
      res.status(201).json({
        success: true,
        message: 'Memory created successfully',
        data: memory
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Clean up uploaded file from Cloudinary if database operation fails
      if (req.file && req.file.path) {
        try {
          await deleteFile(req.file.path);
        } catch (deleteError) {
          console.error('Error deleting uploaded file from Cloudinary:', deleteError);
        }
      }
      
      // Handle duplicate key errors
      if (dbError.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'A memory with this title already exists',
          error: 'DUPLICATE_TITLE'
        });
      }
      
      throw dbError; // Let the outer catch handle it
    }
  } catch (error) {
    console.error('Error in createMemory:', error);
    
    // Handle specific error types
    let statusCode = 500;
    let errorMessage = 'An unexpected error occurred';
    let errorCode = 'SERVER_ERROR';
    
    if (error.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = 'Validation failed';
      errorCode = 'VALIDATION_ERROR';
    }
    
    res.status(statusCode).json({ 
      success: false, 
      message: errorMessage,
      error: errorCode,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all memories
// @route   GET /api/memories
// @access  Public
exports.getMemories = async (req, res) => {
  try {
    const memories = await Memory.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: memories.length,
      data: memories
    });
  } catch (error) {
    console.error('Error getting memories:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
};

// @desc    Get single memory
// @route   GET /api/memories/:id
// @access  Public
exports.getMemory = async (req, res) => {
  try {
    const memory = await Memory.findById(req.params.id);

    // Check if memory exists
    if (!memory) {
      return res.status(404).json({
        success: false,
        error: 'Memory not found'
      });
    }

    res.status(200).json({
      success: true,
      data: memory
    });
  } catch (error) {
    console.error('Error getting memory:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
};

// @desc    Update memory
// @route   PUT /api/memories/:id
// @access  Public
exports.updateMemory = async (req, res) => {
  try {
    let memory = await Memory.findById(req.params.id);

    if (!memory) {
      return res.status(404).json({
        success: false,
        error: 'Memory not found'
      });
    }

    // Update fields
    const { title, description, location, tags } = req.body;
    
    memory.title = title || memory.title;
    memory.description = description || memory.description;
    memory.location = location || memory.location;
    memory.tags = tags ? tags.split(',').map(tag => tag.trim()) : memory.tags;

    // Handle file update if new file is uploaded
    if (req.file) {
      // Delete old file
      const oldFilePath = path.join(__dirname, '..', memory.mediaUrl);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
      
      memory.mediaUrl = `/uploads/${req.file.filename}`;
      memory.mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
    }

    await memory.save();

    res.status(200).json({
      success: true,
      data: memory
    });
  } catch (error) {
    console.error('Error updating memory:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
};

// @desc    Delete memory
// @route   DELETE /api/memories/:id
// @access  Public
exports.deleteMemory = async (req, res) => {
  try {
    const memory = await Memory.findById(req.params.id);

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: 'Memory not found',
      });
    }

    // Delete the associated file from Cloudinary if it exists
    if (memory.cloudinaryPublicId) {
      try {
        await deleteFile(memory.cloudinaryPublicId);
        console.log(`Successfully deleted file from Cloudinary: ${memory.cloudinaryPublicId}`);
      } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
        // Continue with memory deletion even if file deletion fails
      }
    } else if (memory.mediaUrl) {
      console.warn('No cloudinaryPublicId found for memory, falling back to mediaUrl');
      try {
        await deleteFile(memory.mediaUrl);
      } catch (error) {
        console.error('Error deleting file from Cloudinary using mediaUrl:', error);
      }
    }

    // Delete the memory from the database
    await Memory.findByIdAndDelete(req.params.id);
    console.log(`Successfully deleted memory with ID: ${req.params.id}`);

    res.status(200).json({
      success: true,
      message: 'Memory deleted successfully',
      data: {},
    });
  } catch (err) {
    console.error('Error deleting memory:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};