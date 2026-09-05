import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapPin, ShieldCheck, Heart, AlertTriangle, Sparkles, X, Activity, Calendar, Compass, Navigation, ArrowLeft } from 'lucide-react';
import { CowIcon } from '../../components/common/CowIcon';
import { useThemeStore } from '../../store/themeStore';

const API = import.meta.env.VITE_API_URL || '/api';

export interface RescueMission {
  id: string;
  name: string;
  breed: string;
  state: string;
  city: string;
  lat: number;
  lng: number;
  xPct: number; // Percentage on SVG map (X: 10% - 90%)
  yPct: number; // Percentage on SVG map (Y: 10% - 90%)
  rescueDate: string;
  condition: string;
  status: string;
  healthStatus: string;
  story: string;
  rescuedBy: string;
  currentShed: string;
}

const FALLBACK_MISSIONS: RescueMission[] = [
  {
    id: 'RSC-GJ-01',
    name: 'Gauri (Cow #CW-002)',
    breed: 'Gir',
    state: 'Gujarat',
    city: 'Rajkot Highway',
    lat: 22.3039,
    lng: 70.8022,
    xPct: 24,
    yPct: 52,
    rescueDate: '2025-11-14',
    condition: 'Critical dehydration & leg laceration',
    status: 'Fully Rehabilitated & Lactating',
    healthStatus: 'healthy',
    story: 'Found abandoned near National Highway 27 after vehicle collision. Our mobile ambulance arrived in 35 minutes.',
    rescuedBy: 'Rajkot Animal Welfare Taskforce',
    currentShed: 'Shed A (Gir Heritage Enclosure)',
  },
  {
    id: 'RSC-RJ-02',
    name: 'Surabhi (Cow #CW-007)',
    breed: 'Tharparkar',
    state: 'Rajasthan',
    city: 'Jaipur Bypass',
    lat: 26.9124,
    lng: 75.7873,
    xPct: 35,
    yPct: 36,
    rescueDate: '2025-12-03',
    condition: 'Severe malnutrition and hoof infection',
    status: 'Healthy & Mother of Calf',
    healthStatus: 'healthy',
    story: 'Rescued during winter frost from an unlicensed cattle market. Has since given birth to a healthy calf.',
    rescuedBy: 'Jaipur Gaushala Seva Dal',
    currentShed: 'Shed B (Maternity Care)',
  },
  {
    id: 'RSC-HR-03',
    name: 'Kapila (Cow #CW-011)',
    breed: 'Hariana',
    state: 'Haryana',
    city: 'Karnal Corridor',
    lat: 29.6857,
    lng: 76.9905,
    xPct: 40,
    yPct: 23,
    rescueDate: '2026-01-18',
    condition: 'Respiratory distress & eye infection',
    status: 'Under Care & Gaining Weight',
    healthStatus: 'healthy',
    story: 'Rescued by village volunteers during seasonal smog. Treated with antibiotics and nebulizer support.',
    rescuedBy: 'Karnal Rural Youth Group',
    currentShed: 'Shed C (Recovery Ward)',
  },
  {
    id: 'RSC-UP-04',
    name: 'Gopika (Cow #CW-015)',
    breed: 'Sahiwal',
    state: 'Uttar Pradesh',
    city: 'Mathura Pilgrim Route',
    lat: 27.4924,
    lng: 77.6737,
    xPct: 48,
    yPct: 35,
    rescueDate: '2026-02-09',
    condition: 'Plastic ingestion & ruminal bloat',
    status: 'Post-Surgery Healthy',
    healthStatus: 'healthy',
    story: 'Successfully underwent rumenotomy to remove 18kg of plastic waste. Today active and grazing happily.',
    rescuedBy: 'Braj Gopala Rescue Mission',
    currentShed: 'Shed A (Gir & Sahiwal Main)',
  },
  {
    id: 'RSC-MH-05',
    name: 'Bhavani (Cow #CW-018)',
    breed: 'Dangi',
    state: 'Maharashtra',
    city: 'Pune Expressway',
    lat: 18.5204,
    lng: 73.8567,
    xPct: 36,
    yPct: 62,
    rescueDate: '2026-02-22',
    condition: 'Exhaustion & horn fracture',
    status: 'Healed & Living in Open Pasture',
    healthStatus: 'healthy',
    story: 'Found collapsed by motorists on Mumbai-Pune expressway. Treated with emergency IV fluids and orthopedic stabilization.',
    rescuedBy: 'Maharashtra Gauseva Samiti',
    currentShed: 'Shed B (Recovery & Calving)',
  },
  {
    id: 'RSC-MP-06',
    name: 'Nandini (Cow #CW-020)',
    breed: 'Malvi',
    state: 'Madhya Pradesh',
    city: 'Ujjain Riverside',
    lat: 23.1765,
    lng: 75.7885,
    xPct: 44,
    yPct: 47,
    rescueDate: '2026-02-28',
    condition: 'Skin lesions & tick fever',
    status: 'Under Anti-parasitic Protocol',
    healthStatus: 'healthy',
    story: 'Treated with Diminazene and organic neem washes. Full recovery monitored via MobileNetV2 AI scanning.',
    rescuedBy: 'Shipra River Animal Care Trust',
    currentShed: 'Shed C (Ayurvedic Healing Wing)',
  },
];

