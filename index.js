const express = require('express');
const mongoose = require('mongoose');
const validUrl = require('valid-url');
const shortid = require('shortid');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json()); // To parse JSON bodies

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define URL Schema
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String
});

const Url = mongoose.model('Url', urlSchema);

// Shorten URL endpoint
app.post('/api/shorturl', async (req, res) => {
  const { original_url } = req.body;

  // Validate the URL format
  if (!validUrl.isUri(original_url)) {
    return res.json({ error: 'invalid url' });
  }

  // Check if the URL is already in the database
  let url = await Url.findOne({ original_url });
  if (url) {
    return res.json({ original_url: url.original_url, short_url: url.short_url });
  }

  // Create a new shortened URL
  const shortUrl = shortid.generate();
  url = new Url({
    original_url,
    short_url: shortUrl
  });
  await url.save();

  return res.json({ original_url: url.original_url, short_url: url.short_url });
});

// Redirect to original URL
app.get('/api/shorturl/:short_url', async (req, res) => {
  const { short_url } = req.params;
  const url = await Url.findOne({ short_url });

  if (!url) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  // Redirect to the original URL
  return res.redirect(url.original_url);
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
