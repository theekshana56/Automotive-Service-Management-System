const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from React app
app.use(express.static(path.join(__dirname, 'first-project/build')));

// API routes placeholder
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Staff Management System API is running' });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'first-project/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Staff Management System running on port ${PORT}`);
  console.log(`📱 React app will be available at http://localhost:${PORT}`);
  console.log(`🔧 For development, run: cd first-project && npm run dev`);
});