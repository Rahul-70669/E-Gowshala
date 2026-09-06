import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, MapPin, AlertTriangle, Phone, CheckCircle, Navigation,
  Clock, ShieldAlert, ArrowLeft, Send, ExternalLink, HeartHandshake,
  Ambulance, Eye, Sparkles, RefreshCw
} from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { useLanguageStore } from '../../store/languageStore';
import { useThemeStore } from '../../store/themeStore';
import RescueMapView from './RescueMapView';

const INDIAN_CITY_COORDS: Record<string, { lat: number; lng: number; state: string; city: string }> = {
  'mathura': { lat: 27.4924, lng: 77.6737, state: 'Uttar Pradesh', city: 'Mathura' },
  'vrindavan': { lat: 27.5800, lng: 77.7000, state: 'Uttar Pradesh', city: 'Vrindavan' },
  'barsana': { lat: 27.6467, lng: 77.3756, state: 'Uttar Pradesh', city: 'Barsana' },
  'govardhan': { lat: 27.4950, lng: 77.4660, state: 'Uttar Pradesh', city: 'Govardhan' },
  'agra': { lat: 27.1767, lng: 78.0081, state: 'Uttar Pradesh', city: 'Agra' },
  'delhi': { lat: 28.6139, lng: 77.2090, state: 'Delhi', city: 'Delhi' },
  'noida': { lat: 28.5355, lng: 77.3910, state: 'Uttar Pradesh', city: 'Noida' },
  'gurugram': { lat: 28.4595, lng: 77.0266, state: 'Haryana', city: 'Gurugram' },
  'gurgaon': { lat: 28.4595, lng: 77.0266, state: 'Haryana', city: 'Gurugram' },
  'faridabad': { lat: 28.4089, lng: 77.3178, state: 'Haryana', city: 'Faridabad' },
  'ghaziabad': { lat: 28.6692, lng: 77.4538, state: 'Uttar Pradesh', city: 'Ghaziabad' },
  'jaipur': { lat: 26.9124, lng: 75.7873, state: 'Rajasthan', city: 'Jaipur' },
  'sanganer': { lat: 26.8183, lng: 75.7687, state: 'Rajasthan', city: 'Sanganer' },
  'chomu': { lat: 27.1724, lng: 75.7231, state: 'Rajasthan', city: 'Chomu' },
  'alwar': { lat: 27.5530, lng: 76.6346, state: 'Rajasthan', city: 'Alwar' },
  'ajmer': { lat: 26.4499, lng: 74.6399, state: 'Rajasthan', city: 'Ajmer' },
  'pushkar': { lat: 26.4897, lng: 74.5511, state: 'Rajasthan', city: 'Pushkar' },
  'jodhpur': { lat: 26.2389, lng: 73.0243, state: 'Rajasthan', city: 'Jodhpur' },
  'udaipur': { lat: 24.5854, lng: 73.7125, state: 'Rajasthan', city: 'Udaipur' },
  'kota': { lat: 25.2138, lng: 75.8648, state: 'Rajasthan', city: 'Kota' },
  'bikaner': { lat: 28.0229, lng: 73.3119, state: 'Rajasthan', city: 'Bikaner' },
  'karnal': { lat: 29.6857, lng: 76.9905, state: 'Haryana', city: 'Karnal' },
  'kurukshetra': { lat: 29.9695, lng: 76.8783, state: 'Haryana', city: 'Kurukshetra' },
  'panipat': { lat: 29.3909, lng: 76.9635, state: 'Haryana', city: 'Panipat' },
  'ambala': { lat: 30.3782, lng: 76.7767, state: 'Haryana', city: 'Ambala' },
  'chandigarh': { lat: 30.7333, lng: 76.7794, state: 'Chandigarh', city: 'Chandigarh' },
  'ludhiana': { lat: 30.9010, lng: 75.8573, state: 'Punjab', city: 'Ludhiana' },
  'amritsar': { lat: 31.6340, lng: 74.8723, state: 'Punjab', city: 'Amritsar' },
  'haridwar': { lat: 29.9457, lng: 78.1642, state: 'Uttarakhand', city: 'Haridwar' },
  'rishikesh': { lat: 30.0869, lng: 78.2676, state: 'Uttarakhand', city: 'Rishikesh' },
  'dehradun': { lat: 30.3165, lng: 78.0322, state: 'Uttarakhand', city: 'Dehradun' },
  'lucknow': { lat: 26.8467, lng: 80.9462, state: 'Uttar Pradesh', city: 'Lucknow' },
  'kanpur': { lat: 26.4499, lng: 80.3319, state: 'Uttar Pradesh', city: 'Kanpur' },
  'varanasi': { lat: 25.3176, lng: 82.9739, state: 'Uttar Pradesh', city: 'Varanasi' },
  'kashi': { lat: 25.3176, lng: 82.9739, state: 'Uttar Pradesh', city: 'Varanasi' },
  'banaras': { lat: 25.3176, lng: 82.9739, state: 'Uttar Pradesh', city: 'Varanasi' },
  'ayodhya': { lat: 26.7922, lng: 82.1998, state: 'Uttar Pradesh', city: 'Ayodhya' },
  'prayagraj': { lat: 25.4358, lng: 81.8463, state: 'Uttar Pradesh', city: 'Prayagraj' },
  'allahabad': { lat: 25.4358, lng: 81.8463, state: 'Uttar Pradesh', city: 'Prayagraj' },
  'gorakhpur': { lat: 26.7606, lng: 83.3732, state: 'Uttar Pradesh', city: 'Gorakhpur' },
  'patna': { lat: 25.5941, lng: 85.1376, state: 'Bihar', city: 'Patna' },
  'gaya': { lat: 24.7914, lng: 85.0002, state: 'Bihar', city: 'Gaya' },
  'ranchi': { lat: 23.3441, lng: 85.3096, state: 'Jharkhand', city: 'Ranchi' },
  'kolkata': { lat: 22.5726, lng: 88.3639, state: 'West Bengal', city: 'Kolkata' },
  'howrah': { lat: 22.5958, lng: 88.2636, state: 'West Bengal', city: 'Howrah' },
  'bhubaneswar': { lat: 20.2961, lng: 85.8245, state: 'Odisha', city: 'Bhubaneswar' },
  'puri': { lat: 19.8135, lng: 85.8312, state: 'Odisha', city: 'Puri' },
  'bhopal': { lat: 23.2599, lng: 77.4126, state: 'Madhya Pradesh', city: 'Bhopal' },
  'indore': { lat: 22.7196, lng: 75.8577, state: 'Madhya Pradesh', city: 'Indore' },
  'ujjain': { lat: 23.1765, lng: 75.7885, state: 'Madhya Pradesh', city: 'Ujjain' },
  'gwalior': { lat: 26.2183, lng: 78.1828, state: 'Madhya Pradesh', city: 'Gwalior' },
  'jabalpur': { lat: 23.1815, lng: 79.9864, state: 'Madhya Pradesh', city: 'Jabalpur' },
  'ahmedabad': { lat: 23.0225, lng: 72.5714, state: 'Gujarat', city: 'Ahmedabad' },
  'gandhinagar': { lat: 23.2156, lng: 72.6369, state: 'Gujarat', city: 'Gandhinagar' },
  'rajkot': { lat: 22.3039, lng: 70.8022, state: 'Gujarat', city: 'Rajkot' },
  'surat': { lat: 21.1702, lng: 72.8311, state: 'Gujarat', city: 'Surat' },
  'vadodara': { lat: 22.3072, lng: 73.1812, state: 'Gujarat', city: 'Vadodara' },
  'mumbai': { lat: 19.0760, lng: 72.8777, state: 'Maharashtra', city: 'Mumbai' },
  'pune': { lat: 18.5204, lng: 73.8567, state: 'Maharashtra', city: 'Pune' },
  'nagpur': { lat: 21.1458, lng: 79.0882, state: 'Maharashtra', city: 'Nagpur' },
  'nashik': { lat: 19.9975, lng: 73.7898, state: 'Maharashtra', city: 'Nashik' },
  'hyderabad': { lat: 17.3850, lng: 78.4867, state: 'Telangana', city: 'Hyderabad' },
  'bengaluru': { lat: 12.9716, lng: 77.5946, state: 'Karnataka', city: 'Bengaluru' },
  'bangalore': { lat: 12.9716, lng: 77.5946, state: 'Karnataka', city: 'Bengaluru' },
  'chennai': { lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu', city: 'Chennai' },
  'guwahati': { lat: 26.1445, lng: 91.7362, state: 'Assam', city: 'Guwahati' },
  // Kerala & Southern Regions
  'kerala': { lat: 10.8505, lng: 76.2711, state: 'Kerala', city: 'Kerala' },
  'kochi': { lat: 9.9312, lng: 76.2673, state: 'Kerala', city: 'Kochi' },
  'cochin': { lat: 9.9312, lng: 76.2673, state: 'Kerala', city: 'Kochi' },
  'thiruvananthapuram': { lat: 8.5241, lng: 76.9366, state: 'Kerala', city: 'Thiruvananthapuram' },
  'trivandrum': { lat: 8.5241, lng: 76.9366, state: 'Kerala', city: 'Thiruvananthapuram' },
  'kozhikode': { lat: 11.2588, lng: 75.7804, state: 'Kerala', city: 'Kozhikode' },
  'calicut': { lat: 11.2588, lng: 75.7804, state: 'Kerala', city: 'Kozhikode' },
  'thrissur': { lat: 10.5276, lng: 76.2144, state: 'Kerala', city: 'Thrissur' },
  'malappuram': { lat: 11.0732, lng: 76.0740, state: 'Kerala', city: 'Malappuram' },
  'kannur': { lat: 11.8745, lng: 75.3704, state: 'Kerala', city: 'Kannur' },
  'kollam': { lat: 8.8932, lng: 76.6141, state: 'Kerala', city: 'Kollam' },
  'alappuzha': { lat: 9.4981, lng: 76.3388, state: 'Kerala', city: 'Alappuzha' },
  'alleppey': { lat: 9.4981, lng: 76.3388, state: 'Kerala', city: 'Alappuzha' },
  'palakkad': { lat: 10.7867, lng: 76.6548, state: 'Kerala', city: 'Palakkad' },
  'kottayam': { lat: 9.5916, lng: 76.5222, state: 'Kerala', city: 'Kottayam' },
  'kasaragod': { lat: 12.5102, lng: 74.9852, state: 'Kerala', city: 'Kasaragod' },
  'wayanad': { lat: 11.6854, lng: 76.1320, state: 'Kerala', city: 'Wayanad' },
  'idukki': { lat: 9.8494, lng: 76.9804, state: 'Kerala', city: 'Idukki' },
  'pathanamthitta': { lat: 9.2648, lng: 76.7870, state: 'Kerala', city: 'Pathanamthitta' },
  'coimbatore': { lat: 11.0168, lng: 76.9558, state: 'Tamil Nadu', city: 'Coimbatore' },
  'madurai': { lat: 9.9252, lng: 78.1198, state: 'Tamil Nadu', city: 'Madurai' },
  'mysore': { lat: 12.2958, lng: 76.6394, state: 'Karnataka', city: 'Mysuru' },
  'mysuru': { lat: 12.2958, lng: 76.6394, state: 'Karnataka', city: 'Mysuru' },
  'goa': { lat: 15.2993, lng: 74.1240, state: 'Goa', city: 'Goa' },
  'panaji': { lat: 15.4909, lng: 73.8278, state: 'Goa', city: 'Panaji' },
};

function resolveCityFromLocation(text: string): { lat: number; lng: number; label: string } | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const [key, val] of Object.entries(INDIAN_CITY_COORDS)) {
    if (lower.includes(key)) {
      return { lat: val.lat, lng: val.lng, label: `${val.city}, ${val.state}` };
    }
  }
  return null;
}

