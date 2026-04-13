import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';

// Strona główna (rezerwacje pacjentów)
function HomePage() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedService, setSelectedService] = useState(null);
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [booking, setBooking] = useState(null);
  const [bookings, setBookings] = useState(() => {
    const saved = localStorage.getItem('szpiczekBookings');
    return saved ? JSON.parse(saved) : [];
  });
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState({ num1: 0, num2: 0, answer: 0 });
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    medications: ''
  });

  const navigate = useNavigate();

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

  const timeSlots = Array.from({ length: 17 }, (_, i) => {
    const hour = 8 + Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour}:${minute}`;
  });

  const serviceNames = {
    'szczepienia': 'Szczepienia',
    'przeglądy': 'Przeglądy lekowe',
    'cisnienie': 'Pomiar ciśnienia',
    'glukoza': 'Pomiar cukru'
  };

  const slogans = {
    'vaccines-grid': '🛡️ Jeden wybór, pełna ochrona - która szczepionka dla Ciebie?',
    'pharmacies-szczepienia': '⏱️ Zbliżasz się - teraz tylko wybierz aptekę i umów się',
    'pharmacies-przeglądy': '💊 Wybierz aptekę - farmaceuta przejrzy Twoje leki',
    'pharmacies-cisnienie': '❤️ Wybierz aptekę - zmierzymy Ci ciśnienie',
    'pharmacies-glukoza': '🩹 Wybierz aptekę - sprawdzimy Twój poziom glukozy',
    'booking': '✍️ Ostatnie 2 minuty - wpisz dane i masz terminu!',
    'confirmation': '🎊 Zrobiłeś to! Teraz możesz żyć bez obaw'
  };

  const getMinDate = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const today = new Date();
    return new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
  };

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const answer = num1 + num2;
    setCaptchaQuestion({ num1, num2, answer });
    setCaptchaAnswer('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const validateEmail = (email) => {
    return email.includes('@') && email.includes('.');
  };

  const validatePhone = (phone) => {
    const onlyDigits = phone.replace(/\D/g, '');
    return onlyDigits.length >= 9;
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.firstName.trim()) errors.firstName = 'Imię jest wymagane';
    if (!formData.lastName.trim()) errors.lastName = 'Nazwisko jest wymagane';
    if (!validateEmail(formData.email)) errors.email = 'Email musi zawierać @';
    if (!validatePhone(formData.phone) && formData.phone) errors.phone = 'Telefon musi mieć min. 9 cyfr';
    if (!selectedDate) errors.date = 'Wybierz datę';
    if (!selectedTime) errors.time = 'Wybierz godzinę';
    if (captchaAnswer !== captchaQuestion.answer.toString()) errors.captcha = 'Odpowiedź na pytanie jest błędna';
    if (selectedService === 'przeglądy' && !formData.medications.trim()) errors.medications = 'Wpisz listę leków';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleServiceClick = (service) => {
    setSelectedService(service);
    if (service === 'szczepienia') {
      setCurrentPage('vaccines-grid');
    } else if (service === 'przeglądy' || service === 'cisnienie' || service === 'glukoza') {
      setCurrentPage('pharmacies');
    }
  };

  const handleVaccineSelect = (vaccine) => {
    setSelectedVaccine(vaccine);
    setCurrentPage('pharmacies');
  };

  const handlePharmacySelect = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setCurrentPage('booking');
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      const onlyDigits = value.replace(/\D/g, '');
      setFormData({ ...formData, [name]: onlyDigits });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleConfirmBooking = () => {
    if (!validateForm()) {
      return;
    }

    const isValid = formData.firstName && formData.lastName && validateEmail(formData.email) && selectedDate && selectedTime;
    
    if (selectedService === 'przeglądy') {
      if (isValid && formData.medications && captchaAnswer === captchaQuestion.answer.toString()) {
        createBooking('Przeglądy lekowe', formData.medications);
      }
    } else {
      if (isValid && captchaAnswer === captchaQuestion.answer.toString()) {
        createBooking(serviceNames[selectedService], null);
      }
    }
  };

  const createBooking = (serviceName, medications) => {
    const newBooking = {
      id: Date.now(),
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      pharmacy: selectedPharmacy.city,
      service: serviceName,
      vaccine: selectedVaccine || null,
      medications: medications || null,
      date: selectedDate,
      time: selectedTime
    };

    const updatedBookings = [...bookings, newBooking];
    setBookings(updatedBookings);
    localStorage.setItem('szpiczekBookings', JSON.stringify(updatedBookings));
    
    setBooking(newBooking);
    setFormData({ firstName: '', lastName: '', email: '', phone: '', medications: '' });
    setSelectedTime(null);
    setSelectedDate(null);
    setCurrentPage('confirmation');
  };

  const handleBackHome = () => {
    setCurrentPage('home');
    setSelectedService(null);
    setSelectedPharmacy(null);
    setSelectedVaccine(null);
    setSelectedTime(null);
    setSelectedDate(null);
    setFormErrors({});
  };

  const renderHeader = (showSlogan = false, slogan = '') => {
    if (!showSlogan) {
      return null;
    }
    return (
      <div className="header">
        <div className="container">
          <button className="btn-back" onClick={handleBackHome}>← Wróć</button>
          <div className="header-center">
            <div className="header-slogan">{slogan}</div>
          </div>
          <div style={{ width: '60px' }}></div>
        </div>
      </div>
    );
  };

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
                <div className="service-icon">💉</div>
                <h3>Szczepienia</h3>
                <p>Szczepienia dostępne w aptece</p>
                <button className="btn-service">Zarezerwuj</button>
              </div>

              <div className="service-card" onClick={() => handleServiceClick('przeglądy')}>
                <div className="service-icon">🩺</div>
                <h3>Przeglądy lekowe</h3>
                <p>Zapytaj farmaceute o swoje leki</p>
                <button className="btn-service">Zarezerwuj</button>
              </div>

              <div className="service-card" onClick={() => handleServiceClick('cisnienie')}>
                <div className="service-icon">❤️</div>
                <h3>Pomiar ciśnienia</h3>
                <p>Badanie serca i pomiaru tętna</p>
                <button className="btn-service">Zarezerwuj</button>
              </div>

              <div className="service-card" onClick={() => handleServiceClick('glukoza')}>
                <div className="service-icon">🩹</div>
                <h3>Pomiar cukru</h3>
                <p>Bezpłatne badanie poziomu glukozy</p>
                <button className="btn-service">Zarezerwuj</button>
              </div>
            </div>
          </div>
        </main>

        <button 
          onClick={() => navigate('/pharmacy-login')}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            width: '50px',
            height: '50px',
            borderRadius: '8px',
            background: '#0f7ba8',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '0.5rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 999
          }}
        >
          Panel<br/>Apteki
        </button>

        <footer className="footer">
          <p>Szpiczek.pl — Zaufaj nam, zadbaj o siebie. Szczepienia w aptece. 💙</p>
        </footer>
      </div>
    );
  }

  if (currentPage === 'vaccines-grid') {
    return (
      <div className="app">
        {renderHeader(true, slogans['vaccines-grid'])}

        <main>
          <div className="container">
            <h2 style={{ textAlign: 'center', marginBottom: '2.5rem', color: '#0f7ba8', fontSize: '1.8rem', fontWeight: '700' }}>Wybierz szczepienie</h2>
            <div className="vaccines-grid">
              {vaccines.map(vaccine => (
                <div key={vaccine} className="vaccine-card" onClick={() => handleVaccineSelect(vaccine)}>
                  <div className="vaccine-card-icon">💉</div>
                  <h3>{vaccine}</h3>
                  <button className="btn-service">Wybierz</button>
                </div>
              ))}
            </div>
          </div>
        </main>

        <footer className="footer">
          <p>Szpiczek.pl — Zaufaj nam, zadbaj o siebie. Szczepienia w aptece. 💙</p>
        </footer>
      </div>
    );
  }

  if (currentPage === 'pharmacies') {
    const sloganKey = `pharmacies-${selectedService}`;
    
    return (
      <div className="app">
        {renderHeader(true, slogans[sloganKey])}

        <main>
          <div className="container">
            {selectedService === 'szczepienia' && (
              <>
                <h2 style={{ textAlign: 'center', marginBottom: '0.8rem', color: '#0f7ba8', fontSize: '1.6rem', fontWeight: '700' }}>Szczepienie: {selectedVaccine}</h2>
                <h3 style={{ textAlign: 'center', marginBottom: '2.5rem', color: '#666', fontSize: '1.2rem', fontWeight: '500' }}>Wybierz aptekę</h3>
              </>
            )}
            {selectedService === 'przeglądy' && (
              <h2 style={{ textAlign: 'center', marginBottom: '2.5rem', color: '#0f7ba8', fontSize: '1.8rem', fontWeight: '700' }}>Wybierz aptekę do przeglądu leków</h2>
            )}
            {selectedService === 'cisnienie' && (
              <h2 style={{ textAlign: 'center', marginBottom: '2.5rem', color: '#0f7ba8', fontSize: '1.8rem', fontWeight: '700' }}>Wybierz aptekę do pomiaru ciśnienia</h2>
            )}
            {selectedService === 'glukoza' && (
              <h2 style={{ textAlign: 'center', marginBottom: '2.5rem', color: '#0f7ba8', fontSize: '1.8rem', fontWeight: '700' }}>Wybierz aptekę do pomiaru glukozy</h2>
            )}
            <div className="pharmacies-grid">
              {pharmacies.map(pharmacy => (
                <div key={pharmacy.id} className="pharmacy-card" onClick={() => handlePharmacySelect(pharmacy)}>
                  <h3>{pharmacy.name}</h3>
                  <div className="city">{pharmacy.city}</div>
                  <div className="address">{pharmacy.address}</div>
                  <div className="hours">{pharmacy.hours}</div>
                  <div className="email">{pharmacy.email}</div>
                  <button className="btn-primary">Wybierz</button>
                </div>
              ))}
            </div>
          </div>
        </main>

        <footer className="footer">
          <p>Szpiczek.pl — Zaufaj nam, zadbaj o siebie. Szczepienia w aptece. 💙</p>
        </footer>
      </div>
    );
  }

  if (currentPage === 'booking') {
    return (
      <div className="app">
        {renderHeader(true, slogans['booking'])}

        <main>
          <div className="container">
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
                  
                  <input type="email" name="email" placeholder="Email (example@mail.com)" value={formData.email} onChange={handleFormChange} className={`form-input ${formErrors.email ? 'input-error' : ''}`} />
                  {formErrors.email && <span className="error-message">{formErrors.email}</span>}
                  
                  <input type="text" name="phone" placeholder="Telefon (min. 9 cyfr)" value={formData.phone} onChange={handleFormChange} className={`form-input ${formErrors.phone ? 'input-error' : ''}`} />
                  {formErrors.phone && <span className="error-message">{formErrors.phone}</span>}
                </div>

                {selectedService === 'przeglądy' && (
                  <div className="form-section">
                    <h3>Jakie leki państwo przyjmują?</h3>
                    <textarea 
                      name="medications" 
                      placeholder="Wpisz listę leków, które przyjmujesz..." 
                      value={formData.medications} 
                      onChange={handleFormChange} 
                      className={`form-textarea ${formErrors.medications ? 'input-error' : ''}`}
                      rows="5"
                    ></textarea>
                    {formErrors.medications && <span className="error-message">{formErrors.medications}</span>}
                  </div>
                )}

                <div className="form-section">
                  <h3>Wybierz datę</h3>
                  <input 
                    type="date" 
                    value={selectedDate || ''} 
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={getMinDate()}
                    max={getMaxDate()}
                    className={`form-input ${formErrors.date ? 'input-error' : ''}`}
                  />
                  {formErrors.date && <span className="error-message">{formErrors.date}</span>}
                </div>

                <div className="form-section">
                  <h3>Wybierz godzinę</h3>
                  <div className="time-slots">
                    {timeSlots.map(time => (
                      <div 
                        key={time} 
                        className={`time-slot ${selectedTime === time ? 'active' : ''}`}
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </div>
                    ))}
                  </div>
                  {formErrors.time && <span className="error-message">{formErrors.time}</span>}
                </div>

                <div className="form-section captcha-section">
                  <h3>Potwierdź że nie jesteś botem</h3>
                  <p className="captcha-question">{captchaQuestion.num1} + {captchaQuestion.num2} = ?</p>
                  <input 
                    type="text" 
                    placeholder="Wpisz wynik" 
                    value={captchaAnswer} 
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    className={`form-input captcha-input ${formErrors.captcha ? 'input-error' : ''}`}
                  />
                  {formErrors.captcha && <span className="error-message">{formErrors.captcha}</span>}
                </div>

                <button className="btn-primary btn-large" onClick={handleConfirmBooking}>Potwierdź rezerwację</button>
              </div>
            </div>
          </div>
        </main>

        <footer className="footer">
          <p>Szpiczek.pl — Zaufaj nam, zadbaj o siebie. Szczepienia w aptece. 💙</p>
        </footer>
      </div>
    );
  }

  if (currentPage === 'confirmation') {
    return (
      <div className="app">
        {renderHeader(true, slogans['confirmation'])}

        <main>
          <div className="container">
            <div className="confirmation">
              <div className="celebration-container">
                <img src="/images/szpiczek2.PNG" alt="Szpiczek" className="celebration-mascot" />
                <div className="confetti"></div>
              </div>

              <h2 className="celebration-title">Superhero! 🦸‍♂️</h2>
              <p className="celebration-subtitle">Właśnie stałeś się niezniszczalny! Twoja ochrona zdrowia +100 punktów!</p>

              <div className="celebration-divider"></div>

              <h3 style={{ marginTop: '2rem', color: '#0f7ba8', fontSize: '1.4rem', fontWeight: '700' }}>Rezerwacja potwierdzona!</h3>
              <p>Szczegóły zostały zapisane w Twojej przeglądarce.</p>

              <div className="confirmation-details">
                <div className="detail-row">
                  <span className="label">Imię i nazwisko</span>
                  <span className="value">{booking.firstName} {booking.lastName}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Email</span>
                  <span className="value">{booking.email}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Usługa</span>
                  <span className="value">{booking.service}</span>
                </div>
                {booking.vaccine && (
                  <div className="detail-row">
                    <span className="label">Szczepienie</span>
                    <span className="value">{booking.vaccine}</span>
                  </div>
                )}
                {booking.medications && (
                  <div className="detail-row">
                    <span className="label">Leki</span>
                    <span className="value">{booking.medications}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="label">Apteka</span>
                  <span className="value">{booking.pharmacy}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Data i godzina</span>
                  <span className="value">{new Date(booking.date).toLocaleDateString('pl-PL')} o {booking.time}</span>
                </div>
              </div>

              <div className="confirmation-footer">
                <p>Numer rezerwacji: <strong>#{booking.id}</strong></p>
                <button className="btn-primary btn-large" onClick={handleBackHome}>Powróć do strony głównej</button>
              </div>

              {bookings.length > 0 && (
                <div className="recent-bookings">
                  <h3>Ostatnie rezerwacje</h3>
                  <div className="bookings-list">
                    {bookings.map(b => (
                      <div key={b.id} className="booking-item">
                        <div className="booking-info">
                          <strong>{b.firstName} {b.lastName}</strong>
                          <p>{b.service}</p>
                          {b.vaccine && <p>Szczepienie: {b.vaccine}</p>}
                          {b.medications && <p>Leki: {b.medications}</p>}
                          <p>{b.pharmacy} - {new Date(b.date).toLocaleDateString('pl-PL')} o {b.time}</p>
                          <small>{b.email}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="footer">
          <p>Szpiczek.pl — Zaufaj nam, zadbaj o siebie. Szczepienia w aptece. 💙</p>
        </footer>
      </div>
    );
  }
}

// Login apteki (dummy bez backendu)
function PharmacyLogin() {
  const navigate = useNavigate();

  return (
    <div className="app">
      <main>
        <div className="container">
          <div className="login-container" style={{ maxWidth: '400px', margin: '5rem auto', textAlign: 'center' }}>
            <h1 style={{ textAlign: 'center', color: '#0f7ba8', marginBottom: '2rem' }}>Panel Apteki</h1>
            <p style={{ color: '#666', marginBottom: '2rem' }}>Panel apteki będzie dostępny niedługo 🚀</p>
            <button 
              className="btn-back"
              onClick={() => navigate('/')}
              style={{ width: '100%' }}
            >
              Powrót do strony głównej
            </button>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>Szpiczek.pl — Zaufaj nam, zadbaj o siebie. Szczepienia w aptece. 💙</p>
      </footer>
    </div>
  );
}

// Główna aplikacja z routingiem
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pharmacy-login" element={<PharmacyLogin />} />
      </Routes>
    </Router>
  );
}