import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';

// Strona główna (rezerwacje pacjentów)
function HomePage() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedService, setSelectedService] = useState(null);
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [booking, setBooking] = useState(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState({ num1: 0, num2: 0, answer: 0 });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
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
    if (!formData.phone || !validatePhone(formData.phone)) errors.phone = 'Telefon jest wymagany i musi mieć min. 9 cyfr';
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
    } else if (service === 'testy') {
      setCurrentPage('tests-grid');
    } else if (service === 'badania') {
      setCurrentPage('exams-grid');
    } else if (service === 'przeglądy') {
      setCurrentPage('pharmacies');
    }
  };

  const handleVaccineSelect = (vaccine) => {
    setSelectedVaccine(vaccine);
    setCurrentPage('pharmacies');
  };

  const handleTestSelect = (test) => {
    setSelectedTest(test);
    setCurrentPage('pharmacies');
  };

  const handleExamSelect = (exam) => {
    setSelectedExam(exam);
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
    createBooking();
  };

  const createBooking = async () => {
    setLoading(true);
    try {
      const bookingData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        pharmacy: selectedPharmacy.city,
        service: serviceNames[selectedService],
        vaccine: selectedVaccine || null,
        test: selectedTest || null,
        exam: selectedExam || null,
        medications: formData.medications || null,
        date: selectedDate,
        time: selectedTime
      };

      // WYSYŁAJ DO BACKENDU
      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        throw new Error('Błąd wysyłania rezerwacji');
      }

      const result = await response.json();
      setBooking(bookingData);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', medications: '' });
      setSelectedTime(null);
      setSelectedDate(null);
      setCurrentPage('confirmation');
    } catch (error) {
      console.log('Błąd:', error);
      alert('Błąd wysyłania rezerwacji. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackHome = () => {
    setCurrentPage('home');
    setSelectedService(null);
    setSelectedPharmacy(null);
    setSelectedVaccine(null);
    setSelectedTest(null);
    setSelectedExam(null);
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

              <div className="service-card" onClick={() => handleServiceClick('badania')}>
                <div className="service-icon">📊</div>
                <h3>Badania diagnostyczne</h3>
                <p>Badania dostępne w aptece</p>
                <button className="btn-service">Zarezerwuj</button>
              </div>

              <div className="service-card" onClick={() => handleServiceClick('testy')}>
                <div className="service-icon">🧬</div>
                <h3>Testy diagnostyczne</h3>
                <p>Testy dostępne w aptece</p>
                <button className="btn-service">Zarezerwuj</button>
              </div>
            </div>
          </div>
        </main>

        <footer className="footer" style={{ textAlign: 'center', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <p className="footer-slogan" style={{ margin: '0 0 0.5rem 0' }}>Zaufaj nam, zadbaj o siebie. 💙</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#0c4a6e', opacity: 0.7 }}>Built by MW</p>
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

        <footer className="footer" style={{ textAlign: 'center', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <p className="footer-slogan" style={{ margin: '0 0 0.5rem 0' }}>Zaufaj nam, zadbaj o siebie. 💙</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#0c4a6e', opacity: 0.7 }}>Built by MW</p>
        </footer>
      </div>
    );
  }

  if (currentPage === 'exams-grid') {
    return (
      <div className="app">
        {renderHeader(true, slogans['exams-grid'])}

        <main>
          <div className="container">
            <h2 style={{ textAlign: 'center', marginBottom: '2.5rem', color: '#0f7ba8', fontSize: '1.8rem', fontWeight: '700' }}>Wybierz badanie diagnostyczne</h2>
            <div className="vaccines-grid">
              {exams.map(exam => (
                <div key={exam} className="vaccine-card" onClick={() => handleExamSelect(exam)}>
                  <div className="vaccine-card-icon">📊</div>
                  <h3>{exam}</h3>
                  <button className="btn-service">Wybierz</button>
                </div>
              ))}
            </div>
          </div>
        </main>

        <footer className="footer" style={{ textAlign: 'center', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <p className="footer-slogan" style={{ margin: '0 0 0.5rem 0' }}>Zaufaj nam, zadbaj o siebie. 💙</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#0c4a6e', opacity: 0.7 }}>Built by MW</p>
        </footer>
      </div>
    );
  }

  if (currentPage === 'tests-grid') {
    return (
      <div className="app">
        {renderHeader(true, slogans['tests-grid'])}

        <main>
          <div className="container">
            <h2 style={{ textAlign: 'center', marginBottom: '2.5rem', color: '#0f7ba8', fontSize: '1.8rem', fontWeight: '700' }}>Wybierz test diagnostyczny</h2>
            <div className="vaccines-grid">
              {tests.map(test => (
                <div key={test} className="vaccine-card" onClick={() => handleTestSelect(test)}>
                  <div className="vaccine-card-icon">🧬</div>
                  <h3>{test}</h3>
                  <button className="btn-service">Wybierz</button>
                </div>
              ))}
            </div>
          </div>
        </main>

        <footer className="footer" style={{ textAlign: 'center', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <p className="footer-slogan" style={{ margin: '0 0 0.5rem 0' }}>Zaufaj nam, zadbaj o siebie. 💙</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#0c4a6e', opacity: 0.7 }}>Built by MW</p>
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
            {selectedService === 'badania' && (
              <>
                <h2 style={{ textAlign: 'center', marginBottom: '0.8rem', color: '#0f7ba8', fontSize: '1.6rem', fontWeight: '700' }}>Badanie: {selectedExam}</h2>
                <h3 style={{ textAlign: 'center', marginBottom: '2.5rem', color: '#666', fontSize: '1.2rem', fontWeight: '500' }}>Wybierz aptekę</h3>
              </>
            )}
            {selectedService === 'testy' && (
              <>
                <h2 style={{ textAlign: 'center', marginBottom: '0.8rem', color: '#0f7ba8', fontSize: '1.6rem', fontWeight: '700' }}>Test: {selectedTest}</h2>
                <h3 style={{ textAlign: 'center', marginBottom: '2.5rem', color: '#666', fontSize: '1.2rem', fontWeight: '500' }}>Wybierz aptekę</h3>
              </>
            )}
            {selectedService === 'przeglądy' && (
              <h2 style={{ textAlign: 'center', marginBottom: '2.5rem', color: '#0f7ba8', fontSize: '1.8rem', fontWeight: '700' }}>Wybierz aptekę do przeglądu leków</h2>
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

        <footer className="footer" style={{ textAlign: 'center', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <p className="footer-slogan" style={{ margin: '0 0 0.5rem 0' }}>Zaufaj nam, zadbaj o siebie. 💙</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#0c4a6e', opacity: 0.7 }}>Built by MW</p>
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

                <button className="btn-primary btn-large" onClick={handleConfirmBooking} disabled={loading}>
                  {loading ? 'Wysyłanie...' : 'Potwierdź rezerwację'}
                </button>
              </div>
            </div>
          </div>
        </main>

        <footer className="footer" style={{ textAlign: 'center', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <p className="footer-slogan" style={{ margin: '0 0 0.5rem 0' }}>Zaufaj nam, zadbaj o siebie. 💙</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#0c4a6e', opacity: 0.7 }}>Built by MW</p>
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
              <p>Email potwierdzenia został wysłany na {booking.email}</p>

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
                  <span className="label">Telefon</span>
                  <span className="value">{booking.phone}</span>
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
                {booking.exam && (
                  <div className="detail-row">
                    <span className="label">Badanie</span>
                    <span className="value">{booking.exam}</span>
                  </div>
                )}
                {booking.test && (
                  <div className="detail-row">
                    <span className="label">Test</span>
                    <span className="value">{booking.test}</span>
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
                <button className="btn-primary btn-large" onClick={handleBackHome}>Powróć do strony głównej</button>
              </div>
            </div>
          </div>
        </main>

        <footer className="footer" style={{ textAlign: 'center', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <p className="footer-slogan" style={{ margin: '0 0 0.5rem 0' }}>Zaufaj nam, zadbaj o siebie. 💙</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#0c4a6e', opacity: 0.7 }}>Built by MW</p>
        </footer>
      </div>
    );
  }
}

// O nas
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

// FAQ
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

// Kontakt
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

// Partnerzy
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

// Blog
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

// Panel Apteki
function PharmacyLoginPage() {
  return (
    <div className="app">
      <main>
        <div className="container" style={{ maxWidth: '400px', margin: '5rem auto', textAlign: 'center' }}>
          <h1 style={{ textAlign: 'center', color: '#0f7ba8', marginBottom: '2rem' }}>📋 Panel Apteki</h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>Panel apteki będzie dostępny niedługo 🚀</p>
        </div>
      </main>

      <footer className="footer" style={{ textAlign: 'center', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <p className="footer-slogan" style={{ margin: '0 0 0.5rem 0' }}>Zaufaj nam, zadbaj o siebie. 💙</p>
        <p style={{ margin: 0, fontSize: '12px', color: '#0c4a6e', opacity: 0.7 }}>Built by MW</p>
      </footer>
    </div>
  );
}

// Główna aplikacja z routingiem
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
      {/* HEADER GÓRNY */}
      <div style={{
        background: 'linear-gradient(135deg, #0f7ba8 0%, #1a9fcf 100%)',
        color: 'white',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/')} style={{
            color: 'white',
            fontSize: '13px',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontWeight: '700',
            background: 'rgba(255,255,255,0.25)',
            border: '1px solid rgba(255,255,255,0.5)',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            transition: '0.3s'
          }}>
            🏠 Home
          </button>
          <button onClick={() => navigate('/about')} style={{
            color: 'white',
            fontSize: '13px',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontWeight: '600',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            transition: '0.3s'
          }}>
            📖 O nas
          </button>
          <button onClick={() => navigate('/faq')} style={{
            color: 'white',
            fontSize: '13px',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontWeight: '600',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            transition: '0.3s'
          }}>
            ❓ FAQ
          </button>
          <button onClick={() => navigate('/contact')} style={{
            color: 'white',
            fontSize: '13px',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontWeight: '600',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            transition: '0.3s'
          }}>
            📧 Kontakt
          </button>
          <button onClick={() => navigate('/partners')} style={{
            color: 'white',
            fontSize: '13px',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontWeight: '600',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            transition: '0.3s'
          }}>
            🤝 Partnerzy
          </button>
          <button onClick={() => navigate('/blog')} style={{
            color: 'white',
            fontSize: '13px',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontWeight: '600',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            transition: '0.3s'
          }}>
            📰 Blog
          </button>
        </div>
        <button onClick={() => navigate('/pharmacy-login')} style={{
          background: 'rgba(255,255,255,0.2)',
          border: '1.5px solid rgba(255,255,255,0.4)',
          color: 'white',
          padding: '0.6rem 1.3rem',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          transition: 'all 0.3s',
          whiteSpace: 'nowrap'
        }}>
          📋 Panel Apteki
        </button>
      </div>

      {/* ROUTES */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/partners" element={<PartnersPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/pharmacy-login" element={<PharmacyLoginPage />} />
      </Routes>
    </>
  );
}