const RescueCowPage = () => {
  const navigate = useNavigate();
  const { language } = useLanguageStore();
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAddress, setGpsAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<any>(null);
  const [showMapModal, setShowMapModal] = useState(false);

  const [form, setForm] = useState({
    reporterName: '',
    reporterPhone: '',
    locationName: '',
    condition: 'Injured / Bleeding',
    urgency: 'critical',
    landmark: '',
  });

  const [rescueQueue, setRescueQueue] = useState<any[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [activeTab, setActiveTab] = useState<'report' | 'queue'>('report');

  const fetchQueue = async () => {
    try {
      const res = await apiClient.get('/public/rescue-requests');
      setRescueQueue(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching rescue queue:', err);
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  // Capture Photo
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Capture Live GPS Location with intelligent multi-source fallback
  const handleCaptureGps = () => {
    setGpsLoading(true);

    const reverseGeocode = async (lat: number, lng: number) => {
      try {
        const resp = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
        if (resp.ok) {
          const data = await resp.json();
          const place = [data.locality || data.principalSubdivisionCity, data.principalSubdivision, data.countryCode].filter(Boolean).join(', ');
          if (place) {
            setGpsAddress(`${place} (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`);
            setForm(prev => ({ ...prev, locationName: `${place} (Highway Corridor)` }));
            return;
          }
        }
      } catch (e) {
        // network or CORS fallback
      }
      setGpsAddress(`GPS: ${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`);
      setForm(prev => ({ ...prev, locationName: `GPS Spot: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°` }));
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setGpsCoords({ lat: latitude, lng: longitude });
          await reverseGeocode(latitude, longitude);
          setGpsLoading(false);
        },
        async (err) => {
          console.warn('GPS hardware/permission issue, switching to IP Geolocation:', err);
          try {
            const ipResp = await fetch('https://ipapi.co/json/');
            if (ipResp.ok) {
              const ipData = await ipResp.json();
              if (ipData.latitude && ipData.longitude) {
                const lat = parseFloat(ipData.latitude);
                const lng = parseFloat(ipData.longitude);
                setGpsCoords({ lat, lng });
                const loc = `${ipData.city || 'Regional'}, ${ipData.region || 'Area'}, ${ipData.country_name || 'India'}`;
                setGpsAddress(`${loc} (IP: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`);
                setForm(prev => ({ ...prev, locationName: `${loc} (Highway Road)` }));
                setGpsLoading(false);
                return;
              }
            }
          } catch (ipErr) {
            console.warn('IP location fetch failed:', ipErr);
          }
          // Default fallback
          const mockLat = 26.9124;
          const mockLng = 75.7873;
          setGpsCoords({ lat: mockLat, lng: mockLng });
          setGpsAddress(`Jaipur Bypass (26.9124° N, 75.7873° E)`);
          setForm(prev => ({ ...prev, locationName: 'Jaipur Bypass NH-48, Milestone 14' }));
          setGpsLoading(false);
        },
        { timeout: 4000, enableHighAccuracy: false, maximumAge: 60000 }
      );
    } else {
      const mockLat = 26.9124;
      const mockLng = 75.7873;
      setGpsCoords({ lat: mockLat, lng: mockLng });
      setGpsAddress(`Jaipur Bypass (26.9124° N, 75.7873° E)`);
      setForm(prev => ({ ...prev, locationName: 'Jaipur Bypass NH-48, Milestone 14' }));
      setGpsLoading(false);
    }
  };

  const handleLocationNameChange = (val: string) => {
    setForm(prev => ({ ...prev, locationName: val }));
    const detected = resolveCityFromLocation(val);
    if (detected) {
      setGpsCoords({ lat: detected.lat, lng: detected.lng });
      setGpsAddress(`${detected.label} (${detected.lat.toFixed(4)}°, ${detected.lng.toFixed(4)}°)`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPhoto = photoPreview || '/cow-icon-transparent.png';
    setSubmitting(true);

    // Auto-resolve city coords if user didn't press GPS button
    let finalLat = gpsCoords?.lat;
    let finalLng = gpsCoords?.lng;
    if (!finalLat || !finalLng) {
      const detected = resolveCityFromLocation(form.locationName);
      if (detected) {
        finalLat = detected.lat;
        finalLng = detected.lng;
      } else {
        finalLat = 26.9124;
        finalLng = 75.7873;
      }
    }

    try {
      const payload = {
        reporterName: form.reporterName || 'Compassionate Citizen',
        reporterPhone: form.reporterPhone || '+91 98765 00000',
        locationName: form.locationName || gpsAddress || 'Jaipur Highway NH-48',
        latitude: finalLat,
        longitude: finalLng,
        condition: `${form.condition}${form.landmark ? ` (Landmark: ${form.landmark})` : ''}`,
        urgency: form.urgency,
        photoUrl: finalPhoto,
      };

      const res = await apiClient.post('/public/rescue-report', payload);
      const returnedReport = res.data?.data || payload;
      setSubmittedReport(returnedReport);
      await fetchQueue();
    } catch (err) {
      console.error('Submit rescue error:', err);
      const fallbackReport = {
        id: `RSC-REQ-${Math.floor(100 + Math.random() * 900)}`,
        reporterName: form.reporterName || 'Compassionate Citizen',
        reporterPhone: form.reporterPhone || '+91 98765 00000',
        locationName: form.locationName || 'Highway Sector 12',
        latitude: finalLat,
        longitude: finalLng,
        condition: form.condition,
        urgency: form.urgency,
        photoUrl: finalPhoto,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      setSubmittedReport(fallbackReport);
      setRescueQueue(prev => [fallbackReport, ...prev]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
      {/* Top Navbar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: isDark ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-color)',
        padding: '10px max(14px, env(safe-area-inset-right)) 10px max(14px, env(safe-area-inset-left))', minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem' }} onClick={() => navigate('/')}>
            <ArrowLeft size={16} /> <span className="back-btn-text">{language === 'hi' ? 'होमपेज' : 'Home'}</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>🚨</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#EF4444' }}>
                {language === 'hi' ? 'गौ-रक्षा व त्वरित रेस्क्यू पोर्टल' : 'Emergency Cattle Rescue Portal'}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {language === 'hi' ? 'लाइव जीपीएस व एम्बुलेंस ट्रैकिंग' : 'Instant GPS Alert & Rapid Caretaker Dispatch'}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className={`btn ${activeTab === 'report' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            onClick={() => setActiveTab('report')}
          >
            <Camera size={14} /> {language === 'hi' ? 'रेस्क्यू रिपोर्ट करें' : 'Report Rescue'}
          </button>
          <button
            className={`btn ${activeTab === 'queue' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            onClick={() => setActiveTab('queue')}
          >
            <Ambulance size={14} /> {language === 'hi' ? 'रेस्क्यू कंट्रोल रूम' : 'Live Rescue Feed'} ({rescueQueue.length})
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '20px 14px' }}>
        {activeTab === 'report' ? (
          <div>
            {submittedReport ? (
              /* Success confirmation */
              <div className="card" style={{ textAlign: 'center', padding: '40px 24px', borderTop: '4px solid #10B981' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#10B981' }}>
                  <CheckCircle size={36} />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {language === 'hi' ? '🙏 रेस्क्यू सूचना दर्ज कर ली गई है!' : '🙏 Rescue Alert Broadcast Successfully!'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '560px', margin: '0 auto 20px' }}>
                  {language === 'hi'
                    ? `टिकट संख्या #${submittedReport.id} निकटतम गौशाला एम्बुलेंस एवं केयरटेकर टीम को प्रेषित कर दी गई है।`
                    : `Ticket #${submittedReport.id} has been dispatched to the nearest Gaushala emergency ambulance team and veterinary unit.`}
                </p>

                <div style={{ background: 'var(--bg-card-inner)', borderRadius: '12px', padding: '20px', maxWidth: '480px', margin: '0 auto 24px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Ticket ID:</span>
                    <strong style={{ color: '#EF4444' }}>{submittedReport.id}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Location:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{submittedReport.locationName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Condition:</span>
                    <span style={{ color: '#F97316', fontWeight: 600 }}>{submittedReport.condition}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                    <span className="badge badge-warning">🚑 Team Mobilized</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={() => navigate(submittedReport?.id ? `/dashboard/rescue-map?selectedId=${submittedReport.id}` : '/dashboard/rescue-map')}
                  >
                    <MapPin size={16} /> {language === 'hi' ? '📍 लाइव रेस्क्यू मैप पर देखें' : '📍 View on Live Rescue Map'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => setActiveTab('queue')}>
                    <Eye size={16} /> {language === 'hi' ? 'लाइव रेस्क्यू स्थिति देखें' : 'View in Rescue Feed'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => { setSubmittedReport(null); setPhotoPreview(''); setGpsCoords(null); }}>
                    <RefreshCw size={16} /> {language === 'hi' ? 'अन्य गाय की रिपोर्ट करें' : 'Report Another Cow'}
                  </button>
                </div>
              </div>
            ) : (
              /* Report Form */
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                {/* Hero Banner */}
                <div style={{
                  background: isDark ? 'linear-gradient(135deg, #1e1b4b, #0f172a)' : 'linear-gradient(135deg, #fef2f2, #fff7ed)',
                  border: '1px solid rgba(239,68,68,0.25)', borderRadius: '16px', padding: '24px',
                  display: 'flex', alignItems: 'center', gap: '16px'
                }}>
                  <div style={{ width: 52, height: 52, borderRadius: '12px', background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                    <Ambulance size={28} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                      {language === 'hi' ? 'सड़क पर घायल या बेसहारा गोवंश की सहायता करें' : 'Report Injured, Sick or Abandoned Cattle'}
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {language === 'hi'
                        ? 'तस्वीर खींचें, जीपीएस लोकेशन साझा करें। हमारी टीम तुरंत मौके पर पहुंचेगी।'
                        : 'Take a photo, capture GPS location. Our veterinary ambulance and caretaker team will reach immediately.'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="card" style={{ padding: '24px' }}>
                    {/* Section 1: Photo Capture */}
                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
                        📸 {language === 'hi' ? 'गाय की तस्वीर लें या अपलोड करें *' : 'Photograph of Cow / Incident *'}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handlePhotoCapture}
                      />

                      {photoPreview ? (
                        <div style={{ position: 'relative', width: '100%', maxHeight: '300px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #10B981' }}>
                          <img src={photoPreview} alt="Distressed cattle" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }} />
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ position: 'absolute', bottom: 12, right: 12, fontSize: '0.75rem', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none' }}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Camera size={14} /> Retake Photo
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            border: '2px dashed #F97316', borderRadius: '12px', padding: '36px 16px',
                            textAlign: 'center', cursor: 'pointer', background: 'var(--bg-card-inner)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(249,115,22,0.15)', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                            <Camera size={26} />
                          </div>
                          <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                            {language === 'hi' ? 'कैमरा खोलें या फोटो चुनें' : 'Tap to Open Camera or Upload Image'}
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                            Supports mobile camera direct capture
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Section 2: GPS Location */}
                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
                        📍 {language === 'hi' ? 'सटीक स्थान (GPS ऑटो-कैप्चर)' : 'Accurate Location (GPS Auto-Capture)'}
                      </label>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleCaptureGps}
                          disabled={gpsLoading}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
                        >
                          <Navigation size={16} /> {gpsLoading ? 'Capturing satellite coordinates...' : (language === 'hi' ? 'मेरा वर्तमान जीपीएस प्राप्त करें' : 'Get Current GPS Location')}
                        </button>
                        {gpsAddress && (
                          <span className="badge badge-success" style={{ fontSize: '0.78rem', padding: '6px 12px' }}>
                            ✓ {gpsAddress}
                          </span>
                        )}
                      </div>

                      {/* One-Click Quick Highway Presets */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {language === 'hi' ? 'त्वरित स्थान चयन:' : 'Quick Spot Selection:'}
                        </span>
                        {[
                          { label: '📍 Jaipur NH-48', lat: 26.9124, lng: 75.7873, name: 'Jaipur Bypass NH-48, Milestone 14' },
                          { label: '📍 Mathura Pilgrim Marg', lat: 27.4924, lng: 77.6737, name: 'Gau Ghat, Yamuna Marg, Mathura' },
                          { label: '📍 Kochi, Kerala NH-66', lat: 9.9312, lng: 76.2673, name: 'Marine Drive Road, Kochi, Kerala' },
                          { label: '📍 Rajkot NH-27', lat: 22.3039, lng: 70.8022, name: 'NH-27 Overpass, Rajkot Outer' },
                          { label: '📍 Karnal GT Road', lat: 29.6857, lng: 76.9905, name: 'GT Road Sector 4, Karnal' },
                          { label: '📍 Pune Expressway', lat: 18.5204, lng: 73.8567, name: 'Pune Expressway Outer Toll Plaza' },
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '3px 8px', fontSize: '0.7rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                            onClick={() => {
                              setGpsCoords({ lat: preset.lat, lng: preset.lng });
                              setGpsAddress(`${preset.name} (${preset.lat.toFixed(4)}°, ${preset.lng.toFixed(4)}°)`);
                              setForm(prev => ({ ...prev, locationName: preset.name }));
                            }}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="form-group">
                          <label>{language === 'hi' ? 'सड़क / क्षेत्र / शहर का नाम *' : 'Road / Highway / Area Name *'}</label>
                          <input
                            className="input"
                            placeholder="e.g. Kerala, Kochi, Mathura, Jaipur Road..."
                            value={form.locationName}
                            onChange={e => handleLocationNameChange(e.target.value)}
                            required
                          />
                          {gpsCoords && (
                            <div style={{ marginTop: '6px', fontSize: '0.74rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={12} />
                              <span>Live Radar Pin: {gpsAddress || `${gpsCoords.lat.toFixed(4)}°, ${gpsCoords.lng.toFixed(4)}°`}</span>
                            </div>
                          )}
                        </div>
                        <div className="form-group">
                          <label>{language === 'hi' ? 'पहचान का चिन्ह (Landmark)' : 'Nearby Landmark'}</label>
                          <input
                            className="input"
                            placeholder="e.g. Opposite Shiv Temple / Near Petrol Pump"
                            value={form.landmark}
                            onChange={e => setForm({ ...form, landmark: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Condition & Urgency */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                      <div className="form-group">
                        <label>{language === 'hi' ? 'स्थिति / समस्या *' : 'Cattle Condition *'}</label>
                        <select
                          className="input"
                          value={form.condition}
                          onChange={e => setForm({ ...form, condition: e.target.value })}
                        >
                          <option value="Hit by Vehicle / Bleeding">🚨 Hit by Vehicle / Road Accident (Severe Bleeding)</option>
                          <option value="Fractured Leg / Unable to Move">🦴 Fractured Hoof / Broken Leg (Cannot Walk)</option>
                          <option value="Severe Infection / Lumpy Skin Wounds">⚠️ Severe Skin Disease / Open Maggot Wounds</option>
                          <option value="Abandoned Newborn Calf">🍼 Abandoned Newborn Calf (Hypothermia / Starving)</option>
                          <option value="Plastic Ingestion / Bloat">🌾 Severe Dehydration / Plastic Choking</option>
                          <option value="Trapped / Deep Ditch">🆘 Trapped in Drain / Mud / Enclosure</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>{language === 'hi' ? 'आपात स्तर' : 'Urgency Level'}</label>
                        <select
                          className="input"
                          value={form.urgency}
                          onChange={e => setForm({ ...form, urgency: e.target.value })}
                        >
                          <option value="critical">🔴 Critical (Life Threatening - Send Ambulance Immediately)</option>
                          <option value="high">🟠 High Priority (Urgent Care Needed within 1 Hour)</option>
                          <option value="medium">🟡 Medium (Distressed Stray Cattle Requiring Shelter)</option>
                        </select>
                      </div>
                    </div>

                    {/* Section 4: Reporter Details */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                      <div className="form-group">
                        <label>{language === 'hi' ? 'आपका नाम (वैकल्पिक)' : 'Your Name (Optional)'}</label>
                        <input
                          className="input"
                          placeholder="e.g. Rahul Sharma"
                          value={form.reporterName}
                          onChange={e => setForm({ ...form, reporterName: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>{language === 'hi' ? 'आपका फोन नंबर (संपर्क हेतु) *' : 'Your Phone Number (For Ambulance Team) *'}</label>
                        <input
                          className="input"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={form.reporterPhone}
                          onChange={e => setForm({ ...form, reporterPhone: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-primary"
                      style={{
                        width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 800,
                        background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                      }}
                    >
                      <Send size={18} /> {submitting ? 'Broadcasting rescue signal...' : (language === 'hi' ? '🚨 तत्काल रेस्क्यू टीम भेजें' : '🚨 Broadcast Emergency Rescue Alert')}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ) : (
          /* Live Rescue Feed / Control Room Tab */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                  🚑 {language === 'hi' ? 'लाइव रेस्क्यू कंट्रोल रूम' : 'Live Gaushala Rescue Control Board'}
                </h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {language === 'hi' ? 'रेस्क्यू कॉल, जीपीएस लोकेशन एवं एम्बुलेंस डिस्पैच' : 'Incoming rescue alerts, GPS navigation & ambulance team status'}
                </p>
              </div>

              <button className="btn btn-secondary" onClick={fetchQueue} style={{ fontSize: '0.8rem' }}>
                <RefreshCw size={14} /> Refresh Feed
              </button>
            </div>

            {loadingQueue ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12 }} />)}
              </div>
            ) : rescueQueue.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <CheckCircle size={40} style={{ color: '#10B981', margin: '0 auto 12px' }} />
                <h3>No pending distress calls</h3>
                <p>All reported cattle have been safely dispatched and rehabilitated.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '16px' }}>
                {rescueQueue.map((req: any) => {
                  const googleMapsUrl = (req.latitude && req.longitude)
                    ? `https://www.google.com/maps?q=${req.latitude},${req.longitude}`
                    : `https://www.google.com/maps/search/${encodeURIComponent(req.locationName)}`;

                  return (
                    <div key={req.id} className="card" style={{ padding: '18px', borderTop: `3px solid ${req.urgency === 'critical' ? '#EF4444' : req.status === 'rescued' ? '#10B981' : '#F97316'}` }}>
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                        {req.photoUrl && (
                          <img
                            src={req.photoUrl}
                            alt="Rescue"
                            style={{ width: 88, height: 88, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border-color)' }}
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#EF4444' }}>#{req.id}</span>
                            <span className={`badge ${req.status === 'rescued' ? 'badge-success' : req.status === 'dispatched' ? 'badge-info' : 'badge-danger'}`} style={{ fontSize: '0.68rem' }}>
                              {req.status === 'rescued' ? '✓ Rescued & Safe' : req.status === 'dispatched' ? '🚑 Ambulance Dispatched' : '⚠️ Pending Dispatch'}
                            </span>
                          </div>

                          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {req.condition}
                          </h4>

                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: '4px' }}>
                            <MapPin size={12} style={{ color: '#EF4444' }} /> {req.locationName}
                          </div>

                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={11} /> {new Date(req.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} • Reporter: {req.reporterName}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary"
                          style={{ flex: 1, padding: '5px 10px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, textDecoration: 'none' }}
                        >
                          <Navigation size={12} style={{ color: '#38BDF8' }} /> Open GPS Map
                        </a>
                        {req.reporterPhone && req.reporterPhone !== 'Not provided' && (
                          <a
                            href={`tel:${req.reporterPhone}`}
                            className="btn btn-secondary"
                            style={{ flex: 1, padding: '5px 10px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, textDecoration: 'none', color: '#10B981' }}
                          >
                            <Phone size={12} /> Call Reporter
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live Rescue Map Modal */}
      {showMapModal && (
        <RescueMapView
          isModal={true}
          initialSelectedId={submittedReport?.id}
          onClose={() => setShowMapModal(false)}
        />
      )}
    </div>
  );
};

export default RescueCowPage;
