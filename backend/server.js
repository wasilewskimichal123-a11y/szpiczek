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

// HELPER: Email pacjent — Szpiczek edition (neonowa orbita)
async function sendPatientEmail(booking) {
  const dateFormatted = new Date(booking.date).toLocaleDateString('pl-PL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: booking.email,
    subject: `✓ Rezerwacja potwierdzona — ${new Date(booking.date).toLocaleDateString('pl-PL')} o ${booking.time}`,
    html: `
<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rezerwacja potwierdzona</title>
</head>
<body style="margin:0;padding:0;background:#e8ecf0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#e8ecf0;padding:20px 0;">
<tr><td align="center">

<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.12);">

  <!-- HEADER (neonowa orbita) -->
  <tr>
    <td style="background:linear-gradient(135deg,#0a1929 0%,#0d9488 120%);padding:48px 32px;text-align:center;">
      <div style="display:inline-block;width:72px;height:72px;background:linear-gradient(135deg,#14b8a6,#0d9488);border-radius:50%;text-align:center;line-height:72px;font-size:36px;color:white;box-shadow:0 0 30px rgba(20,184,166,0.5);margin-bottom:16px;">✓</div>
      <h1 style="color:#ffffff;font-size:28px;font-weight:800;margin:8px 0 6px;letter-spacing:-0.5px;">Wszystko <span style="color:#14b8a6;">gotowe</span>!</h1>
      <p style="color:rgba(255,255,255,0.75);font-size:13px;margin:0;font-weight:600;letter-spacing:1.2px;">TWOJA REZERWACJA POTWIERDZONA</p>
    </td>
  </tr>

  <!-- BODY -->
  <tr>
    <td style="padding:40px 32px 24px;color:#1c1917;">
      <h2 style="font-size:22px;font-weight:700;color:#134e4a;margin:0 0 8px;">Cześć ${booking.firstName}! 👋</h2>
      <p style="font-size:15px;color:#44403c;line-height:1.6;margin:0 0 28px;">
        Twoja wizyta w aptece została potwierdzona. Zobacz szczegóły poniżej i zapisz tę datę w kalendarzu — czekamy na Ciebie!
      </p>

      <!-- PIGUŁKA REZERWACJI -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:linear-gradient(135deg,#f0fdf9 0%,#ccfbf1 100%);border:1px solid rgba(13,148,136,0.2);border-radius:20px;margin-bottom:28px;">
        <tr><td style="padding:28px;">
          <div style="display:inline-block;background:linear-gradient(135deg,#0d9488,#14b8a6);color:white;font-size:11px;padding:5px 13px;border-radius:9999px;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;margin-bottom:18px;">📋 Szczegóły wizyty</div>

          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="font-size:15px;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(13,148,136,0.1);color:#78716c;font-weight:500;width:130px;">📅 Data</td>
              <td style="padding:10px 0;border-bottom:1px solid rgba(13,148,136,0.1);color:#0d9488;font-weight:700;font-size:17px;">${dateFormatted}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(13,148,136,0.1);color:#78716c;font-weight:500;">🕐 Godzina</td>
              <td style="padding:10px 0;border-bottom:1px solid rgba(13,148,136,0.1);color:#0d9488;font-weight:700;font-size:17px;">${booking.time}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(13,148,136,0.1);color:#78716c;font-weight:500;">💉 Usługa</td>
              <td style="padding:10px 0;border-bottom:1px solid rgba(13,148,136,0.1);color:#134e4a;font-weight:700;">${booking.service}</td>
            </tr>
            ${booking.vaccine ? `<tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(13,148,136,0.1);color:#78716c;font-weight:500;">🦠 Szczepionka</td>
              <td style="padding:10px 0;border-bottom:1px solid rgba(13,148,136,0.1);color:#134e4a;font-weight:700;">${booking.vaccine}</td>
            </tr>` : ''}
            ${booking.exam ? `<tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(13,148,136,0.1);color:#78716c;font-weight:500;">📊 Badanie</td>
              <td style="padding:10px 0;border-bottom:1px solid rgba(13,148,136,0.1);color:#134e4a;font-weight:700;">${booking.exam}</td>
            </tr>` : ''}
            ${booking.test ? `<tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(13,148,136,0.1);color:#78716c;font-weight:500;">🧬 Test</td>
              <td style="padding:10px 0;border-bottom:1px solid rgba(13,148,136,0.1);color:#134e4a;font-weight:700;">${booking.test}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:10px 0;color:#78716c;font-weight:500;">🏥 Apteka</td>
              <td style="padding:10px 0;color:#134e4a;font-weight:700;">ACZ ${booking.pharmacy}</td>
            </tr>
          </table>
        </td></tr>
      </table>

      <!-- JAK SIĘ PRZYGOTOWAĆ -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#fafaf7;border-radius:16px;margin-bottom:24px;">
        <tr><td style="padding:24px;">
          <h3 style="font-size:16px;color:#134e4a;margin:0 0 14px;font-weight:700;">✨ Jak się przygotować?</h3>
          <p style="margin:0 0 6px;padding-left:24px;color:#44403c;font-size:14px;line-height:1.6;position:relative;"><span style="color:#0d9488;font-weight:700;margin-right:8px;">→</span>Przyjdź <strong>5 minut wcześniej</strong>, żeby spokojnie wejść</p>
          <p style="margin:0 0 6px;padding-left:24px;color:#44403c;font-size:14px;line-height:1.6;"><span style="color:#0d9488;font-weight:700;margin-right:8px;">→</span>Zabierz <strong>dokument tożsamości</strong> (dowód osobisty)</p>
          <p style="margin:0 0 6px;padding-left:24px;color:#44403c;font-size:14px;line-height:1.6;"><span style="color:#0d9488;font-weight:700;margin-right:8px;">→</span>Na miejscu zapłacisz gotówką lub kartą</p>
          <p style="margin:0;padding-left:24px;color:#44403c;font-size:14px;line-height:1.6;"><span style="color:#0d9488;font-weight:700;margin-right:8px;">→</span>Wizyta trwa zazwyczaj <strong>10-15 minut</strong></p>
        </td></tr>
      </table>

      <!-- ANULACJA -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#fef8f0;border-left:3px solid #f59e0b;border-radius:8px;margin-bottom:12px;">
        <tr><td style="padding:16px 20px;">
          <p style="margin:0 0 6px;font-size:14px;color:#78716c;line-height:1.5;"><strong style="color:#d97706;">⚠️ Nie możesz przyjść?</strong></p>
          <p style="margin:0 0 12px;font-size:14px;color:#78716c;line-height:1.5;">Anuluj rezerwację, żeby zwolnić termin dla innych pacjentów. To zajmie 10 sekund.</p>
          <a href="https://szpiczek.vercel.app/cancel/${booking.cancelToken}" style="color:#d97706;font-size:14px;font-weight:600;text-decoration:none;">Anuluj rezerwację →</a>
        </td></tr>
      </table>
    </td>
  </tr>

  <!-- FOOTER (neonowa orbita) -->
  <tr>
    <td style="background:#0a1929;padding:32px 24px;text-align:center;">
      <p style="font-size:15px;font-weight:700;margin:0 0 14px;color:white;">Zaufaj nam, <span style="color:#14b8a6;">zadbaj o siebie.</span> 💙</p>
      <div style="display:inline-block;padding:6px 14px;border:1px solid rgba(20,184,166,0.3);border-radius:9999px;background:rgba(20,184,166,0.06);">
        <span style="display:inline-block;width:6px;height:6px;background:#14b8a6;border-radius:50%;box-shadow:0 0 8px #14b8a6;vertical-align:middle;margin-right:6px;"></span>
        <span style="color:rgba(255,255,255,0.85);font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600;vertical-align:middle;">BUILT BY <span style="color:#14b8a6;font-weight:700;">MW</span></span>
      </div>
    </td>
  </tr>

</table>
</td></tr></table>
</body>
</html>
    `
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✓ Email wysłany do pacjenta: ${booking.email}`);
  } catch (error) {
    console.log(`✗ Błąd emaila pacjentowi:`, error.message);
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
    console.log(`✓ Email wysłany do apteki: ${booking.pharmacy}`);
  } catch (error) {
    console.log(`✗ Błąd emaila aptece:`, error.message);
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
