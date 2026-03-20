const express = require('express');
const cors = require('cors');
require('dotenv').config();

const assistantRoutes = require('./routes/assistant');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'PetCare backend çalışıyor 🚀' });
});

app.use('/assistant', assistantRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});