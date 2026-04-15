const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// MONGODB
mongoose.connect(process.env.MONGO_URI);

// MAIL SETUP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD
  }
});

// SCHEMAS
const bookingSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  pharmacy: String,
  service: String,
  vaccine: String,
  test: String,
  exam: String,
  medications: String,
  date: String,
  time: String,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  pharmacy: String,
  email: String,
  password: String
});

const Booking = mongoose.model('Booking', bookingSchema);
const User = mongoose.model('User', userSchema);

// MIDDLEWARE
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Brak tokenu' });
  jwt.verify(token, 'secret_key', (err, user) => {
    if (err) return res.status(403).json({ message: 'Nieważny token' });
    req.user = user;
    next();
  });
};

// HELPER: Wyślij email do pacjenta
async function sendPatientEmail(booking) {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: booking.email,
    subject: '✅ Twoja rezerwacja w Szpiczku - Potwierdzenie',
    html: `
      <h2>Cześć ${booking.firstName}! 👋</h2>
      <p>Twoja rezerwacja została <strong>potwierdzona</strong>! 🎉</p>
      
      <h3>📋 Szczegóły rezerwacji:</h3>
      <ul>
        <li><strong>Usługa:</strong> ${booking.service}</li>
        ${booking.vaccine ? `<li><strong>Szczepienie:</strong> ${booking.vaccine}</li>` : ''}
        ${booking.exam ? `<li><strong>Badanie:</strong> ${booking.exam}</li>` : ''}
        ${booking.test ? `<li><strong>Test:</strong> ${booking.test}</li>` : ''}
        <li><strong>Apteka:</strong> ${booking.pharmacy}</li>
        <li><strong>Data:</strong> ${new Date(booking.date).toLocaleDateString('pl-PL')}</li>
        <li><strong>Godzina:</strong> ${booking.time}</li>
      </ul>

      <h3>📞 Twoje dane:</h3>
      <p>
        <strong>Email:</strong> ${booking.email}<br>
        <strong>Telefon:</strong> ${booking.phone}
      </p>

      <hr>
      <p style="color: #666; font-size: 12px;">
        Jeśli chcesz zmienić rezerwację, skontaktuj się z aptekę bezpośrednio.<br>
        <strong>Zaufaj nam, zadbaj o siebie. 💙</strong>
      </p>
      <p style="color: #0f7ba8; font-weight: bold;">Szpiczek Team</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email wysłany do pacjenta: ${booking.email}`);
  } catch (error) {
    console.log(`❌ Błąd wysyłania emaila pacjentowi:`, error);
  }
}

// HELPER: Wyślij email do apteki
async function sendPharmacyEmail(booking) {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: `${booking.pharmacy}@acz.farm`,
    subject: `🔔 Nowa rezerwacja w Szpiczku - ${booking.firstName} ${booking.lastName}`,
    html: `
      <h2>Nowa rezerwacja!</h2>
      <p>Nowy pacjent zarezerwował wizytę w Twojej aptece.</p>

      <h3>👤 Dane pacjenta:</h3>
      <ul>
        <li><strong>Imię i nazwisko:</strong> ${booking.firstName} ${booking.lastName}</li>
        <li><strong>Email:</strong> ${booking.email}</li>
        <li><strong>Telefon:</strong> ${booking.phone}</li>
      </ul>

      <h3>📋 Szczegóły usługi:</h3>
      <ul>
        <li><strong>Usługa:</strong> ${booking.service}</li>
        ${booking.vaccine ? `<li><strong>Szczepienie:</strong> ${booking.vaccine}</li>` : ''}
        ${booking.exam ? `<li><strong>Badanie:</strong> ${booking.exam}</li>` : ''}
        ${booking.test ? `<li><strong>Test:</strong> ${booking.test}</li>` : ''}
        ${booking.medications ? `<li><strong>Leki pacjenta:</strong> ${booking.medications}</li>` : ''}
        <li><strong>Data:</strong> ${new Date(booking.date).toLocaleDateString('pl-PL')}</li>
        <li><strong>Godzina:</strong> ${booking.time}</li>
      </ul>

      <p style="background: #e0f7ff; padding: 10px; border-radius: 8px; margin-top: 20px;">
        <strong>Status:</strong> Oczekuje na potwierdzenie
      </p>

      <hr>
      <p style="color: #666; font-size: 12px;">
        Ten email został wysłany automatycznie z platformy Szpiczek.
      </p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email wysłany do apteki: ${booking.pharmacy}`);
  } catch (error) {
    console.log(`❌ Błąd wysyłania emaila aptece:`, error);
  }
}

// ENDPOINT: Nowa rezerwacja (z frontendu)
app.post('/api/bookings', async (req, res) => {
  try {
    const bookingData = req.body;
    const newBooking = new Booking(bookingData);
    await newBooking.save();

    // Wysyłaj emaily
    await sendPatientEmail(newBooking);
    await sendPharmacyEmail(newBooking);

    res.json({ message: 'Rezerwacja zapisana. Emaile wysłane!', booking: newBooking });
  } catch (error) {
    console.log('Błąd rezerwacji:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// ENDPOINT: Login apteki
app.post('/api/pharmacy/login', async (req, res) => {
  try {
    const { pharmacy, password } = req.body;
    const user = await User.findOne({ pharmacy });
    
    if (!user) {
      return res.status(401).json({ message: 'Apteka nie znaleziona' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Błędne hasło' });
    }

    const token = jwt.sign({ name: pharmacy }, 'secret_key', { expiresIn: '24h' });
    res.json({ token, pharmacy });
  } catch (error) {
    console.log('Błąd logowania:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// ENDPOINT: Rejestracja apteki
app.post('/api/pharmacy/register', async (req, res) => {
  try {
    const { pharmacy, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ pharmacy, password: hashedPassword });
    await newUser.save();
    res.json({ message: 'Apteka zarejestrowana' });
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

// ENDPOINT: Blokuj godzinę w aptece
app.post('/api/pharmacy/block-time', authenticateToken, async (req, res) => {
  try {
    const { date, time } = req.body;
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