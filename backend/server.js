const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const db = require('./database');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());
// Generator unikalnych tokenów
function generateToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
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

// HELPER: Email pacjent
async function sendPatientEmail(booking) {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: booking.email,
    subject: '✅ Twoja rezerwacja w Szpiczku - Potwierdzenie',
    html: `
      <div style="background: #f5f5f5; padding: 2rem; font-family: Arial, sans-serif;">
        <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          
          <div style="background: linear-gradient(135deg, #0f7ba8 0%, #1a9fcf 100%); padding: 2rem; text-align: center;">
            <div style="font-size: 14px; color: rgba(255,255,255,0.9); font-weight: 500; letter-spacing: 1px; margin-bottom: 4px;">SZPICZEK.PL</div>
            <div style="font-size: 22px; color: white; font-weight: 500;">Rezerwacja potwierdzona</div>
          </div>

          <div style="padding: 2rem;">
            <p style="font-size: 16px; color: #333; margin: 0 0 1rem 0;">Cześć ${booking.firstName}! 👋</p>
            <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 0 0 1.5rem 0;">Twoja wizyta w aptece została zarezerwowana. Poniżej szczegóły:</p>

            <div style="background: #f8fafc; border-left: 3px solid #0f7ba8; padding: 1rem 1.25rem; border-radius: 4px; margin-bottom: 1.5rem;">
              <table style="width: 100%; font-size: 14px; color: #333; border-collapse: collapse;">
                <tr><td style="padding: 4px 0; color: #777; width: 110px;">Usługa</td><td style="padding: 4px 0; font-weight: 500;">${booking.service}</td></tr>
                ${booking.vaccine ? `<tr><td style="padding: 4px 0; color: #777;">Szczepionka</td><td style="padding: 4px 0; font-weight: 500;">${booking.vaccine}</td></tr>` : ''}
                ${booking.exam ? `<tr><td style="padding: 4px 0; color: #777;">Badanie</td><td style="padding: 4px 0; font-weight: 500;">${booking.exam}</td></tr>` : ''}
                ${booking.test ? `<tr><td style="padding: 4px 0; color: #777;">Test</td><td style="padding: 4px 0; font-weight: 500;">${booking.test}</td></tr>` : ''}
                <tr><td style="padding: 4px 0; color: #777;">Apteka</td><td style="padding: 4px 0; font-weight: 500;">ACZ ${booking.pharmacy}</td></tr>
                <tr><td style="padding: 4px 0; color: #777;">Data</td><td style="padding: 4px 0; font-weight: 500;">${new Date(booking.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
                <tr><td style="padding: 4px 0; color: #777;">Godzina</td><td style="padding: 4px 0; font-weight: 500;">${booking.time}</td></tr>
              </table>
            </div>

            <p style="font-size: 13px; color: #777; line-height: 1.6; margin: 0 0 0.5rem 0;">Nie możesz przyjść? Anuluj rezerwację, by zwolnić slot dla innych pacjentów:</p>
            <p style="margin: 0 0 1.5rem 0;">
              <a href="https://szpiczek.vercel.app/cancel/${booking.cancelToken}" style="color: #0f7ba8; font-size: 13px; text-decoration: underline; font-weight: 500;">Anuluj rezerwację →</a>
            </p>

            <div style="border-top: 1px solid #eee; padding-top: 1rem; margin-top: 1.5rem;">
              <p style="font-size: 12px; color: #999; margin: 0 0 4px 0;">Zaufaj nam, zadbaj o siebie. 💙</p>
              <p style="font-size: 11px; color: #bbb; margin: 0;">Szpiczek Team · szpiczek.pl</p>
            </div>
          </div>
        </div>
      </div>
    `
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email wysłany do pacjenta: ${booking.email}`);
  } catch (error) {
    console.log(`❌ Błąd emaila pacjentowi:`, error.message);
  }
}

// HELPER: Email apteka
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
    console.log(`❌ Błąd emaila aptece:`, error.message);
  }
}

// =====================================================
// ENDPOINTY PUBLICZNE (dla pacjentów)
// =====================================================

// Nowa rezerwacja (z formularza online)
app.post('/api/bookings', async (req, res) => {
  try {
    const b = req.body;
    const cancelToken = generateToken();
    
    // Sprawdź czy pacjent jest zalogowany (opcjonalnie)
    let patientId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, 'secret_key');
        if (decoded.type === 'patient') patientId = decoded.id;
      } catch (e) {
        // Token nieważny - OK, pacjent nie zalogowany
      }
    }
    
    const stmt = db.prepare(`
      INSERT INTO bookings (firstName, lastName, email, phone, pharmacy, service, vaccine, test, exam, medications, date, time, source, cancelToken, patientId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'online', ?, ?)
    `);
    const result = stmt.run(
      b.firstName, b.lastName, b.email, b.phone, b.pharmacy, b.service,
      b.vaccine || null, b.test || null, b.exam || null, b.medications || null,
      b.date, b.time, cancelToken, patientId
    );

    const booking = { ...b, id: result.lastInsertRowid, cancelToken };
    await sendPatientEmail(booking);
    await sendPharmacyEmail(booking);

    res.json({ message: 'Rezerwacja zapisana!', booking });
  } catch (error) {
    console.log('Błąd rezerwacji:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Pobierz zajęte godziny dla apteki+data (dla formularza online)
app.get('/api/blocked-times/:pharmacy/:date', (req, res) => {
  try {
    const { pharmacy, date } = req.params;
    
    const bookings = db.prepare(`
      SELECT time FROM bookings WHERE pharmacy = ? AND date = ? AND status != 'cancelled'
    `).all(pharmacy, date);
    
    const blocked = db.prepare(`
      SELECT time FROM blocked_slots WHERE pharmacy = ? AND date = ?
    `).all(pharmacy, date);
    
    const allTimes = [...bookings.map(b => b.time), ...blocked.map(b => b.time)];
    res.json({ times: allTimes });
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// =====================================================
// ENDPOINTY APTEKI (z autoryzacją)
// =====================================================

// Login
app.post('/api/pharmacy/login', (req, res) => {
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

// Pobierz rezerwacje dla apteki
app.get('/api/pharmacy/bookings', authenticateToken, (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT * FROM bookings WHERE pharmacy = ? ORDER BY date DESC, time ASC
    `).all(req.user.name);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Rezerwacje dla danego dnia (dla kalendarza)
