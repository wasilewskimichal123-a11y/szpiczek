import React, { useState } from 'react';
import './App.css';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedService, setSelectedService] = useState(null);
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [booking, setBooking] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    medications: ''
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
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleConfirmBooking = () => {
    const isValid = formData.firstName && formData.lastName && formData.email && selectedTime;
    
    if (selectedService === 'przeglądy') {
      if (isValid && formData.medications) {
        createBooking('Przeglądy lekowe', formData.medications);
      }
    } else {
      if (isValid) {
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
      date: new Date().toLocaleDateString('pl-PL'),
      time: selectedTime
    };
    setBooking(newBooking);
    setBookings([...bookings, newBooking]);
    setFormData({ firstName: '', lastName: '', email: '', phone: '', medications: '' });
    setSelectedTime(null);
    setCurrentPage('confirmation');
  };

  const handleBackHome = () => {
    setCurrentPage('home');
    setSelectedService(null);
    setSelectedPharmacy(null);
    setSelectedVaccine(null);
    setSelectedTime(null);
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
            {/* HERO SECTION */}
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

            {/* 4 KARTY 2x2 */}
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
                  <input type="text" name="firstName" placeholder="Imię" value={formData.firstName} onChange={handleFormChange} className="form-input" />
                  <input type="text" name="lastName" placeholder="Nazwisko" value={formData.lastName} onChange={handleFormChange} className="form-input" />
                  <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleFormChange} className="form-input" />
                  <input type="tel" name="phone" placeholder="Telefon" value={formData.phone} onChange={handleFormChange} className="form-input" />
                </div>

                {selectedService === 'przeglądy' && (
                  <div className="form-section">
                    <h3>Jakie leki państwo przyjmują?</h3>
                    <textarea 
                      name="medications" 
                      placeholder="Wpisz listę leków, które przyjmujesz (np. Metformin 500mg, Aspirin 100mg, Atorvastatyna)..." 
                      value={formData.medications} 
                      onChange={handleFormChange} 
                      className="form-textarea"
                      rows="5"
                    ></textarea>
                  </div>
                )}

                <div className="form-section">
                  <h3>Wybierz godzinę</h3>
                  <div className="time-slots">
                    {timeSlots.map(time => (
                      <div key={time} className={`time-slot ${selectedTime === time ? 'active' : ''}`} onClick={() => setSelectedTime(time)}>
                        {time}
                      </div>
                    ))}
                  </div>
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
              <p>Szczegóły zostały wysłane na Twój email.</p>

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
                  <span className="value">{booking.date} o {booking.time}</span>
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
                          <p>{b.pharmacy} - {b.date} o {b.time}</p>
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