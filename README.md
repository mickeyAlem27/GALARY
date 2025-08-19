# Gallery App Backend

This is the backend server for the Gallery App, built with Node.js, Express, and MongoDB.

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- MongoDB Atlas account or local MongoDB instance

## Setup

1. Clone the repository
2. Navigate to the server directory:
   ```bash
   cd server
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the server directory with the following content:
   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=5000
   JWT_SECRET=your_jwt_secret_key_here
   ```

## Running the Server

- Development mode (with auto-restart):
  ```bash
  npm run dev
  ```

- Production mode:
  ```bash
  npm start
  ```

## API Endpoints

### Memories

- `GET /api/memories` - Get all memories
- `GET /api/memories/:id` - Get a single memory
- `POST /api/memories` - Create a new memory (with image upload)
- `PUT /api/memories/:id` - Update a memory (with optional image update)
- `DELETE /api/memories/:id` - Delete a memory

## File Uploads

- Images are uploaded to the `uploads/` directory
- Supported formats: JPEG, JPG, PNG, GIF
- Maximum file size: 10MB

## Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `PORT`: Server port (default: 5000)
- `JWT_SECRET`: Secret key for JWT (for future authentication)

## Error Handling

All errors are returned in JSON format with a `message` field describing the error.
