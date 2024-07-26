const express = require('express');
const multer = require('multer');
const vision = require('@google-cloud/vision');
const axios = require('axios'); // Import Axios for making HTTP requests

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Initialize the Google Cloud Vision API client
const client = new vision.ImageAnnotatorClient({
  credentials: {
    client_email: 'nodejsimageocr@imageocr-424205.iam.gserviceaccount.com',
    private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCJ37+dIIkPwwAa\noJqDtVUHfWLuo2PwEUJTqD0e968zMg6KMomzaAOaKrX9bVp+YbZSNxvUKLfgf4wT\nuGN0HYfmelmnNro7zSTBYw2zge4+z95F9qLu7bYM5RQUvrVlANRvpilYTUYSglGY\nFH/3ih84Qzejg/40Ej4/OaKBQWs3ccqtllxhB+CmVKSe1NdmPEktrwN+IoFT+/tr\nqJYc06VdWEIIkSUBkgbHZ4p972XoPg0b6Oud6Xou9xHsPBsbh+/bbaif/ixOR+5c\n1D9zAib9eaKJ6lCgRVOBL7V5Qxjlo29vqq1OvY1Ts12nC50t61qaKjlC8/bo7cCC\nqYuvzuMHAgMBAAECggEANuZRdk+uRAhx0iiBXlCmOwVCj6Of98fnkUg8jkgyC0Cz\naXQWQMn6JTk8nl0c25Ys8y/edOyBy3L+ZBvX/jSEGNI/QMYaAhX9vMOkgQYLyBcd\net5qopklFJ1jEZ+eu0lJTevsKq0aaeRaeSQwkHD/XXfmf8XfQvzArIxWmQFjn/+q\nBLZXenRSe0sL0mQOs69WEFZnwm2ke0lt8lybsYIqa9JBdcpGXvsZ/ZeiI6sFikwP\nafPjgouK/ACzpfFtHAYTH0dr3MmkynJzP721W8F4h/SIWD7B9Cp76d5Av941DdsN\n6NDuDF2evcRhhn3zJocldHGt0GDHXLs3wMNiegWegQKBgQC9sprTB0Bg4qxy54Em\nX+mVXwGtJJqLvUVf4b6zAgvWgt3t0iqtSC4clP8MjXcIm3AWO+R7Pvmb5kinbeHE\new+HwhbGjPk8JvUuhMtOy2pszQp5Cbl9yD0pXdB8YdT1tznuUNoSJKRitHRFV5lu\nB5E7mEcxwBhLEIENA00y+gbYzQKBgQC6ECsh6C6msaGIOcLOxVx+wievkpx0ApCI\nblee2JCZMXc3aPudxj8ZMwUju+qyef42Ymr1QH8KAF2V5++7u7/9AB9eB9I5kfv5\nRPR8QVhuSRsHeOajkhArMbZjVPfmKbPJmPC3ITGzOLi+vLHQndqNjLm6HDiD2GY4\ny4iTwIg7IwKBgCiTRW6SBIE0uvIw9n0A0vOySKeCRtRQ/b/Oh32+mE2f3Fx8Mciy\nwbo3XH6Q278pkEYRNYPvKnDgRvYZGMtwDxhYuYpqqPzm0FbM7LfD5tWy3eSZ4eU3\nqW1ptaiFPIn6URfaj2qGD+tU8fHLFPRmBfibT88iaY/UzeW8qQyYUlKZAoGBAJBh\nUYcLK4AwoJ8b6z4WSjMWqEMGqp8fClbEAPwDIxmtF8yIi4+fsYD1ZUyYWoPKRGih\nMExFkw8Iv5Y+l3n/M/i4Kp8FxKzlyjhguLLe5icWVYIT4C0Xf7J07gngeklBHQEX\ny9rfSDjBkCJ6PCUdCOYESG7RzU0KFDCIR+AXa98vAoGAUxIXIcOBlJbYcSKs4X5F\nEXNB45jdo/fDlS7f5E/02tEb7t+7aIyQmbeu8l3iaFR44VcLCUZXjI8Fhv8vsFdT\n+fMzj9zyvUXjW0LIz3Oy2P8QlKTxlmklV4ACu21sXJEGulx2DScxfn4yDPtIJzsL\nYM6H8ve902MJw2hTtGD8fAI=\n-----END PRIVATE KEY-----\n'
  }
});

// Middleware to parse JSON request bodies
app.use(express.json());

// Route to handle image upload and data extraction
app.post('/extract-data', upload.single('image'), async (req, res) => {
  try {
    // Get the uploaded image file
    const imageFile = req.file.buffer;

    // Send the image to the Google Cloud Vision API for text extraction
    const [result] = await client.textDetection(imageFile);
    const detectedText = result.textAnnotations[0]?.description;

    // Log the detected text for debugging
    console.log('Detected Text:', detectedText);

    if (!detectedText) {
      return res.status(400).json({ error: 'No text detected in the image.' });
    }

    // Send the extracted text to the Gemini API for organization
    const organizedData = await sendToGeminiAPI(detectedText);

    // Send the organized data back to the client
    res.json(organizedData);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Function to send the extracted text to the Gemini API and get the organized data
async function sendToGeminiAPI(text) {
  try {
    const response = await axios.post('https://gemini.api.example.com/organize', {
      text: text,
      // Add any additional parameters required by the Gemini API
    });

    return response.data;
  } catch (error) {
    console.error('Error sending data to Gemini API:', error);
    throw error;
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
