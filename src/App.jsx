import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';

const API_URL = 'https://szpiczek-backend.onrender.com';
// ============================================================
// HOOKS I HELPERY DLA KONT PACJENTÓW
// ============================================================
// Hook do magnetic effect na przyciskach
function useMagnetic(ref, radius = 80, strength = 0.4) {
  useEffect(() => {
    if (!ref.current) return;
    
    const el = ref.current;
    
    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < radius) {
        const pull = (radius - dist) / radius;
        el.style.transform = `translate(${dx * pull * strength}px, ${dy * pull * strength}px)`;
      } else {
        el.style.transform = 'translate(0, 0)';
      }
    };
    
    const handleMouseLeave = () => {
      el.style.transform = 'translate(0, 0)';
    };
    
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.innerWidth < 768) return;
    
    document.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref, radius, strength]);
}
function usePatientAuth() {
  const [patient, setPatient] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('patientToken'));

  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/api/patient/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setPatient(data);
          else {
            localStorage.removeItem('patientToken');
            setToken(null);
          }
        })
        .catch(() => {});
    }
  }, [token]);

  const login = (newToken, patientData) => {
    localStorage.setItem('patientToken', newToken);
    setToken(newToken);
    setPatient(patientData);
  };

  const logout = () => {
    localStorage.removeItem('patientToken');
    setToken(null);
    setPatient(null);
  };

  return { patient, token, login, logout };
}

