const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// MAIL SETUP
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// MOCK DATA (w pamięci)
let bookings = [];
let users = [
  { pharmacy: 'Myślibórz', password: '$2b$10$YourHashedPassword' },
  { pharmacy: 'Świnoujście', password: '$2b$10$YourHashedPassword' },
  { pharmacy: 'Szczecin (Gierczak)', password: '$2b$10$YourHashedPassword' },
  { pharmacy: 'Szczecin (Nałkowska)', password: '$2b$10$YourHashedPassword' },
  { pharmacy: 'Police', password: '$2b$10$YourHashedPassword' }
];

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

      <hr>
      <p style="color: #0f7ba8; font-weight: bold;">Szpiczek Team</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email wysłany do pacjenta: ${booking.email}`);
  } catch (error) {
    console.log(`❌ Błąd wysyłania emaila pacjentowi:`, error.message);
  }
}

// HELPER: Wyślij email do apteki
async function sendPharmacyEmail(booking) {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: `${booking.pharmacy}@acz.farm`,
    subject: `🔔 Nowa rezerwacja - ${booking.firstName} ${booking.lastName}`,
    html: `
      <h2>Nowa rezerwacja!</h2>
      <p>Pacjent: ${booking.firstName} ${booking.lastName}</p>
      <p>Email: ${booking.email}</p>
      <p>Telefon: ${booking.phone}</p>
      <p>Usługa: ${booking.service}</p>
      <p>Data: ${new Date(booking.date).toLocaleDateString('pl-PL')} o ${booking.time}</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email wysłany do apteki: ${booking.pharmacy}`);
  } catch (error) {
    console.log(`❌ Błąd wysyłania emaila aptece:`, error.message);
  }
}

// ENDPOINT: Nowa rezerwacja
app.post('/api/bookings', async (req, res) => {
  try {
    const bookingData = { ...req.body, _id: Date.now().toString(), status: 'pending' };
    bookings.push(bookingData);

    await sendPatientEmail(bookingData);
    await sendPharmacyEmail(bookingData);

    res.json({ message: 'Rezerwacja zapisana!', booking: bookingData });
  } catch (error) {
    console.log('Błąd rezerwacji:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// ENDPOINT: Login apteki
app.post('/api/pharmacy/login', async (req, res) => {
  try {
    const { pharmacy, password } = req.body;
    
    if (pharmacy && password === 'password123') {
      const token = jwt.sign({ name: pharmacy }, 'secret_key', { expiresIn: '24h' });
      res.json({ token, pharmacy });
    } else {
      res.status(401).json({ message: 'Błędne dane logowania' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// ENDPOINT: Pobierz rezerwacje dla apteki
app.get('/api/pharmacy/bookings', authenticateToken, async (req, res) => {
  try {
    const pharmacyBookings = bookings.filter(b => b.pharmacy === req.user.name);
    res.json(pharmacyBookings);
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// ENDPOINT: Zmień status rezerwacji
app.put('/api/pharmacy/booking/:id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = bookings.find(b => b._id === req.params.id);
    
    if (booking && booking.pharmacy === req.user.name) {
      booking.status = status;
      res.json(booking);
    } else {
      res.status(403).json({ message: 'Brak dostępu' });
    }
  } catch (error) {
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