import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Upload, Camera, X, Image as ImageIcon } from 'lucide-react';
import apiClient from '../../lib/apiClient';

const BREEDS = [
  'Gir', 'Sahiwal', 'Tharparkar', 'Kankrej', 'Red Sindhi',
  'Rathi', 'Hariana', 'Ongole', 'Deoni', 'Hallikar',
  'Amrit Mahal', 'Kangayam', 'Vechur', 'Punganur', 'Crossbred', 'Unknown', 'Other',
];

const CowRegisterPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [sheds, setSheds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Photo upload state
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [form, setForm] = useState({
    name: '', inaphId: '', breed: 'Gir', gender: 'female' as 'female' | 'male' | 'calf',
    dateOfBirth: '', age: '', weight: '', color: '',
    status: 'healthy', shedId: '', identificationMarks: '', notes: '',
    rescueDate: '', rescueLocation: '', rescueCondition: '', rescuedBy: '',
  });

  useEffect(() => {
    apiClient.get('/cows/sheds/all').then((res) => setSheds(res.data.data)).catch(() => {});
  }, []);

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary via backend
    setUploadingPhoto(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await apiClient.post('/cows/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.data?.url) {
        setPhotoUrl(res.data.data.url);
      }
    } catch (err: any) {
      console.error('Photo upload failed:', err);
      // Fallback: keep local preview
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
    setPhotoPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const body: any = {
        name: form.name, breed: form.breed, gender: form.gender,
        color: form.color, status: form.status,
        identificationMarks: form.identificationMarks, notes: form.notes,
        photos: photoUrl ? [photoUrl] : photoPreview ? [photoPreview] : [],
      };
      if (form.inaphId) body.inaphId = form.inaphId;
      if (form.dateOfBirth) body.dateOfBirth = form.dateOfBirth;
      if (form.age) body.age = parseInt(form.age);
      if (form.weight) body.weight = parseFloat(form.weight);
      if (form.shedId) body.shedId = form.shedId;
      if (form.rescueDate) {
        body.rescueDetails = {
          rescueDate: form.rescueDate, location: form.rescueLocation,
          condition: form.rescueCondition, rescuedBy: form.rescuedBy,
        };
      }

      const res = await apiClient.post('/cows', body);
      setSuccess(`✅ ${res.data.data.name} registered with Tag ID: ${res.data.data.tagId}`);
      setTimeout(() => navigate(`/dashboard/cows/${res.data.data._id}`), 1800);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register cow');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => navigate('/dashboard/cows')}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Register New Cow</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Fill in details and upload profile photo to register cattle</p>
        </div>
      </div>

      {error && <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171', fontSize: '0.85rem' }}>{error}</div>}
      {success && <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '16px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ADE80', fontSize: '0.85rem' }}>{success}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '20px' }}>
          
          {/* Column 1: Basic Info & Photo */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--color-primary)' }}>📋 Basic Information & Photo</h3>
            
            {/* Photo Upload Box */}
            <div className="form-group">
              <label>Cattle Profile Photo</label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
              />
              
              {photoPreview ? (
                <div style={{ position: 'relative', width: '100%', height: '180px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-card-inner)' }}>
                  <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {uploadingPhoto && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8125rem', gap: '8px' }}>
                      <span className="spinner" style={{ width: '18px', height: '18px' }} /> Uploading to Cloudinary...
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', border: 'none', color: 'white', borderRadius: '50%', padding: '4px', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--border-color)', borderRadius: '10px',
                    padding: '24px', textAlign: 'center', cursor: 'pointer',
                    background: 'var(--bg-card-inner)', transition: 'border-color 0.2s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(249,115,22,0.15)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                    <Upload size={20} />
                  </div>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>Click to upload cow photo</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>JPG, PNG or WEBP (Cloudinary auto-hosted)</p>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Cattle Name *</label>
                <input className="input" placeholder="e.g., Lakshmi" value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>INAPH Livestock ULIN (12-Digit)</label>
                <input className="input" placeholder="e.g. GJ-09-2024-000142" value={form.inaphId} onChange={(e) => updateField('inaphId', e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Breed *</label>
                <select className="input" value={form.breed} onChange={(e) => updateField('breed', e.target.value)}>
                  {BREEDS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Gender *</label>
                <select className="input" value={form.gender} onChange={(e) => updateField('gender', e.target.value)}>
                  <option value="female">Female (Cow)</option>
                  <option value="male">Male (Bull)</option>
                  <option value="calf">Calf</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Date of Birth</label>
                <input type="date" className="input" value={form.dateOfBirth} onChange={(e) => updateField('dateOfBirth', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Age (years)</label>
                <input type="number" className="input" placeholder="e.g., 5" value={form.age} onChange={(e) => updateField('age', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Weight (kg)</label>
                <input type="number" className="input" placeholder="e.g., 350" value={form.weight} onChange={(e) => updateField('weight', e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Color</label>
                <input className="input" placeholder="e.g., Reddish Brown" value={form.color} onChange={(e) => updateField('color', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select className="input" value={form.status} onChange={(e) => updateField('status', e.target.value)}>
                  <option value="healthy">Healthy</option>
                  <option value="sick">Sick</option>
                  <option value="pregnant">Pregnant</option>
                  <option value="lactating">Lactating</option>
                  <option value="rescued">Rescued</option>
                </select>
              </div>
            </div>
          </div>

          {/* Column 2: Assignment & Rescue Details */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--color-primary)' }}>🏠 Housing & Medical Details</h3>
            
            <div className="form-group">
              <label>Assign Housing Shed</label>
              <select className="input" value={form.shedId} onChange={(e) => updateField('shedId', e.target.value)}>
                <option value="">No shed assigned</option>
                {sheds.map((s: any) => <option key={s._id} value={s._id}>{s.name} ({s.shedType || 'Standard'})</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Identification Marks</label>
              <textarea className="input" rows={2} placeholder="e.g., White patch on forehead, notched right ear..." value={form.identificationMarks} onChange={(e) => updateField('identificationMarks', e.target.value)} style={{ resize: 'vertical' }} />
            </div>

            <div className="form-group">
              <label>Caretaker Notes</label>
              <textarea className="input" rows={2} placeholder="Behavior, temperament, or dietary notes..." value={form.notes} onChange={(e) => updateField('notes', e.target.value)} style={{ resize: 'vertical' }} />
            </div>

            <h3 style={{ fontSize: '1rem', marginTop: '20px', marginBottom: '14px', color: 'var(--color-warning)' }}>🆘 Rescue Details (Optional)</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Rescue Date</label>
                <input type="date" className="input" value={form.rescueDate} onChange={(e) => updateField('rescueDate', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Rescued By</label>
                <input className="input" placeholder="Organization / Volunteer" value={form.rescuedBy} onChange={(e) => updateField('rescuedBy', e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label>Rescue Location</label>
              <input className="input" placeholder="e.g., Highway intersection, Sector 4" value={form.rescueLocation} onChange={(e) => updateField('rescueLocation', e.target.value)} />
            </div>

            <div className="form-group">
              <label>Condition at Rescue</label>
              <input className="input" placeholder="e.g., Malnourished, minor leg injury" value={form.rescueCondition} onChange={(e) => updateField('rescueCondition', e.target.value)} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard/cows')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading || uploadingPhoto} style={{ minWidth: '180px' }}>
            {loading ? <span className="spinner" /> : <Save size={18} />}
            {loading ? 'Registering...' : 'Register Cow'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CowRegisterPage;
