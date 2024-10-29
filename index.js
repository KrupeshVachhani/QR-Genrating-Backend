const express = require('express');
const QRCode = require('qrcode');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Error handling class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// QR Service
class QRService {
  static async generateQR(data, options = {}) {
    try {
      if (!data) {
        throw new AppError('Data is required to generate QR code', 400);
      }

      const defaultOptions = {
        errorCorrectionLevel: 'H',
        type: 'png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      };

      const qrOptions = { ...defaultOptions, ...options };
      return await QRCode.toBuffer(data, qrOptions);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Error generating QR code', 500);
    }
  }
}

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());  // Security headers
app.use(cors());    // Enable CORS
app.use(morgan('dev'));  // Logging
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// QR Code generation endpoint
app.post('/api/qr/generate', async (req, res, next) => {
  try {
    const { data, options } = req.body;

    if (!data) {
      throw new AppError('Data is required', 400);
    }

    const qrImage = await QRService.generateQR(data, options);

    res.type('png');
    res.send(qrImage);
  } catch (error) {
    next(error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    message: statusCode === 500 ? 'Internal server error' : err.message
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