export const RescueMapView = ({
  isModal = false,
  onClose,
  initialSelectedId,
}: {
  isModal?: boolean;
  onClose?: () => void;
  initialSelectedId?: string;
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeSelectedId = initialSelectedId || searchParams.get('selectedId');
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [missions, setMissions] = useState<RescueMission[]>(FALLBACK_MISSIONS);
  const [selected, setSelected] = useState<RescueMission>(FALLBACK_MISSIONS[0]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMissions = () => {
    setRefreshing(true);
    fetch(`${API}/public/rescue-map`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data?.locations?.length) {
          const locs = res.data.locations;
          setMissions(locs);
          if (activeSelectedId) {
            const found = locs.find((l: any) => l.id === activeSelectedId);
            if (found) {
              setSelected(found);
              return;
            }
          }
          setSelected((prev) =>
            locs.find((l: any) => l.id === prev?.id) ||
            locs.find((l: any) => (l as any).isLiveReport) ||
            locs[0]
          );
        }
      })
      .catch(() => {})
      .finally(() => setRefreshing(false));
  };

  useEffect(() => {
    fetchMissions();
    // Poll every 12 seconds so new citizen reports appear in real time
    const interval = setInterval(fetchMissions, 12000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeSelectedId && missions.length > 0) {
      const found = missions.find((m: any) => m.id === activeSelectedId);
      if (found) setSelected(found);
    }
  }, [activeSelectedId, missions]);

  const handleDispatchAction = async (missionId: string) => {
    try {
      await fetch(`${API}/public/rescue-requests/${missionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dispatched', dispatchedTo: 'Gaushala Ambulance Unit 1' }),
      });
      fetchMissions();
    } catch (e) {
      console.error('Dispatch error:', e);
    }
  };

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, background: 'rgba(249,115,22,0.15)', color: '#F97316', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '99px', padding: '3px 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🇮🇳 NATIONAL NETWORK
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {missions.filter((m: any) => m.isLiveReport).length > 0 && (
                <strong style={{ color: '#EF4444', marginRight: 8 }}>
                  🚨 {missions.filter((m: any) => m.isLiveReport).length} Live Incident{missions.filter((m: any) => m.isLiveReport).length > 1 ? 's' : ''}
                </strong>
              )}
              {missions.length} Total Telemetry Pins
            </span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '6px 0 0', color: 'var(--text-primary)' }}>
            Live Cattle Rescue &amp; Rehabilitation Map
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!isModal && (
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
          )}
          <button
            onClick={fetchMissions}
            disabled={refreshing}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Activity size={14} className={refreshing ? 'spinning' : ''} /> {refreshing ? 'Syncing...' : 'Sync Live Telemetry'}
          </button>
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              <X size={16} /> Close
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Map on left, Details on right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', alignItems: 'start' }}>
        {/* India Map Canvas Container */}
        <div
          style={{
            position: 'relative',
            background: isDark ? 'linear-gradient(135deg, #131722, #0D0F16)' : 'linear-gradient(135deg, #F8FAFC, #EEF2F6)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            minHeight: '440px',
            overflow: 'hidden',
            boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.35)' : '0 4px 20px rgba(0,0,0,0.06)',
          }}
        >
          {/* Subtle grid background */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: isDark ? 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)' : 'radial-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              opacity: 0.7,
              pointerEvents: 'none',
            }}
          />

          {/* Compass Rose */}
          <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700 }}>
            <Compass size={16} /> NORTH
          </div>

          {/* Map Heading Overlay */}
          <div style={{ position: 'absolute', bottom: 16, left: 16, color: 'var(--text-muted)', fontSize: '0.72rem' }}>
            Click pins to inspect rescue logs &amp; clinical progress
          </div>

          {/* SVG Map of India (Stylized Geographic Vector) */}
          <svg
            viewBox="0 0 500 560"
            style={{ width: '100%', height: '420px', filter: 'drop-shadow(0 0 24px rgba(249,115,22,0.15))' }}
          >
            <defs>
              <linearGradient id="indiaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={isDark ? '#1C222E' : '#E2E8F0'} stopOpacity="0.95" />
                <stop offset="100%" stopColor={isDark ? '#10141C' : '#CBD5E1'} stopOpacity="0.95" />
              </linearGradient>
              <radialGradient id="pinGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F97316" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="liveAlertGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Stylized Accurate India Contour Path */}
            <path
              d="M 180 40 
                 L 220 25 L 245 45 L 260 70 L 255 100 L 290 120 L 330 110 L 360 140 
                 L 410 145 L 435 170 L 415 190 L 375 190 L 360 215 L 340 240 L 370 260 
                 L 380 290 L 350 310 L 330 350 L 300 390 L 275 430 L 255 490 L 245 530 
                 L 230 490 L 210 440 L 195 390 L 180 340 L 165 300 L 145 285 L 120 270 
                 L 90 280 L 70 260 L 95 230 L 120 210 L 130 170 L 150 140 L 170 100 Z"
              fill="url(#indiaGrad)"
              stroke="#F97316"
              strokeWidth="2"
              strokeDasharray="4 2"
            />

            {/* Major State Division Lines (Visual depth) */}
            <path d="M 120 270 Q 180 290 250 280" stroke={isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"} strokeWidth="1.2" fill="none" />
            <path d="M 180 160 Q 240 210 320 220" stroke={isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"} strokeWidth="1.2" fill="none" />
            <path d="M 195 390 Q 240 370 300 390" stroke={isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"} strokeWidth="1.2" fill="none" />

            {/* Interactive Pins */}
            {missions.map((m) => {
              const isSel = selected?.id === m.id;
              const isLive = (m as any).isLiveReport || m.id.startsWith('RSC-REQ');
              // Translate percentage coordinates to SVG viewBox (500x560)
              const cx = (m.xPct / 100) * 500;
              const cy = (m.yPct / 100) * 560;

              return (
                <g
                  key={m.id}
                  onClick={() => setSelected(m)}
                  style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}
                >
                  {/* Outer Pulsing Wave */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSel ? 24 : isLive ? 20 : 16}
                    fill={isLive ? "url(#liveAlertGlow)" : "url(#pinGlow)"}
                    style={{ animation: isLive ? 'notifPulse 1.2s infinite' : 'notifPulse 2.2s infinite' }}
                  />
                  {/* Pin Base Circle */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSel ? 9 : 6}
                    fill={isLive ? '#EF4444' : isSel ? '#F97316' : '#38BDF8'}
                    stroke="white"
                    strokeWidth="2"
                  />
                  {/* Pin Label on Hover/Selected */}
                  {isSel && (
                    <g>
                      <rect
                        x={cx - 50}
                        y={cy - 34}
                        width="100"
                        height="22"
                        rx="6"
                        fill={isDark ? "#12151C" : "#FFFFFF"}
                        stroke={isLive ? "#EF4444" : "#F97316"}
                        strokeWidth="1.5"
                      />
                      <text
                        x={cx}
                        y={cy - 19}
                        textAnchor="middle"
                        fill={isDark ? "#FFFFFF" : "#0F172A"}
                        fontSize="10"
                        fontWeight="bold"
                      >
                        {m.city.substring(0, 16)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Mission Narrative Dossier Panel */}
        {selected && (
          <div
            className="card"
            style={{
              padding: '24px',
              borderTop: (selected as any).isLiveReport ? '4px solid #EF4444' : '4px solid #F97316',
              background: 'var(--bg-card)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span className={`badge ${(selected as any).isLiveReport ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.7rem', marginBottom: '6px' }}>
                  {(selected as any).isLiveReport ? '🚨 LIVE RESCUE CITIZEN CALLOUT' : `Mission ${selected.id}`}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {selected.name}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} style={{ color: (selected as any).isLiveReport ? '#EF4444' : '#F97316' }} />
                  {selected.city}, {selected.state}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className={`badge ${(selected as any).isLiveReport ? 'badge-danger' : 'badge-success'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={12} /> {selected.status}
                </span>
              </div>
            </div>

            {/* Key Dossier Attributes */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                background: 'var(--bg-card-inner)',
                padding: '14px',
                borderRadius: '12px',
                marginBottom: '16px',
                border: '1px solid var(--border-color)',
                fontSize: '0.8rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Indigenous Breed</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selected.breed}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Report Date</span>
                <strong style={{ color: 'var(--text-primary)' }}>
                  {new Date(selected.rescueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </strong>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Reported Condition</span>
                <span style={{ color: '#EF4444', fontWeight: 700 }}>⚠️ {selected.condition}</span>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Dispatch / Shelter Target</span>
                <strong style={{ color: '#10B981' }}>🏡 {selected.currentShed}</strong>
              </div>
            </div>

            {/* Rescue Narrative / Caller Details */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Field Dispatch Telemetry
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0, fontStyle: 'italic', background: 'rgba(249,115,22,0.05)', padding: '12px', borderRadius: '8px', borderLeft: (selected as any).isLiveReport ? '3px solid #EF4444' : '3px solid #F97316' }}>
                "{selected.story}"
              </p>
            </div>

            {/* Taskforce team & Dispatch Action */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '10px' }}>
              <span>Assigned: <strong>{selected.rescuedBy}</strong></span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selected.lat},${selected.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Navigation size={14} /> Open in Google Maps
                </a>
                {(selected as any).isLiveReport && selected.status !== 'Ambulance Dispatched' && (
                  <button
                    className="btn btn-primary"
                    style={{ background: '#DC2626', borderColor: '#DC2626', padding: '6px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => handleDispatchAction(selected.id)}
                  >
                    🚑 Dispatch Emergency Ambulance
                  </button>
                )}
              </div>
            </div>
            
            {/* Quick selector buttons of other missions */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700 }}>
                SELECT RESCUE MISSION:
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {missions.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelected(m)}
                    className={`btn ${selected.id === m.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                  >
                    {m.city} ({m.breed})
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          backdropFilter: 'blur(6px)',
        }}
        onClick={onClose}
      >
        <div
          className="card"
          style={{ maxWidth: '960px', width: '100%', maxHeight: '92vh', overflowY: 'auto', padding: '28px' }}
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>
      </div>
    );
  }

  return content;
};
export default RescueMapView;
