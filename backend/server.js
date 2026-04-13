const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Połączenie z MongoDB
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log('✅ Połączono z MongoDB!');
}).catch(err => {
  console.log('❌ Błąd połączenia:', err.message);
});

// Schematy MongoDB
const pharmacySchema = new mongoose.Schema({
  name: String,
  city: String,
  address: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
  hours: String
});

const bookingSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  pharmacy: String,
  service: String,
  vaccine: String,
  medications: String,
  date: String,
  time: String,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

// Modele
const Pharmacy = mongoose.model('Pharmacy', pharmacySchema);
const Booking = mongoose.model('Booking', bookingSchema);

// Middleware do autentykacji
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// ENDPOINT: Login apteki
app.post('/api/pharmacy/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email i hasło są wymagane' });
    }

    const pharmacy = await Pharmacy.findOne({ email });

    if (!pharmacy) {
      return res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
    }

    const isPasswordValid = await bcryptjs.compare(password, pharmacy.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
    }

    const token = jwt.sign(
      { id: pharmacy._id, email: pharmacy.email, name: pharmacy.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Logowanie pomyślne',
      token,
      pharmacy: {
        id: pharmacy._id,
        name: pharmacy.name,
        city: pharmacy.city,
        email: pharmacy.email
      }
    });
  } catch (error) {
    console.log('Błąd logowania:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// ENDPOINT: Rejestracja apteki
app.post('/api/pharmacy/register', async (req, res) => {
  try {
    const { name, city, address, email, phone, password, hours } = req.body;

    const existingPharmacy = await Pharmacy.findOne({ email });
    if (existingPharmacy) {
      return res.status(400).json({ message: 'Apteka już istnieje' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const newPharmacy = new Pharmacy({
      name,
      city,
      address,
      email,
      phone,
      password: hashedPassword,
      hours
    });

    await newPharmacy.save();

    res.json({ message: 'Apteka zarejestrowana pomyślnie' });
  } catch (error) {
    console.log('Błąd rejestracji:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// ENDPOINT: Pobierz rezerwacje dla apteki
app.get('/api/pharmacy/bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ pharmacy: req.user.name });
    res.json(bookings);
  } catch (error) {
    console.log('Błąd pobierania rezerwacji:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// ENDPOINT: Zmień status rezerwacji
app.put('/api/pharmacy/booking/:id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(booking);
  } catch (error) {
    console.log('Błąd aktualizacji:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// ENDPOINT: Nowa rezerwacja (z frontendu)
app.post('/api/bookings', async (req, res) => {
  try {
    const bookingData = req.body;
    const newBooking = new Booking(bookingData);
    await newBooking.save();
    res.json({ message: 'Rezerwacja zapisana', booking: newBooking });
  } catch (error) {
    console.log('Błąd rezerwacji:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// ENDPOINT: Blokuj godzinę w aptece
app.post('/api/pharmacy/block-time', authenticateToken, async (req, res) => {
  try {
    const { date, time } = req.body;
    
    // Tworzymy "rezerwację" z statusem "blocked"
    const blockedSlot = new Booking({
      pharmacy: req.user.name,
      date,
      time,
      status: 'blocked',
      firstName: 'ZABLOKOWANA',
      lastName: 'GODZINA',
      email: 'blocked@blocked.com',
      phone: '000000000'
    });

    await blockedSlot.save();
    res.json({ message: 'Godzina zablokowana', slot: blockedSlot });
  } catch (error) {
    console.log('Błąd blokowania:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// ENDPOINT: Pobierz zajęte godziny dla apteki i daty
app.get('/api/pharmacy/blocked-times/:pharmacy/:date', async (req, res) => {
  try {
    const { pharmacy, date } = req.params;
    
    const blockedTimes = await Booking.find({
      pharmacy,
      date,
      status: { $in: ['pending', 'blocked'] }
    });

    const times = blockedTimes.map(b => b.time);
    res.json({ times });
  } catch (error) {
    console.log('Błąd pobierania godzin:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// ENDPOINT: Test
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend działa!' });
});

// Start serwera
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serwer uruchomiony na http://localhost:${PORT}`);
});