// ============================================================
// STRONA GŁÓWNA (rezerwacje pacjentów)
// ============================================================
function HomePage() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedService, setSelectedService] = useState(null);
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [blockedTimes, setBlockedTimes] = useState([]);
  const [booking, setBooking] = useState(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState({ num1: 0, num2: 0, answer: 0 });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', medications: ''
  });

  const pharmacies = [
    { id: 1, name: 'ACZ', city: 'Myślibórz', address: 'ul. Lipowa 7A', email: 'mysliborz1@acz.farm', hours: 'pon-pt 8-16' },
    { id: 2, name: 'ACZ', city: 'Świnoujście', address: 'ul. Fińska 4', email: 'swinoujscie1@acz.farm', hours: 'codziennie 8-16' },
    { id: 3, name: 'ACZ', city: 'Szczecin (Gierczak)', address: 'ul. Gierczak 32D/U1', email: 'szczecin@acz.farm', hours: 'codziennie 8-16' },
    { id: 4, name: 'ACZ', city: 'Szczecin (Nałkowska)', address: 'ul. Nałkowskiej 8/U7', email: 'szczecin1@acz.farm', hours: 'pon-pt 8-16' },
    { id: 5, name: 'ACZ', city: 'Police', address: 'ul. Bankowa 5/U1', email: 'police1@acz.farm', hours: 'pon-pt 8-16' }
  ];

  const vaccines = [
    'Kleszczowe zapalenie mózgu', 'Meningokoki typ B i ACWY', 'Odra/Świnka/Różyczka',
    'Błonica/Tężec/Krztusiec', 'WZW typ A i B', 'Ospa wietrzna', 'Dur brzuszny',
    'Pneumokoki', 'Półpasiec', 'Polio', 'Żółta Febra', 'Grypa', 'Covid-19', 'RSV', 'HPV'
  ];

  const tests = ['Angina', 'COVID-19', 'CRP', 'Cholesterol'];
  const exams = ['Pomiar glukozy', 'Pomiar ciśnienia', 'Saturacja krwi', 'Analiza masy ciała'];

  const timeSlots = Array.from({ length: 17 }, (_, i) => {
    const hour = 8 + Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour}:${minute}`;
  });

  const serviceNames = {
    'szczepienia': 'Szczepienia',
    'przeglądy': 'Przeglądy lekowe',
    'badania': 'Badania diagnostyczne',
    'testy': 'Testy diagnostyczne'
  };

  const slogans = {
    'vaccines-grid': '🛡️ Jeden wybór, pełna ochrona - która szczepionka dla Ciebie?',
    'tests-grid': '🧬 Poznaj wynik - który test diagnostyczny dla Ciebie?',
    'exams-grid': '📊 Zbadaj się - które badanie diagnostyczne dla Ciebie?',
    'pharmacies-szczepienia': '⏱️ Zbliżasz się - teraz tylko wybierz aptekę i umów się',
    'pharmacies-przeglądy': '💊 Wybierz aptekę - farmaceuta przejrzy Twoje leki',
    'pharmacies-badania': '📊 Wybierz aptekę - zrobimy badanie diagnostyczne',
    'pharmacies-testy': '🧬 Wybierz aptekę - zrobimy test diagnostyczny',
    'booking': '✍️ Ostatnie 2 minuty - wpisz dane i masz terminu!',
    'confirmation': '🎊 Zrobiłeś to! Teraz możesz żyć bez obaw'
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    return new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0];
  };

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptchaQuestion({ num1, num2, answer: num1 + num2 });
    setCaptchaAnswer('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);
  // Auto-wypełnij dane zalogowanego pacjenta
  useEffect(() => {
    const patientData = localStorage.getItem('patientData');
    if (patientData) {
      try {
        const p = JSON.parse(patientData);
        setFormData(prev => ({
          ...prev,
          firstName: p.firstName || '',
          lastName: p.lastName || '',
          email: p.email || '',
          phone: p.phone || ''
        }));
      } catch (e) {}
    }
  }, []);

  // Pobierz zajęte godziny gdy zmieni się data/apteka
  useEffect(() => {
    if (selectedPharmacy && selectedDate) {
      fetch(`${API_URL}/api/blocked-times/${encodeURIComponent(selectedPharmacy.city)}/${selectedDate}`)
        .then(res => res.json())
        .then(data => setBlockedTimes(data.times || []))
        .catch(() => setBlockedTimes([]));
    }
  }, [selectedPharmacy, selectedDate]);

  const validateEmail = (email) => email.includes('@') && email.includes('.');
  const validatePhone = (phone) => phone.replace(/\D/g, '').length >= 9;

  const validateForm = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = 'Imię jest wymagane';
    if (!formData.lastName.trim()) errors.lastName = 'Nazwisko jest wymagane';
    if (!validateEmail(formData.email)) errors.email = 'Email musi zawierać @';
    if (!formData.phone || !validatePhone(formData.phone)) errors.phone = 'Telefon musi mieć min. 9 cyfr';
    if (!selectedDate) errors.date = 'Wybierz datę';
    if (!selectedTime) errors.time = 'Wybierz godzinę';
    if (captchaAnswer !== captchaQuestion.answer.toString()) errors.captcha = 'Błędna odpowiedź';
    if (selectedService === 'przeglądy' && !formData.medications.trim()) errors.medications = 'Wpisz listę leków';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleServiceClick = (service) => {
    setSelectedService(service);
    if (service === 'szczepienia') setCurrentPage('vaccines-grid');
    else if (service === 'testy') setCurrentPage('tests-grid');
    else if (service === 'badania') setCurrentPage('exams-grid');
    else if (service === 'przeglądy') setCurrentPage('pharmacies');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setFormData({ ...formData, [name]: value.replace(/\D/g, '') });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const createBooking = async () => {
    setLoading(true);
    try {
      const bookingData = {
        firstName: formData.firstName, lastName: formData.lastName,
        email: formData.email, phone: formData.phone,
        pharmacy: selectedPharmacy.city, service: serviceNames[selectedService],
        vaccine: selectedVaccine || null, test: selectedTest || null,
        exam: selectedExam || null, medications: formData.medications || null,
        date: selectedDate, time: selectedTime
      };
      const patientToken = localStorage.getItem('patientToken');
      const headers = { 'Content-Type': 'application/json' };
      if (patientToken) headers['Authorization'] = `Bearer ${patientToken}`;
      
      const response = await fetch(`${API_URL}/api/bookings`, {
        method: 'POST',
        headers,
        body: JSON.stringify(bookingData)
      });
      if (!response.ok) throw new Error('Błąd');
      setBooking(bookingData);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', medications: '' });
      setSelectedTime(null);
      setSelectedDate(null);
      setCurrentPage('confirmation');
    } catch (error) {
      alert('Błąd wysyłania rezerwacji. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackHome = () => {
    setCurrentPage('home');
    setSelectedService(null); setSelectedPharmacy(null);
    setSelectedVaccine(null); setSelectedTest(null); setSelectedExam(null);
    setSelectedTime(null); setSelectedDate(null); setFormErrors({});
  };

  const renderFooter = () => (
    <footer className="footer" style={{ textAlign: 'center', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <p className="footer-slogan" style={{ margin: '0 0 0.5rem 0' }}>Zaufaj nam, zadbaj o siebie. 💙</p>
      <p style={{ margin: 0, fontSize: '12px', color: '#0c4a6e', opacity: 0.7 }}>Built by MW</p>
    </footer>
  );

  const renderHeader = (slogan) => (
    <div className="header">
      <div className="container">
        <button className="btn-back" onClick={handleBackHome}>← Wróć</button>
        <div className="header-center"><div className="header-slogan">{slogan}</div></div>
        <div style={{ width: '60px' }}></div>
      </div>
    </div>
  );

  if (currentPage === 'home') {
    return (
      <div className="app">
        <main>
          <div className="container">
            <div className="hero-section">
              <div className="hero-mascot">
                <img src="/images/szpiczek2.PNG" alt="Szpiczek" className="hero-image" />
              </div>
              <div className="hero-text">
                <h1 className="hero-title">Cześć! Jestem Szpiczek! 👋</h1>
                <p className="hero-subtitle">Twój osobisty asystent do rezerwacji usług zdrowotnych w aptece</p>
                <p className="hero-description">Wybierz usługę poniżej i zarezerwuj termin. Bez kolejek, bez stresów!</p>
              </div>
            </div>
            <div className="services-grid">
              <div className="service-card" onClick={() => handleServiceClick('szczepienia')}>
                <div className="service-icon">💉</div><h3>Szczepienia</h3>
                <p>Szczepienia dostępne w aptece</p>
                <button className="btn-service">Zarezerwuj</button>
              </div>
              <div className="service-card" onClick={() => handleServiceClick('przeglądy')}>
                <div className="service-icon">🩺</div><h3>Przeglądy lekowe</h3>
                <p>Zapytaj farmaceute o swoje leki</p>
                <button className="btn-service">Zarezerwuj</button>
              </div>
              <div className="service-card" onClick={() => handleServiceClick('badania')}>
                <div className="service-icon">📊</div><h3>Badania diagnostyczne</h3>
                <p>Badania dostępne w aptece</p>
                <button className="btn-service">Zarezerwuj</button>
              </div>
              <div className="service-card" onClick={() => handleServiceClick('testy')}>
                <div className="service-icon">🧬</div><h3>Testy diagnostyczne</h3>
                <p>Testy dostępne w aptece</p>
                <button className="btn-service">Zarezerwuj</button>
              </div>
            </div>
          </div>
        </main>
        {renderFooter()}
      </div>
    );
  }

  if (currentPage === 'vaccines-grid') {
    return (
      <div className="app">{renderHeader(slogans['vaccines-grid'])}
        <main><div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '2.5rem', color: '#0f7ba8', fontSize: '1.8rem', fontWeight: '700' }}>Wybierz szczepienie</h2>
          <div className="vaccines-grid">
            {vaccines.map(v => (
              <div key={v} className="vaccine-card" onClick={() => { setSelectedVaccine(v); setCurrentPage('pharmacies'); }}>
                <div className="vaccine-card-icon">💉</div><h3>{v}</h3>
                <button className="btn-service">Wybierz</button>
              </div>
            ))}
          </div>
        </div></main>
        {renderFooter()}
      </div>
    );
  }

  if (currentPage === 'exams-grid') {
    return (
      <div className="app">{renderHeader(slogans['exams-grid'])}
        <main><div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '2.5rem', color: '#0f7ba8', fontSize: '1.8rem', fontWeight: '700' }}>Wybierz badanie diagnostyczne</h2>
          <div className="vaccines-grid">
            {exams.map(e => (
              <div key={e} className="vaccine-card" onClick={() => { setSelectedExam(e); setCurrentPage('pharmacies'); }}>
                <div className="vaccine-card-icon">📊</div><h3>{e}</h3>
                <button className="btn-service">Wybierz</button>
              </div>
            ))}
          </div>
        </div></main>
        {renderFooter()}
      </div>
    );
  }

  if (currentPage === 'tests-grid') {
    return (
      <div className="app">{renderHeader(slogans['tests-grid'])}
        <main><div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '2.5rem', color: '#0f7ba8', fontSize: '1.8rem', fontWeight: '700' }}>Wybierz test diagnostyczny</h2>
          <div className="vaccines-grid">
            {tests.map(t => (
              <div key={t} className="vaccine-card" onClick={() => { setSelectedTest(t); setCurrentPage('pharmacies'); }}>
                <div className="vaccine-card-icon">🧬</div><h3>{t}</h3>
                <button className="btn-service">Wybierz</button>
              </div>
            ))}
          </div>
        </div></main>
        {renderFooter()}
      </div>
    );
  }

  if (currentPage === 'pharmacies') {
    return (
      <div className="app">{renderHeader(slogans[`pharmacies-${selectedService}`])}
        <main><div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '2.5rem', color: '#0f7ba8', fontSize: '1.8rem', fontWeight: '700' }}>Wybierz aptekę</h2>
          <div className="pharmacies-grid">
            {pharmacies.map(p => (
              <div key={p.id} className="pharmacy-card" onClick={() => { setSelectedPharmacy(p); setCurrentPage('booking'); setSelectedDate(null); setSelectedTime(null); }}>
                <h3>{p.name}</h3>
                <div className="city">{p.city}</div>
                <div className="address">{p.address}</div>
                <div className="hours">{p.hours}</div>
                <div className="email">{p.email}</div>
                <button className="btn-primary">Wybierz</button>
              </div>
            ))}
          </div>
        </div></main>
        {renderFooter()}
      </div>
    );
  }

  if (currentPage === 'booking') {
    return (
      <div className="app">{renderHeader(slogans['booking'])}
        <main><div className="container">
          <div className="booking-container">
            <div className="booking-header">
              <h2>{serviceNames[selectedService]}</h2>
              <p>{selectedPharmacy.city} - {selectedPharmacy.address}</p>
            </div>
            <div className="booking-form">
              <div className="form-section">
                <h3>Dane osobowe</h3>
                <input type="text" name="firstName" placeholder="Imię" value={formData.firstName} onChange={handleFormChange} className={`form-input ${formErrors.firstName ? 'input-error' : ''}`} />
                {formErrors.firstName && <span className="error-message">{formErrors.firstName}</span>}
                <input type="text" name="lastName" placeholder="Nazwisko" value={formData.lastName} onChange={handleFormChange} className={`form-input ${formErrors.lastName ? 'input-error' : ''}`} />
                {formErrors.lastName && <span className="error-message">{formErrors.lastName}</span>}
                <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleFormChange} className={`form-input ${formErrors.email ? 'input-error' : ''}`} />
                {formErrors.email && <span className="error-message">{formErrors.email}</span>}
                <input type="text" name="phone" placeholder="Telefon (min. 9 cyfr)" value={formData.phone} onChange={handleFormChange} className={`form-input ${formErrors.phone ? 'input-error' : ''}`} />
                {formErrors.phone && <span className="error-message">{formErrors.phone}</span>}
              </div>

              {selectedService === 'przeglądy' && (
                <div className="form-section">
                  <h3>Jakie leki państwo przyjmują?</h3>
                  <textarea name="medications" placeholder="Wpisz listę leków..." value={formData.medications} onChange={handleFormChange} className={`form-textarea ${formErrors.medications ? 'input-error' : ''}`} rows="5"></textarea>
                  {formErrors.medications && <span className="error-message">{formErrors.medications}</span>}
                </div>
              )}

              <div className="form-section">
                <h3>Wybierz datę</h3>
                <input type="date" value={selectedDate || ''} onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(null); }} min={getMinDate()} max={getMaxDate()} className={`form-input ${formErrors.date ? 'input-error' : ''}`} />
                {formErrors.date && <span className="error-message">{formErrors.date}</span>}
              </div>

              <div className="form-section">
                <h3>Wybierz godzinę</h3>
                {!selectedDate && <p style={{ color: '#999', fontSize: '14px' }}>Najpierw wybierz datę</p>}
                {selectedDate && (
                  <div className="time-slots">
                    {timeSlots.map(time => {
                      const isBlocked = blockedTimes.includes(time);
                      return (
                        <div 
                          key={time} 
                          className={`time-slot ${selectedTime === time ? 'active' : ''}`}
                          style={isBlocked ? { opacity: 0.3, textDecoration: 'line-through', cursor: 'not-allowed', background: '#f0f0f0' } : {}}
                          onClick={() => !isBlocked && setSelectedTime(time)}
                        >
                          {time}
                        </div>
                      );
                    })}
                  </div>
                )}
                {formErrors.time && <span className="error-message">{formErrors.time}</span>}
              </div>

              <div className="form-section captcha-section">
                <h3>Potwierdź że nie jesteś botem</h3>
                <p className="captcha-question">{captchaQuestion.num1} + {captchaQuestion.num2} = ?</p>
                <input type="text" placeholder="Wpisz wynik" value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)} className={`form-input captcha-input ${formErrors.captcha ? 'input-error' : ''}`} />
                {formErrors.captcha && <span className="error-message">{formErrors.captcha}</span>}
              </div>

              <button className="btn-primary btn-large" onClick={() => validateForm() && createBooking()} disabled={loading}>
                {loading ? 'Wysyłanie...' : 'Potwierdź rezerwację'}
              </button>
            </div>
          </div>
        </div></main>
        {renderFooter()}
      </div>
    );
  }

  if (currentPage === 'confirmation') {
    return (
      <div className="app">{renderHeader(slogans['confirmation'])}
        <main><div className="container">
          <div className="confirmation">
            <div className="celebration-container">
              <img src="/images/szpiczek2.PNG" alt="Szpiczek" className="celebration-mascot" />
            </div>
            <h2 className="celebration-title">Superhero! 🦸‍♂️</h2>
            <p className="celebration-subtitle">Właśnie stałeś się niezniszczalny!</p>
            <div className="celebration-divider"></div>
            <h3 style={{ marginTop: '2rem', color: '#0f7ba8', fontSize: '1.4rem', fontWeight: '700' }}>Rezerwacja potwierdzona!</h3>
            <p>Email potwierdzenia został wysłany na {booking.email}</p>
            <div className="confirmation-details">
              <div className="detail-row"><span className="label">Imię i nazwisko</span><span className="value">{booking.firstName} {booking.lastName}</span></div>
              <div className="detail-row"><span className="label">Email</span><span className="value">{booking.email}</span></div>
              <div className="detail-row"><span className="label">Telefon</span><span className="value">{booking.phone}</span></div>
              <div className="detail-row"><span className="label">Usługa</span><span className="value">{booking.service}</span></div>
              {booking.vaccine && <div className="detail-row"><span className="label">Szczepienie</span><span className="value">{booking.vaccine}</span></div>}
              {booking.exam && <div className="detail-row"><span className="label">Badanie</span><span className="value">{booking.exam}</span></div>}
              {booking.test && <div className="detail-row"><span className="label">Test</span><span className="value">{booking.test}</span></div>}
              <div className="detail-row"><span className="label">Apteka</span><span className="value">{booking.pharmacy}</span></div>
              <div className="detail-row"><span className="label">Data i godzina</span><span className="value">{new Date(booking.date).toLocaleDateString('pl-PL')} o {booking.time}</span></div>
            </div>
            <div className="confirmation-footer">
              <button className="btn-primary btn-large" onClick={handleBackHome}>Powróć do strony głównej</button>
            </div>
          </div>
        </div></main>
        {renderFooter()}
      </div>
    );
  }
}

// ============================================================
// STRONY STATYCZNE
// ============================================================
// ============================================================
// STRONY STATYCZNE
// ============================================================
function AboutPage() {
  return (
    <div className="app">
      <main>
        <div className="container" style={{ padding: '3rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ color: '#0f7ba8', marginBottom: '2rem' }}>📖 O Szpiczku</h1>
          
          <h2 style={{ color: '#0f7ba8', marginTop: '2rem' }}>Nasza misja</h2>
          <p style={{ lineHeight: '1.8', color: '#555', marginBottom: '2rem' }}>
            Szpiczek to innowacyjna platforma, która zmienia dostęp do usług zdrowotnych w aptekach. Naszym celem jest wyeliminowanie kolejek i uproszczenie procesu rezerwacji szczepień, badań diagnostycznych i przeglądu leków.
          </p>

          <h2 style={{ color: '#0f7ba8', marginTop: '2rem' }}>Co nas wyróżnia?</h2>
          <p style={{ lineHeight: '1.8', color: '#555', marginBottom: '2rem' }}>
            ✅ Szybkie rezerwacje online<br/>
            ✅ Dostęp do wielu aptek w regionie<br/>
            ✅ Potwierdzenie rezerwacji w kilka sekund<br/>
            ✅ Bezpieczeństwo danych pacjenta
          </p>

          <h2 style={{ color: '#0f7ba8', marginTop: '2rem' }}>Nasze wartości</h2>
          <p style={{ lineHeight: '1.8', color: '#555', marginBottom: '2rem' }}>
            Wierzymy w demokratyzację opieki zdrowotnej. Każdy ma prawo do szybkiego i wygodnego dostępu do usług medycznych, niezależnie od wieku czy lokalizacji.
          </p>
        </div>
      </main>

      <footer className="footer" style={{ textAlign: 'center', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <p className="footer-slogan" style={{ margin: '0 0 0.5rem 0' }}>Zaufaj nam, zadbaj o siebie. 💙</p>
        <p style={{ margin: 0, fontSize: '12px', color: '#0c4a6e', opacity: 0.7 }}>Built by MW</p>
      </footer>
    </div>
  );
}

function FAQPage() {
  const faqs = [
    { q: 'Jak rezerwować usługę?', a: 'Kliknij na wybraną usługę, wybierz szczepionkę/badanie, aptekę, datę i godzinę. Gotowe!' },
    { q: 'Czy rezerwacja jest bezpłatna?', a: 'Sama rezerwacja jest bezpłatna. Płacisz za usługę w aptece.' },
    { q: 'Czy mogę zmienić rezerwację?', a: 'Kontaktuj się z aptekę bezpośrednio lub napisz do nas.' },
    { q: 'Które szczepienia są dostępne?', a: 'Oferujemy 15 szczepień od Kleszczowego zapalenia mózgu po HPV.' },
    { q: 'Jakie badania diagnostyczne mamy?', a: 'Pomiar glukozy, ciśnienia, saturacji krwi i analizę masy ciała.' },
    { q: 'Jak długo trwa wizyta?', a: 'Średnio 15-30 minut, w zależności od usługi.' }
  ];

  return (
    <div className="app">
      <main>
        <div className="container" style={{ padding: '3rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ color: '#0f7ba8', marginBottom: '2rem' }}>❓ Często zadawane pytania</h1>
          
          {faqs.map((faq, idx) => (
            <div key={idx} style={{ marginBottom: '2rem', borderLeft: '4px solid #0f7ba8', paddingLeft: '1.5rem' }}>
              <h3 style={{ color: '#0f7ba8', marginBottom: '0.5rem' }}>Q: {faq.q}</h3>
              <p style={{ color: '#555', lineHeight: '1.8' }}>A: {faq.a}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="footer" style={{ textAlign: 'center', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <p className="footer-slogan" style={{ margin: '0 0 0.5rem 0' }}>Zaufaj nam, zadbaj o siebie. 💙</p>
        <p style={{ margin: 0, fontSize: '12px', color: '#0c4a6e', opacity: 0.7 }}>Built by MW</p>
      </footer>
    </div>
  );
}

function ContactPage() {
  return (
    <div className="app">
      <main>
        <div className="container" style={{ padding: '3rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ color: '#0f7ba8', marginBottom: '2rem' }}>📧 Kontakt</h1>
          
          <h2 style={{ color: '#0f7ba8', marginTop: '2rem' }}>Zainteresowany współpracą?</h2>
          <p style={{ lineHeight: '1.8', color: '#555', marginBottom: '2rem' }}>
            Skontaktuj się z nami w poniższe sposoby:
          </p>

          <div style={{ background: '#e0f7ff', padding: '2rem', borderRadius: '12px', marginBottom: '2rem' }}>
            <p style={{ marginBottom: '1rem' }}><strong>📧 Email:</strong> hello@szpiczek.pl</p>
            <p style={{ marginBottom: '1rem' }}><strong>📱 WhatsApp:</strong> +48 123 456 789</p>
            <p style={{ marginBottom: '0' }}><strong>📞 Telefon:</strong> +48 12 345 67 89</p>
          </div>

          <h2 style={{ color: '#0f7ba8', marginTop: '2rem' }}>Godziny dostępności</h2>
          <p style={{ lineHeight: '1.8', color: '#555' }}>
            Poniedziałek - Piątek: 8:00 - 18:00<br/>
            Sobota: 9:00 - 14:00<br/>
            Niedziela: Zamknięte
          </p>
        </div>
      </main>

      <footer className="footer" style={{ textAlign: 'center', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <p className="footer-slogan" style={{ margin: '0 0 0.5rem 0' }}>Zaufaj nam, zadbaj o siebie. 💙</p>
        <p style={{ margin: 0, fontSize: '12px', color: '#0c4a6e', opacity: 0.7 }}>Built by MW</p>
      </footer>
    </div>
  );
}

function PartnersPage() {
  return (
    <div className="app">
      <main>
        <div className="container" style={{ padding: '3rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ color: '#0f7ba8', marginBottom: '2rem' }}>🤝 Partnerzy</h1>
          
          <h2 style={{ color: '#0f7ba8', marginTop: '2rem' }}>Sieci aptek</h2>
          <p style={{ lineHeight: '1.8', color: '#555', marginBottom: '2rem' }}>
            Współpracujemy z siecią aptek ACZ - liderem w opiece zdrowotnej na terenie Polski.
          </p>

          <div style={{ background: '#e0f7ff', padding: '2rem', borderRadius: '12px', marginBottom: '2rem' }}>
            <h3 style={{ color: '#0f7ba8', marginBottom: '1rem' }}>Chcesz dołączyć do naszych partnerów?</h3>
            <p style={{ color: '#555', marginBottom: '1rem' }}>
              Jeśli prowadzisz aptekę i zainteresowany Cię integracją z platformą Szpiczek, skontaktuj się z nami.
            </p>
            <a href="mailto:partners@szpiczek.pl" style={{ 
              background: 'linear-gradient(135deg, #0f7ba8 0%, #1a9fcf 100%)',
              color: 'white',
              padding: '0.7rem 1.5rem',
              borderRadius: '6px',
              textDecoration: 'none',
              display: 'inline-block',
              marginTop: '1rem'
            }}>
              Napisz do nas
            </a>
          </div>

          <h2 style={{ color: '#0f7ba8', marginTop: '2rem' }}>Dla firm</h2>
          <p style={{ lineHeight: '1.8', color: '#555', marginBottom: '2rem' }}>
            Oferujemy pakiety szczepień dla pracowników. Kontaktuj się, aby uzyskać wycenę dedykowaną dla Twojej organizacji.
          </p>
        </div>
      </main>

      <footer className="footer" style={{ textAlign: 'center', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <p className="footer-slogan" style={{ margin: '0 0 0.5rem 0' }}>Zaufaj nam, zadbaj o siebie. 💙</p>
        <p style={{ margin: 0, fontSize: '12px', color: '#0c4a6e', opacity: 0.7 }}>Built by MW</p>
      </footer>
    </div>
  );
}

function BlogPage() {
  const posts = [
    { title: 'Znaczenie szczepień w dorosłości', date: '2026-04-10' },
    { title: 'Jak dbać o zdrowie jesienią', date: '2026-03-15' },
    { title: '5 mitów o szczepieniach', date: '2026-02-20' }
  ];

  return (
    <div className="app">
      <main>
        <div className="container" style={{ padding: '3rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ color: '#0f7ba8', marginBottom: '2rem' }}>📰 Blog zdrowotny</h1>
          
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Artykuły i porady na temat zdrowia, szczepień i profilaktyki.
          </p>

          {posts.map((post, idx) => (
            <div key={idx} style={{ 
              background: 'white',
              border: '0.5px solid #ddd',
              padding: '1.5rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              cursor: 'pointer'
            }}>
              <h3 style={{ color: '#0f7ba8', marginBottom: '0.5rem' }}>📝 {post.title}</h3>
              <p style={{ color: '#999', fontSize: '14px' }}>📅 {new Date(post.date).toLocaleDateString('pl-PL')}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="footer" style={{ textAlign: 'center', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <p className="footer-slogan" style={{ margin: '0 0 0.5rem 0' }}>Zaufaj nam, zadbaj o siebie. 💙</p>
        <p style={{ margin: 0, fontSize: '12px', color: '#0c4a6e', opacity: 0.7 }}>Built by MW</p>
      </footer>
    </div>
  );
}
// PANEL APTEKI — 3 zakładki
// ============================================================
// ============================================================
// STRONA ANULOWANIA REZERWACJI
// ============================================================
function CancelPage() {
  const [booking, setBooking] = useState(null);
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const token = window.location.pathname.split('/cancel/')[1];

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Brak tokenu anulacji');
      return;
    }
    fetch(`${API_URL}/api/cancel/${token}`)
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          setStatus('error');
          setMessage(data.message || 'Błąd');
        } else {
          setBooking(data);
          setStatus('ready');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Błąd połączenia');
      });
  }, [token]);

  const handleCancel = async () => {
    setStatus('cancelling');
    try {
      const res = await fetch(`${API_URL}/api/cancel/${token}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setMessage(data.message || 'Błąd');
      } else {
        setStatus('cancelled');
      }
    } catch (e) {
      setStatus('error');
      setMessage('Błąd połączenia');
    }
  };

  return (
    <div className="app">
      <main>
        <div className="container" style={{ maxWidth: '600px', margin: '3rem auto', padding: '0 2rem' }}>
          <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            
            {status === 'loading' && (
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ color: '#0f7ba8' }}>Ładowanie...</h2>
              </div>
            )}

            {status === 'error' && (
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ color: '#ef4444' }}>❌ Błąd</h2>
                <p style={{ color: '#666', marginTop: '1rem' }}>{message}</p>
                <a href="/" style={{ display: 'inline-block', marginTop: '2rem', background: '#0f7ba8', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '6px', textDecoration: 'none' }}>Strona główna</a>
              </div>
            )}

            {status === 'ready' && booking && (
              <>
                <h1 style={{ color: '#0f7ba8', textAlign: 'center', marginBottom: '2rem' }}>❌ Anuluj rezerwację</h1>
                <p style={{ color: '#666', textAlign: 'center', marginBottom: '2rem' }}>Czy na pewno chcesz anulować poniższą rezerwację?</p>

                <div style={{ background: '#e0f7ff', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
                  <p style={{ marginBottom: '0.5rem' }}><strong>Pacjent:</strong> {booking.firstName} {booking.lastName}</p>
                  <p style={{ marginBottom: '0.5rem' }}><strong>Usługa:</strong> {booking.service}</p>
                  {booking.vaccine && <p style={{ marginBottom: '0.5rem' }}><strong>Szczepienie:</strong> {booking.vaccine}</p>}
                  {booking.exam && <p style={{ marginBottom: '0.5rem' }}><strong>Badanie:</strong> {booking.exam}</p>}
                  {booking.test && <p style={{ marginBottom: '0.5rem' }}><strong>Test:</strong> {booking.test}</p>}
                  <p style={{ marginBottom: '0.5rem' }}><strong>Apteka:</strong> {booking.pharmacy}</p>
                  <p style={{ marginBottom: '0' }}><strong>Data:</strong> {new Date(booking.date).toLocaleDateString('pl-PL')} o {booking.time}</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={handleCancel} style={{ flex: 1, padding: '0.8rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }}>
                    Tak, anuluj
                  </button>
                  <a href="/" style={{ flex: 1, padding: '0.8rem', background: '#f0f0f0', color: '#333', border: 'none', borderRadius: '6px', textDecoration: 'none', textAlign: 'center', fontWeight: '600', fontSize: '15px' }}>
                    Nie, wróć
                  </a>
                </div>
              </>
            )}

            {status === 'cancelling' && (
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ color: '#0f7ba8' }}>Anulowanie...</h2>
              </div>
            )}

            {status === 'cancelled' && (
              <div style={{ textAlign: 'center' }}>
                <h1 style={{ color: '#10b981', marginBottom: '1rem' }}>✅ Anulowane</h1>
                <p style={{ color: '#666', marginBottom: '2rem' }}>Twoja rezerwacja została anulowana. Slot zwolniony dla innych pacjentów.</p>
                <a href="/" style={{ display: 'inline-block', background: '#0f7ba8', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '6px', textDecoration: 'none' }}>Strona główna</a>
              </div>
            )}

          </div>
        </div>
      </main>
      <footer className="footer" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
        <p className="footer-slogan">Zaufaj nam, zadbaj o siebie. 💙</p>
        <p style={{ fontSize: '12px', color: '#0c4a6e', opacity: 0.7 }}>Built by MW</p>
      </footer>
    </div>
  );
}
// ============================================================
// STRONA LOGOWANIA PACJENTA
// ============================================================
function PatientLoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      setError('Wypełnij wszystkie pola');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/patient/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Błąd');
        return;
      }
      localStorage.setItem('patientToken', data.token);
      localStorage.setItem('patientData', JSON.stringify(data.patient));
      navigate('/my-account');
      window.location.reload();
    } catch (e) {
      setError('Błąd połączenia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app"><main>
      <div className="container" style={{ maxWidth: '450px', margin: '3rem auto', padding: '0 2rem' }}>
        <div style={{ background: 'white', padding: '2.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <h1 style={{ color: '#0f7ba8', textAlign: 'center', marginBottom: '0.5rem' }}>Zaloguj się</h1>
          <p style={{ color: '#666', textAlign: 'center', marginBottom: '2rem', fontSize: '14px' }}>Zarządzaj rezerwacjami w swoim koncie</p>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '14px', fontWeight: '600' }}>Email</label>
            <input type="email" value={formData.email} onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setError(''); }}
              placeholder="email@example.com" style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '14px', fontWeight: '600' }}>Hasło</label>
            <input type="password" value={formData.password} onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setError(''); }}
              placeholder="Twoje hasło" style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          </div>

          {error && <div style={{ background: '#fee', border: '1px solid #fcc', color: '#c33', padding: '0.7rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '14px' }}>❌ {error}</div>}

          <button onClick={handleLogin} disabled={loading}
            style={{ width: '100%', padding: '0.8rem', background: loading ? '#ccc' : 'linear-gradient(135deg, #0f7ba8, #1a9fcf)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>

          <p style={{ textAlign: 'center', color: '#666', marginTop: '1.5rem', fontSize: '14px' }}>
            Nie masz konta? <a href="/register" style={{ color: '#0f7ba8', fontWeight: '600' }}>Zarejestruj się</a>
          </p>
        </div>
      </div>
    </main>
    <footer className="footer" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
      <p className="footer-slogan">Zaufaj nam, zadbaj o siebie. 💙</p>
      <p style={{ fontSize: '12px', color: '#0c4a6e', opacity: 0.7 }}>Built by MW</p>
    </footer></div>
  );
}

// ============================================================
// STRONA REJESTRACJI PACJENTA
// ============================================================
function PatientRegisterPage() {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password) {
      setError('Wypełnij wszystkie pola');
      return;
    }
    if (formData.password.length < 6) {
      setError('Hasło musi mieć min. 6 znaków');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/patient/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Błąd');
        return;
      }
      localStorage.setItem('patientToken', data.token);
      localStorage.setItem('patientData', JSON.stringify(data.patient));
      navigate('/my-account');
      window.location.reload();
    } catch (e) {
      setError('Błąd połączenia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app"><main>
      <div className="container" style={{ maxWidth: '500px', margin: '3rem auto', padding: '0 2rem' }}>
        <div style={{ background: 'white', padding: '2.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <h1 style={{ color: '#0f7ba8', textAlign: 'center', marginBottom: '0.5rem' }}>Utwórz konto</h1>
          <p style={{ color: '#666', textAlign: 'center', marginBottom: '2rem', fontSize: '14px' }}>Rezerwuj szybciej i zarządzaj wizytami</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '14px', fontWeight: '600' }}>Imię</label>
              <input value={formData.firstName} onChange={(e) => { setFormData({ ...formData, firstName: e.target.value }); setError(''); }}
                style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '14px', fontWeight: '600' }}>Nazwisko</label>
              <input value={formData.lastName} onChange={(e) => { setFormData({ ...formData, lastName: e.target.value }); setError(''); }}
                style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '14px', fontWeight: '600' }}>Email</label>
            <input type="email" value={formData.email} onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setError(''); }}
              placeholder="email@example.com" style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '14px', fontWeight: '600' }}>Telefon</label>
            <input value={formData.phone} onChange={(e) => { setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') }); setError(''); }}
              placeholder="min. 9 cyfr" style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '14px', fontWeight: '600' }}>Hasło</label>
            <input type="password" value={formData.password} onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setError(''); }}
              placeholder="min. 6 znaków" style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          </div>

          {error && <div style={{ background: '#fee', border: '1px solid #fcc', color: '#c33', padding: '0.7rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '14px' }}>❌ {error}</div>}

          <button onClick={handleRegister} disabled={loading}
            style={{ width: '100%', padding: '0.8rem', background: loading ? '#ccc' : 'linear-gradient(135deg, #0f7ba8, #1a9fcf)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Tworzenie...' : 'Utwórz konto'}
          </button>

          <p style={{ textAlign: 'center', color: '#666', marginTop: '1.5rem', fontSize: '14px' }}>
            Masz już konto? <a href="/login" style={{ color: '#0f7ba8', fontWeight: '600' }}>Zaloguj się</a>
          </p>
        </div>
      </div>
    </main>
    <footer className="footer" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
      <p className="footer-slogan">Zaufaj nam, zadbaj o siebie. 💙</p>
      <p style={{ fontSize: '12px', color: '#0c4a6e', opacity: 0.7 }}>Built by MW</p>
    </footer></div>
  );
}

// ============================================================
// STRONA "MOJE KONTO"
// ============================================================
function MyAccountPage() {
  const [patient, setPatient] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('patientToken');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    
    Promise.all([
      fetch(`${API_URL}/api/patient/me`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_URL}/api/patient/bookings`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
    ]).then(([p, b]) => {
      setPatient(p);
      setBookings(b);
      setLoading(false);
    }).catch(() => {
      localStorage.removeItem('patientToken');
      navigate('/login');
    });
  }, []);

  const handleCancel = async (id) => {
    if (!confirm('Na pewno chcesz anulować tę rezerwację?')) return;
    try {
      const res = await fetch(`${API_URL}/api/patient/cancel/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const refreshed = await fetch(`${API_URL}/api/patient/bookings`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json());
        setBookings(refreshed);
      }
    } catch (e) {
      alert('Błąd anulowania');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('patientToken');
    localStorage.removeItem('patientData');
    navigate('/');
    window.location.reload();
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '5rem' }}>Ładowanie...</div>;

  const upcoming = bookings.filter(b => b.status !== 'cancelled' && new Date(b.date) >= new Date(new Date().toDateString()));
  const past = bookings.filter(b => b.status === 'cancelled' || new Date(b.date) < new Date(new Date().toDateString()));

  return (
    <div className="app"><main>
      <div className="container" style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 2rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ color: '#0f7ba8', margin: 0 }}>Witaj, {patient.firstName}! 👋</h1>
            <p style={{ color: '#666', marginTop: '0.5rem' }}>{patient.email}</p>
          </div>
          <button onClick={handleLogout} style={{ padding: '0.6rem 1.2rem', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}>Wyloguj się</button>
        </div>

        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: '#0f7ba8', marginTop: 0, fontSize: '1.3rem' }}>📅 Nadchodzące wizyty ({upcoming.length})</h2>
          {upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
              Brak nadchodzących wizyt.<br/>
              <a href="/" style={{ color: '#0f7ba8', fontWeight: '600', marginTop: '1rem', display: 'inline-block' }}>Zarezerwuj wizytę →</a>
            </div>
          ) : (
            upcoming.map(b => (
              <div key={b.id} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1rem', marginBottom: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#0f7ba8', marginBottom: '0.3rem' }}>
                    {b.service}{b.vaccine && ` · ${b.vaccine}`}{b.exam && ` · ${b.exam}`}{b.test && ` · ${b.test}`}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    📍 ACZ {b.pharmacy} · {new Date(b.date).toLocaleDateString('pl-PL')} o {b.time}
                  </div>
                </div>
                <button onClick={() => handleCancel(b.id)} style={{ padding: '0.5rem 1rem', background: '#fee', color: '#c33', border: '1px solid #fcc', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Anuluj</button>
              </div>
            ))
          )}
        </div>

        {past.length > 0 && (
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h2 style={{ color: '#999', marginTop: 0, fontSize: '1.3rem' }}>📜 Historia ({past.length})</h2>
            {past.map(b => (
              <div key={b.id} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1rem', marginBottom: '0.8rem', opacity: 0.7 }}>
                <div style={{ fontWeight: '600', color: '#666', marginBottom: '0.3rem' }}>
                  {b.service}{b.vaccine && ` · ${b.vaccine}`}
                  {b.status === 'cancelled' && <span style={{ background: '#fee', color: '#c33', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '11px', marginLeft: '0.5rem' }}>ANULOWANE</span>}
                </div>
                <div style={{ fontSize: '14px', color: '#999' }}>
                  ACZ {b.pharmacy} · {new Date(b.date).toLocaleDateString('pl-PL')} o {b.time}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
    <footer className="footer" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
      <p className="footer-slogan">Zaufaj nam, zadbaj o siebie. 💙</p>
      <p style={{ fontSize: '12px', color: '#0c4a6e', opacity: 0.7 }}>Built by MW</p>
    </footer></div>
  );
}
function PharmacyLoginPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);
  const [pharmacyName, setPharmacyName] = useState(null);
  const [loginForm, setLoginForm] = useState({ pharmacy: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!loginForm.pharmacy || !loginForm.password) {
      setLoginError('Wpisz nazwę apteki i hasło');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/pharmacy/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      if (!response.ok) {
        const err = await response.json();
        setLoginError(err.message || 'Błąd logowania');
        return;
      }
      const data = await response.json();
      setToken(data.token);
      setPharmacyName(data.pharmacy);
      setIsLoggedIn(true);
    } catch (error) {
      setLoginError('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setToken(null);
    setPharmacyName(null);
    setLoginForm({ pharmacy: '', password: '' });
  };

  if (!isLoggedIn) {
    return (
      <div className="app"><main>
        <div className="container" style={{ maxWidth: '500px', margin: '5rem auto' }}>
          <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <h1 style={{ textAlign: 'center', color: '#0f7ba8', marginBottom: '2rem' }}>📋 Panel Apteki</h1>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Apteka</label>
              <select value={loginForm.pharmacy} onChange={(e) => { setLoginForm({ ...loginForm, pharmacy: e.target.value }); setLoginError(''); }}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }}>
                <option value="">Wybierz aptekę</option>
                <option value="Myślibórz">Myślibórz</option>
                <option value="Świnoujście">Świnoujście</option>
                <option value="Szczecin (Gierczak)">Szczecin (Gierczak)</option>
                <option value="Szczecin (Nałkowska)">Szczecin (Nałkowska)</option>
                <option value="Police">Police</option>
              </select>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Hasło</label>
              <input type="password" placeholder="Wpisz hasło" value={loginForm.password}
                onChange={(e) => { setLoginForm({ ...loginForm, password: e.target.value }); setLoginError(''); }}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
            </div>
            {loginError && <div style={{ background: '#fee', border: '1px solid #fcc', color: '#c33', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' }}>❌ {loginError}</div>}
            <button onClick={handleLogin} disabled={loading}
              style={{ width: '100%', padding: '0.8rem', background: loading ? '#ccc' : 'linear-gradient(135deg, #0f7ba8, #1a9fcf)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Logowanie...' : 'Zaloguj się'}
            </button>
            <p style={{ textAlign: 'center', color: '#999', fontSize: '12px', marginTop: '2rem' }}>Hasło testowe: <strong>password123</strong></p>
          </div>
        </div>
      </main>
      <footer className="footer" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
        <p className="footer-slogan">Zaufaj nam, zadbaj o siebie. 💙</p>
        <p style={{ fontSize: '12px', color: '#0c4a6e', opacity: 0.7 }}>Built by MW</p>
      </footer></div>
    );
  }

  return <PharmacyDashboard token={token} pharmacyName={pharmacyName} onLogout={handleLogout} />;
}

// ============================================================
// DASHBOARD APTEKI (3 ZAKŁADKI)
// ============================================================
function PharmacyDashboard({ token, pharmacyName, onLogout }) {
  const [activeTab, setActiveTab] = useState('calendar');

  return (
    <div className="app"><main>
      <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ color: '#0f7ba8', margin: 0 }}>📋 Panel Apteki: {pharmacyName}</h1>
          </div>
          <button onClick={onLogout} style={{ padding: '0.6rem 1.2rem', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}>Wyloguj się</button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid #ddd' }}>
          {[
            { id: 'calendar', label: '📅 Kalendarz' },
            { id: 'list', label: '📋 Lista rezerwacji' },
            { id: 'stats', label: '📊 Statystyki' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.8rem 1.5rem',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid #0f7ba8' : '3px solid transparent',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: activeTab === tab.id ? '600' : '400',
                color: activeTab === tab.id ? '#0f7ba8' : '#666'
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'calendar' && <CalendarTab token={token} pharmacyName={pharmacyName} />}
        {activeTab === 'list' && <ListTab token={token} pharmacyName={pharmacyName} />}
        {activeTab === 'stats' && <StatsTab token={token} pharmacyName={pharmacyName} />}
      </div>
    </main>
    <footer className="footer" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
      <p className="footer-slogan">Zaufaj nam, zadbaj o siebie. 💙</p>
      <p style={{ fontSize: '12px', color: '#0c4a6e', opacity: 0.7 }}>Built by MW</p>
    </footer></div>
  );
}

// ============================================================
// ZAKŁADKA 1: KALENDARZ
// ============================================================
function CalendarTab({ token, pharmacyName }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookings, setBookings] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBooking, setNewBooking] = useState({
    firstName: '', lastName: '', phone: '', service: 'Szczepienia', 
    vaccine: '', test: '', exam: '', medications: '', time: '', source: 'walk-in'
  });

  const timeSlots = Array.from({ length: 17 }, (_, i) => {
    const hour = 8 + Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour}:${minute}`;
  });

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/pharmacy/bookings/${selectedDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setBookings(data.bookings || []);
      setBlocked(data.blocked || []);
    } catch (error) {
      console.log('Błąd:', error);
    }
  };

  useEffect(() => { fetchData(); }, [selectedDate]);

  const handleAddBooking = async () => {
    if (!newBooking.firstName || !newBooking.lastName || !newBooking.phone || !newBooking.time) {
      alert('Wypełnij wszystkie wymagane pola');
      return;
    }
    try {
      await fetch(`${API_URL}/api/pharmacy/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...newBooking, date: selectedDate })
      });
      setShowAddForm(false);
      setNewBooking({ firstName: '', lastName: '', phone: '', service: 'Szczepienia', vaccine: '', test: '', exam: '', medications: '', time: '', source: 'walk-in' });
      fetchData();
    } catch (error) {
      alert('Błąd dodawania wizyty');
    }
  };

  const handleBlockSlot = async (time) => {
    const reason = prompt('Powód zablokowania (np. Przerwa, Urlop):');
    if (!reason) return;
    try {
      await fetch(`${API_URL}/api/pharmacy/block-slot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ date: selectedDate, time, reason })
      });
      fetchData();
    } catch (error) {
      alert('Błąd blokowania');
    }
  };

  const handleDeleteBooking = async (id) => {
    if (!confirm('Usunąć rezerwację?')) return;
    try {
      await fetch(`${API_URL}/api/pharmacy/booking/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      alert('Błąd usuwania');
    }
  };

  const handleUnblockSlot = async (id) => {
    try {
      await fetch(`${API_URL}/api/pharmacy/block-slot/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      alert('Błąd odblokowywania');
    }
  };

  const getSlotData = (time) => {
    const booking = bookings.find(b => b.time === time);
    if (booking) return { type: 'booking', data: booking };
    const block = blocked.find(b => b.time === time);
    if (block) return { type: 'blocked', data: block };
    return { type: 'free' };
  };

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const filledCount = bookings.length;
  const blockedCount = blocked.length;
  const freeCount = timeSlots.length - filledCount - blockedCount;

  return (
    <div>
      {/* Nawigacja daty */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={() => changeDate(-1)} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>‹</button>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ padding: '0.5rem', fontSize: '14px' }} />
          <button onClick={() => changeDate(1)} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>›</button>
          <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} style={{ padding: '0.5rem 1rem', cursor: 'pointer', marginLeft: '0.5rem' }}>Dzisiaj</button>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} style={{ padding: '0.7rem 1.5rem', background: '#0f7ba8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
          {showAddForm ? '× Anuluj' : '+ Dodaj wizytę'}
        </button>
      </div>

      {/* Formularz dodawania wizyty */}
      {showAddForm && (
        <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #ddd' }}>
          <h3 style={{ marginTop: 0 }}>Dodaj wizytę na {new Date(selectedDate).toLocaleDateString('pl-PL')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <input placeholder="Imię" value={newBooking.firstName} onChange={(e) => setNewBooking({ ...newBooking, firstName: e.target.value })} style={{ padding: '0.6rem' }} />
            <input placeholder="Nazwisko" value={newBooking.lastName} onChange={(e) => setNewBooking({ ...newBooking, lastName: e.target.value })} style={{ padding: '0.6rem' }} />
            <input placeholder="Telefon" value={newBooking.phone} onChange={(e) => setNewBooking({ ...newBooking, phone: e.target.value })} style={{ padding: '0.6rem' }} />
            <select value={newBooking.service} onChange={(e) => setNewBooking({ ...newBooking, service: e.target.value })} style={{ padding: '0.6rem' }}>
              <option>Szczepienia</option>
              <option>Przeglądy lekowe</option>
              <option>Badania diagnostyczne</option>
              <option>Testy diagnostyczne</option>
            </select>
            <select value={newBooking.time} onChange={(e) => setNewBooking({ ...newBooking, time: e.target.value })} style={{ padding: '0.6rem' }}>
              <option value="">Wybierz godzinę</option>
              {timeSlots.filter(t => {
                const slot = getSlotData(t);
                return slot.type === 'free';
              }).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={newBooking.source} onChange={(e) => setNewBooking({ ...newBooking, source: e.target.value })} style={{ padding: '0.6rem' }}>
              <option value="walk-in">Walk-in (w aptece)</option>
              <option value="phone">Telefon</option>
            </select>
          </div>
          <button onClick={handleAddBooking} style={{ marginTop: '1rem', padding: '0.7rem 1.5rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
            Dodaj wizytę
          </button>
        </div>
      )}

      {/* Layout główny */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 250px', gap: '1.5rem' }}>
        {/* Kalendarz */}
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '1rem' }}>
          {timeSlots.map(time => {
            const slot = getSlotData(time);
            return (
              <div key={time} style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <div style={{ color: '#666', fontWeight: '600' }}>{time}</div>
                {slot.type === 'booking' && (
                  <div style={{ 
                    background: slot.data.source === 'online' ? '#dbeafe' : '#d1fae5',
                    borderLeft: `4px solid ${slot.data.source === 'online' ? '#2563eb' : '#10b981'}`,
                    padding: '0.6rem 1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600' }}>{slot.data.firstName} {slot.data.lastName} — {slot.data.service}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {slot.data.source === 'online' ? '🌐 Online' : slot.data.source === 'phone' ? '📞 Telefon' : '🚶 Walk-in'} · tel. {slot.data.phone}
                        {slot.data.vaccine && ` · ${slot.data.vaccine}`}
                        {slot.data.exam && ` · ${slot.data.exam}`}
                        {slot.data.test && ` · ${slot.data.test}`}
                      </div>
                    </div>
                    <button onClick={() => handleDeleteBooking(slot.data.id)} style={{ padding: '0.3rem 0.6rem', background: '#fee', color: '#c33', border: '1px solid #fcc', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Usuń</button>
                  </div>
                )}
                {slot.type === 'blocked' && (
                  <div style={{ background: '#fef3c7', borderLeft: '4px solid #f59e0b', padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '600' }}>🚫 Zablokowane</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{slot.data.reason}</div>
                    </div>
                    <button onClick={() => handleUnblockSlot(slot.data.id)} style={{ padding: '0.3rem 0.6rem', background: '#fff', border: '1px solid #f59e0b', color: '#d97706', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Odblokuj</button>
                  </div>
                )}
                {slot.type === 'free' && (
                  <div style={{ padding: '0.6rem 1rem', color: '#999', fontStyle: 'italic', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Wolny slot</span>
                    <button onClick={() => handleBlockSlot(time)} style={{ padding: '0.3rem 0.6rem', background: 'white', border: '1px solid #ddd', color: '#666', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>🚫 Zablokuj</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar */}
        <div>
          <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ color: '#666', fontSize: '13px', marginBottom: '0.3rem' }}>Dzisiejsze wizyty</div>
            <div style={{ fontSize: '28px', fontWeight: '700' }}>{filledCount} / {timeSlots.length}</div>
            <div style={{ color: '#999', fontSize: '12px' }}>{freeCount} wolnych, {blockedCount} zablokowanych</div>
          </div>

          <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ fontWeight: '600', marginBottom: '0.8rem' }}>Legenda</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ width: '14px', height: '14px', background: '#dbeafe', borderLeft: '3px solid #2563eb' }}></div>
              <span style={{ fontSize: '13px' }}>Rezerwacja online</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ width: '14px', height: '14px', background: '#d1fae5', borderLeft: '3px solid #10b981' }}></div>
              <span style={{ fontSize: '13px' }}>Walk-in / Telefon</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ width: '14px', height: '14px', background: '#fef3c7', borderLeft: '3px solid #f59e0b' }}></div>
              <span style={{ fontSize: '13px' }}>Zablokowany</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '14px', height: '14px', background: 'white', border: '1px solid #ddd' }}></div>
              <span style={{ fontSize: '13px' }}>Wolny slot</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ZAKŁADKA 2: LISTA REZERWACJI
// ============================================================
function ListTab({ token, pharmacyName }) {
  const [bookings, setBookings] = useState([]);
  const [dateFilter, setDateFilter] = useState('today');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchBookings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/pharmacy/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.log('Błąd:', error);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const getFilteredBookings = () => {
    let filtered = [...bookings];
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (dateFilter === 'today') filtered = filtered.filter(b => b.date === today);
    else if (dateFilter === 'tomorrow') filtered = filtered.filter(b => b.date === tomorrowStr);
    else if (dateFilter === 'week') {
      const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
      filtered = filtered.filter(b => b.date >= today && b.date <= weekEnd.toISOString().split('T')[0]);
    }
    else if (dateFilter === 'custom') filtered = filtered.filter(b => b.date === customDate);

    if (statusFilter !== 'all') filtered = filtered.filter(b => b.status === statusFilter);

    return filtered.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });
  };

  const filteredBookings = getFilteredBookings();

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Data', 'Godzina', 'Imię', 'Nazwisko', 'Telefon', 'Email', 'Usługa', 'Szczegóły', 'Status', 'Źródło'];
    const rows = filteredBookings.map(b => [
      b.date, b.time, b.firstName, b.lastName, b.phone, b.email,
      b.service, b.vaccine || b.exam || b.test || b.medications || '-',
      b.status, b.source
    ]);
    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rezerwacje-${pharmacyName}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ padding: '0.6rem' }}>
            <option value="today">Dzisiaj</option>
            <option value="tomorrow">Jutro</option>
            <option value="week">Cały tydzień</option>
            <option value="all">Wszystkie</option>
            <option value="custom">Wybrana data...</option>
          </select>
          {dateFilter === 'custom' && (
            <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} style={{ padding: '0.6rem' }} />
          )}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '0.6rem' }}>
            <option value="all">Wszystkie statusy</option>
            <option value="pending">Oczekujące</option>
            <option value="confirmed">Potwierdzone</option>
            <option value="cancelled">Anulowane</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleExportCSV} style={{ padding: '0.6rem 1.2rem', background: 'white', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}>📥 Eksport CSV</button>
          <button onClick={handlePrint} style={{ padding: '0.6rem 1.2rem', background: '#0f7ba8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>🖨️ Drukuj listę</button>
        </div>
      </div>

      <div className="print-area" style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem' }}>
        <div style={{ borderBottom: '1px solid #ddd', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: '0 0 0.3rem 0' }}>Lista wizyt — {dateFilter === 'today' ? 'Dzisiaj' : dateFilter === 'tomorrow' ? 'Jutro' : dateFilter === 'week' ? 'Ten tydzień' : dateFilter === 'custom' ? new Date(customDate).toLocaleDateString('pl-PL') : 'Wszystkie'}</h2>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Apteka ACZ {pharmacyName}</p>
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>Łącznie: {filteredBookings.length} wizyt</div>
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>📭 Brak rezerwacji</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th style={{ textAlign: 'left', padding: '0.7rem' }}>Data</th>
                  <th style={{ textAlign: 'left', padding: '0.7rem' }}>Godz.</th>
                  <th style={{ textAlign: 'left', padding: '0.7rem' }}>Pacjent</th>
                  <th style={{ textAlign: 'left', padding: '0.7rem' }}>Telefon</th>
                  <th style={{ textAlign: 'left', padding: '0.7rem' }}>Usługa</th>
                  <th style={{ textAlign: 'left', padding: '0.7rem' }}>Szczegóły</th>
                  <th style={{ textAlign: 'left', padding: '0.7rem' }}>Źródło</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.7rem' }}>{new Date(b.date).toLocaleDateString('pl-PL')}</td>
                    <td style={{ padding: '0.7rem', fontWeight: '600' }}>{b.time}</td>
                    <td style={{ padding: '0.7rem' }}>{b.firstName} {b.lastName}</td>
                    <td style={{ padding: '0.7rem', color: '#0f7ba8' }}>{b.phone}</td>
                    <td style={{ padding: '0.7rem' }}>{b.service}</td>
                    <td style={{ padding: '0.7rem', color: '#666' }}>{b.vaccine || b.exam || b.test || b.medications || '-'}</td>
                    <td style={{ padding: '0.7rem' }}>
                      <span style={{ 
                        fontSize: '12px', padding: '0.2rem 0.6rem', borderRadius: '4px',
                        background: b.source === 'online' ? '#dbeafe' : '#d1fae5',
                        color: b.source === 'online' ? '#1e40af' : '#065f46'
                      }}>
                        {b.source === 'online' ? 'Online' : b.source === 'phone' ? 'Telefon' : 'Walk-in'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ borderTop: '1px solid #ddd', paddingTop: '1rem', marginTop: '1rem', fontSize: '12px', color: '#999', textAlign: 'center' }}>
          Wydrukowano z Szpiczek.pl · {new Date().toLocaleString('pl-PL')}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ZAKŁADKA 3: STATYSTYKI
// ============================================================
function StatsTab({ token, pharmacyName }) {
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState('month');

  const fetchStats = async () => {
    try {
      const { from, to } = getDateRange();
      const url = `${API_URL}/api/pharmacy/stats?from=${from}&to=${to}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.log('Błąd:', error);
    }
  };

  const getDateRange = () => {
    const today = new Date();
    const to = today.toISOString().split('T')[0];
    let from;
    if (period === 'month') {
      from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    } else if (period === '30days') {
      const d = new Date(today); d.setDate(d.getDate() - 30);
      from = d.toISOString().split('T')[0];
    } else if (period === 'year') {
      from = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
    } else {
      from = '2020-01-01';
    }
    return { from, to };
  };

  useEffect(() => { fetchStats(); }, [period]);

  if (!stats) return <div style={{ textAlign: 'center', padding: '3rem' }}>Ładowanie statystyk...</div>;

  const fillRate = stats.total > 0 ? Math.round((stats.total / 200) * 100) : 0;

  const maxHours = Math.max(...(stats.hours.map(h => h.count) || [1]));
  const maxVaccines = Math.max(...(stats.vaccines.map(v => v.count) || [1]));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ padding: '0.6rem' }}>
          <option value="month">Ten miesiąc</option>
          <option value="30days">Ostatnie 30 dni</option>
          <option value="year">Ten rok</option>
          <option value="all">Wszystkie</option>
        </select>
      </div>

      {/* Górne liczniki */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '1.2rem' }}>
          <div style={{ color: '#666', fontSize: '13px' }}>Łącznie wizyt</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f7ba8' }}>{stats.total}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '1.2rem' }}>
          <div style={{ color: '#666', fontSize: '13px' }}>Potwierdzone</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>{stats.confirmed}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '1.2rem' }}>
          <div style={{ color: '#666', fontSize: '13px' }}>Oczekujące</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#f59e0b' }}>{stats.pending}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '1.2rem' }}>
          <div style={{ color: '#666', fontSize: '13px' }}>Anulowane</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#ef4444' }}>{stats.cancelled}</div>
        </div>
      </div>

      {/* Typy usług */}
      <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>Typy usług</h3>
        {stats.services.length === 0 ? <p style={{ color: '#999' }}>Brak danych</p> :
          stats.services.map(s => {
            const pct = stats.total > 0 ? Math.round((s.count / stats.total) * 100) : 0;
            return (
              <div key={s.service} style={{ marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span>{s.service}</span>
                  <span style={{ fontWeight: '600' }}>{s.count} ({pct}%)</span>
                </div>
                <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '12px' }}>
                  <div style={{ background: '#0f7ba8', width: `${pct}%`, height: '100%', borderRadius: '4px' }}></div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Top szczepienia */}
      <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>Top 5 szczepień</h3>
        {stats.vaccines.length === 0 ? <p style={{ color: '#999' }}>Brak danych</p> :
          stats.vaccines.map(v => {
            const pct = Math.round((v.count / maxVaccines) * 100);
            return (
              <div key={v.vaccine} style={{ marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span>{v.vaccine}</span>
                  <span style={{ fontWeight: '600' }}>{v.count}</span>
                </div>
                <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '12px' }}>
                  <div style={{ background: '#0f7ba8', width: `${pct}%`, height: '100%', borderRadius: '4px' }}></div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Popularne godziny */}
      <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>Najpopularniejsze godziny</h3>
        {stats.hours.length === 0 ? <p style={{ color: '#999' }}>Brak danych</p> :
          <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'flex-end', height: '120px', marginTop: '1rem' }}>
            {stats.hours.map(h => {
              const height = Math.round((h.count / maxHours) * 100);
              return (
                <div key={h.time} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ background: '#10b981', width: '100%', height: `${height}%`, minHeight: '4px', borderRadius: '4px 4px 0 0' }}></div>
                  <div style={{ fontSize: '11px', marginTop: '0.3rem', color: '#666' }}>{h.time}</div>
                </div>
              );
            })}
          </div>}
      </div>

      {/* Źródło wizyt */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {stats.sources.map(s => {
          const pct = stats.total > 0 ? Math.round((s.count / stats.total) * 100) : 0;
          return (
            <div key={s.source} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '1.2rem' }}>
              <div style={{ color: '#666', fontSize: '13px' }}>Źródło: {s.source === 'online' ? 'Online 🌐' : s.source === 'phone' ? 'Telefon 📞' : 'Walk-in 🚶'}</div>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>{s.count}</div>
              <div style={{ color: '#999', fontSize: '12px' }}>{pct}% wszystkich</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// GŁÓWNA APLIKACJA Z ROUTINGIEM
// ============================================================
export default function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

function AppWrapper() {
  const navigate = useNavigate();

    return (
    <>
      {/* GRADIENT BLOBS + NOISE */}
      <div className="bg-blobs" aria-hidden="true">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="blob blob-4"></div>
      </div>
      <svg className="noise-overlay" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"></feTurbulence>
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)"></rect>
      </svg>

      <div className="floating-nav-wrapper">
        <nav className="floating-nav">
          <button onClick={() => navigate('/')} className="nav-pill active">🏠 Home</button>
          <button onClick={() => navigate('/about')} className="nav-pill">📖 O nas</button>
          <button onClick={() => navigate('/faq')} className="nav-pill">❓ FAQ</button>
          <button onClick={() => navigate('/contact')} className="nav-pill">📧 Kontakt</button>
          <button onClick={() => navigate('/partners')} className="nav-pill">🤝 Partnerzy</button>
          <button onClick={() => navigate('/blog')} className="nav-pill">📰 Blog</button>
          
          <div className="nav-divider"></div>
          
          {localStorage.getItem('patientToken') ? (
            <button onClick={() => navigate('/my-account')} className="nav-pill accent">👤 Moje konto</button>
          ) : (
            <button onClick={() => navigate('/login')} className="nav-pill accent">🔑 Zaloguj</button>
          )}
          <button onClick={() => navigate('/pharmacy-login')} className="nav-pill accent primary">📋 Panel Apteki</button>
        </nav>
      </div>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/partners" element={<PartnersPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/pharmacy-login" element={<PharmacyLoginPage />} />
        <Route path="/cancel/:token" element={<CancelPage />} />
        <Route path="/login" element={<PatientLoginPage />} />
        <Route path="/register" element={<PatientRegisterPage />} />
        <Route path="/my-account" element={<MyAccountPage />} />
      </Routes>
    </>
  );
}

function navBtn(active = false) {
  return {
    color: 'white', fontSize: '13px', padding: '0.5rem 1rem', borderRadius: '20px',
    fontWeight: active ? '700' : '600',
    background: active ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)',
    border: `1px solid rgba(255,255,255,${active ? '0.5' : '0.3'})`,
    whiteSpace: 'nowrap', cursor: 'pointer', transition: '0.3s'
  };
}