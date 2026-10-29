const express = require('express');

const app = express();
const PORT = process.env.PORT || 80;

// Middleware for parsing JSON
app.use(express.json());

// Root endpoint for simple health check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    endpoint: '/sayHello'
  });
});

// Required /sayHello endpoint
app.get('/sayHello', (req, res) => {
  res.status(200).json({
    message: 'Hello User.'
  });
});

// Export app for unit testing, and start server if executed directly
if (require.main === module) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend API is running on port ${PORT}`);
  });

  // Graceful shutdown handling
  const gracefulShutdown = (signal) => {
    console.log(`Received ${signal}. Shutting down server gracefully...`);
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

module.exports = app;