app.get('/api/pharmacy/bookings/:date', authenticateToken, (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT * FROM bookings WHERE pharmacy = ? AND date = ? ORDER BY time ASC
    `).all(req.user.name, req.params.date);
    
    const blocked = db.prepare(`
      SELECT * FROM blocked_slots WHERE pharmacy = ? AND date = ?
    `).all(req.user.name, req.params.date);
    
    res.json({ bookings, blocked });
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Dodaj wizytę ręcznie (walk-in/telefon)
app.post('/api/pharmacy/booking', authenticateToken, (req, res) => {
  try {
    const b = req.body;
    const stmt = db.prepare(`
      INSERT INTO bookings (firstName, lastName, email, phone, pharmacy, service, vaccine, test, exam, medications, date, time, status, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)
    `);
    const result = stmt.run(
      b.firstName, b.lastName, b.email || '', b.phone, req.user.name, b.service,
      b.vaccine || null, b.test || null, b.exam || null, b.medications || null,
      b.date, b.time, b.source || 'walk-in'
    );
    res.json({ message: 'Wizyta dodana', id: result.lastInsertRowid });
  } catch (error) {
    console.log('Błąd dodawania wizyty:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Zmień status rezerwacji
app.put('/api/pharmacy/booking/:id', authenticateToken, (req, res) => {
  try {
    const { status } = req.body;
    db.prepare(`UPDATE bookings SET status = ? WHERE id = ? AND pharmacy = ?`)
      .run(status, req.params.id, req.user.name);
    res.json({ message: 'Status zaktualizowany' });
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Usuń rezerwację
app.delete('/api/pharmacy/booking/:id', authenticateToken, (req, res) => {
  try {
    db.prepare(`DELETE FROM bookings WHERE id = ? AND pharmacy = ?`)
      .run(req.params.id, req.user.name);
    res.json({ message: 'Rezerwacja usunięta' });
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Blokuj slot
app.post('/api/pharmacy/block-slot', authenticateToken, (req, res) => {
  try {
    const { date, time, reason } = req.body;
    db.prepare(`
      INSERT INTO blocked_slots (pharmacy, date, time, reason) VALUES (?, ?, ?, ?)
    `).run(req.user.name, date, time, reason || 'Zablokowane');
    res.json({ message: 'Slot zablokowany' });
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Odblokuj slot
app.delete('/api/pharmacy/block-slot/:id', authenticateToken, (req, res) => {
  try {
    db.prepare(`DELETE FROM blocked_slots WHERE id = ? AND pharmacy = ?`)
      .run(req.params.id, req.user.name);
    res.json({ message: 'Slot odblokowany' });
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Statystyki
app.get('/api/pharmacy/stats', authenticateToken, (req, res) => {
  try {
    const pharmacy = req.user.name;
    const { from, to } = req.query;
    
    let whereClause = 'pharmacy = ?';
    let params = [pharmacy];
    
    if (from && to) {
      whereClause += ' AND date BETWEEN ? AND ?';
      params.push(from, to);
    }

    const total = db.prepare(`SELECT COUNT(*) as c FROM bookings WHERE ${whereClause}`).get(...params).c;
    const confirmed = db.prepare(`SELECT COUNT(*) as c FROM bookings WHERE ${whereClause} AND status = 'confirmed'`).get(...params).c;
    const cancelled = db.prepare(`SELECT COUNT(*) as c FROM bookings WHERE ${whereClause} AND status = 'cancelled'`).get(...params).c;
    const pending = db.prepare(`SELECT COUNT(*) as c FROM bookings WHERE ${whereClause} AND status = 'pending'`).get(...params).c;
    
    const services = db.prepare(`
      SELECT service, COUNT(*) as count FROM bookings WHERE ${whereClause} GROUP BY service
    `).all(...params);
    
    const vaccines = db.prepare(`
      SELECT vaccine, COUNT(*) as count FROM bookings 
      WHERE ${whereClause} AND vaccine IS NOT NULL GROUP BY vaccine ORDER BY count DESC LIMIT 5
    `).all(...params);
    
    const sources = db.prepare(`
      SELECT source, COUNT(*) as count FROM bookings WHERE ${whereClause} GROUP BY source
    `).all(...params);
    
    const hours = db.prepare(`
      SELECT time, COUNT(*) as count FROM bookings WHERE ${whereClause} GROUP BY time ORDER BY time
    `).all(...params);
    
    const daily = db.prepare(`
      SELECT date, COUNT(*) as count FROM bookings WHERE ${whereClause} GROUP BY date ORDER BY date
    `).all(...params);

    res.json({
      total, confirmed, cancelled, pending,
      services, vaccines, sources, hours, daily
    });
  } catch (error) {
    console.log('Błąd statystyk:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});
// ENDPOINT: Pobierz szczegóły rezerwacji po tokenie
app.get('/api/cancel/:token', (req, res) => {
  try {
    const booking = db.prepare(`SELECT * FROM bookings WHERE cancelToken = ?`).get(req.params.token);
    if (!booking) return res.status(404).json({ message: 'Nie znaleziono rezerwacji' });
    if (booking.status === 'cancelled') return res.status(400).json({ message: 'Ta rezerwacja została już anulowana' });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// ENDPOINT: Anuluj rezerwację po tokenie
app.post('/api/cancel/:token', (req, res) => {
  try {
    const booking = db.prepare(`SELECT * FROM bookings WHERE cancelToken = ?`).get(req.params.token);
    if (!booking) return res.status(404).json({ message: 'Nie znaleziono rezerwacji' });
    if (booking.status === 'cancelled') return res.status(400).json({ message: 'Ta rezerwacja została już anulowana' });
    
    db.prepare(`UPDATE bookings SET status = 'cancelled' WHERE cancelToken = ?`).run(req.params.token);
    res.json({ message: 'Rezerwacja anulowana' });
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});
// =====================================================
// ENDPOINTY KONT PACJENTÓW
// =====================================================

// Rejestracja pacjenta
app.post('/api/patient/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    
    if (!email || !password || !firstName || !lastName || !phone) {
      return res.status(400).json({ message: 'Wypełnij wszystkie pola' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Hasło musi mieć min. 6 znaków' });
    }
    
    const existing = db.prepare(`SELECT id FROM patients WHERE email = ?`).get(email);
    if (existing) {
      return res.status(400).json({ message: 'Email już zarejestrowany' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = db.prepare(`
      INSERT INTO patients (email, password, firstName, lastName, phone) 
      VALUES (?, ?, ?, ?, ?)
    `).run(email, hashedPassword, firstName, lastName, phone);
    
    const token = jwt.sign({ id: result.lastInsertRowid, email, type: 'patient' }, 'secret_key', { expiresIn: '30d' });
    res.json({ token, patient: { id: result.lastInsertRowid, email, firstName, lastName, phone } });
  } catch (error) {
    console.log('Błąd rejestracji:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Logowanie pacjenta
app.post('/api/patient/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const patient = db.prepare(`SELECT * FROM patients WHERE email = ?`).get(email);
    
    if (!patient) {
      return res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
    }
    
    const isValid = await bcrypt.compare(password, patient.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
    }
    
    const token = jwt.sign({ id: patient.id, email: patient.email, type: 'patient' }, 'secret_key', { expiresIn: '30d' });
    res.json({ 
      token, 
      patient: { id: patient.id, email: patient.email, firstName: patient.firstName, lastName: patient.lastName, phone: patient.phone } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Middleware dla pacjenta
const authenticatePatient = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Brak tokenu' });
  jwt.verify(token, 'secret_key', (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Nieważny token' });
    if (decoded.type !== 'patient') return res.status(403).json({ message: 'Brak dostępu' });
    req.patient = decoded;
    next();
  });
};

// Moje rezerwacje
app.get('/api/patient/bookings', authenticatePatient, (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT * FROM bookings WHERE patientId = ? OR email = ? ORDER BY date DESC, time DESC
    `).all(req.patient.id, req.patient.email);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Anuluj rezerwację (zalogowany pacjent)
app.post('/api/patient/cancel/:id', authenticatePatient, (req, res) => {
  try {
    const booking = db.prepare(`SELECT * FROM bookings WHERE id = ?`).get(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Nie znaleziono' });
    
    if (booking.patientId !== req.patient.id && booking.email !== req.patient.email) {
      return res.status(403).json({ message: 'Brak dostępu' });
    }
    
    db.prepare(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`).run(req.params.id);
    res.json({ message: 'Rezerwacja anulowana' });
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Moje dane (profil)
app.get('/api/patient/me', authenticatePatient, (req, res) => {
  try {
    const patient = db.prepare(`SELECT id, email, firstName, lastName, phone FROM patients WHERE id = ?`).get(req.patient.id);
    if (!patient) return res.status(404).json({ message: 'Nie znaleziono' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Błąd serwera' });
  }
});
// Test
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend działa z SQLite!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serwer uruchomiony na http://localhost:${PORT}`);
});