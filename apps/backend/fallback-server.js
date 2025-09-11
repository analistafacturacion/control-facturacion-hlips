// Emergency fallback - Simple Express server
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// Basic CORS
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Control Facturación API fallback está funcionando',
    timestamp: new Date().toISOString(),
    mode: 'FALLBACK'
  });
});

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'Health & Life IPS - Control Facturación API' });
});

app.listen(PORT, () => {
  console.log(`🚀 Fallback server running on port ${PORT}`);
});
