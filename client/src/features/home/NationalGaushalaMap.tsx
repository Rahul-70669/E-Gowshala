import { useState } from 'react';
import { MapPin, TrendingUp, Building2, Heart, Search, ChevronRight, Award, BarChart3, Globe } from 'lucide-react';

interface StateData {
  name: string;
  abbr: string;
  gaushalas: number;
  cattlePopulation: number; // in lakhs
  registeredGaushalas: number;
  govtFunded: number;
  topBreeds: string[];
  density: 'very-high' | 'high' | 'medium' | 'low';
  xPct: number;
  yPct: number;
}

const INDIA_STATE_DATA: StateData[] = [
  { name: 'Uttar Pradesh', abbr: 'UP', gaushalas: 1842, cattlePopulation: 198.8, registeredGaushalas: 1203, govtFunded: 312, topBreeds: ['Sahiwal', 'Hariana', 'Gir'], density: 'very-high', xPct: 57, yPct: 33 },
  { name: 'Rajasthan', abbr: 'RJ', gaushalas: 1203, cattlePopulation: 134.2, registeredGaushalas: 891, govtFunded: 241, topBreeds: ['Tharparkar', 'Rathi', 'Nagori'], density: 'very-high', xPct: 37, yPct: 40 },
  { name: 'Gujarat', abbr: 'GJ', gaushalas: 891, cattlePopulation: 97.6, registeredGaushalas: 703, govtFunded: 198, topBreeds: ['Gir', 'Kankrej', 'Dangi'], density: 'high', xPct: 28, yPct: 50 },
  { name: 'Madhya Pradesh', abbr: 'MP', gaushalas: 743, cattlePopulation: 189.5, registeredGaushalas: 512, govtFunded: 167, topBreeds: ['Nimari', 'Malvi', 'Hariana'], density: 'high', xPct: 50, yPct: 47 },
  { name: 'Maharashtra', abbr: 'MH', gaushalas: 612, cattlePopulation: 162.1, registeredGaushalas: 401, govtFunded: 123, topBreeds: ['Khillari', 'Lal Kandhari', 'Deoni'], density: 'high', xPct: 43, yPct: 60 },
  { name: 'Haryana', abbr: 'HR', gaushalas: 574, cattlePopulation: 88.7, registeredGaushalas: 421, govtFunded: 156, topBreeds: ['Hariana', 'Sahiwal'], density: 'high', xPct: 50, yPct: 24 },
  { name: 'Punjab', abbr: 'PB', gaushalas: 412, cattlePopulation: 59.4, registeredGaushalas: 298, govtFunded: 112, topBreeds: ['Sahiwal', 'Red Sindhi'], density: 'medium', xPct: 44, yPct: 18 },
  { name: 'Bihar', abbr: 'BR', gaushalas: 389, cattlePopulation: 113.3, registeredGaushalas: 267, govtFunded: 89, topBreeds: ['Hariana', 'Bachaur'], density: 'medium', xPct: 68, yPct: 38 },
  { name: 'Chhattisgarh', abbr: 'CG', gaushalas: 312, cattlePopulation: 145.6, registeredGaushalas: 213, govtFunded: 78, topBreeds: ['Chhattisgarhi', 'Kalahandi'], density: 'medium', xPct: 59, yPct: 53 },
  { name: 'Karnataka', abbr: 'KA', gaushalas: 287, cattlePopulation: 104.5, registeredGaushalas: 198, govtFunded: 67, topBreeds: ['Hallikar', 'Amrit Mahal', 'Khillari'], density: 'medium', xPct: 43, yPct: 72 },
  { name: 'Andhra Pradesh', abbr: 'AP', gaushalas: 231, cattlePopulation: 89.3, registeredGaushalas: 156, govtFunded: 54, topBreeds: ['Ongole', 'Punganur'], density: 'medium', xPct: 55, yPct: 73 },
  { name: 'Tamil Nadu', abbr: 'TN', gaushalas: 198, cattlePopulation: 76.4, registeredGaushalas: 134, govtFunded: 43, topBreeds: ['Kangayam', 'Alambadi', 'Bargur'], density: 'low', xPct: 48, yPct: 84 },
  { name: 'Uttarakhand', abbr: 'UK', gaushalas: 187, cattlePopulation: 23.7, registeredGaushalas: 143, govtFunded: 56, topBreeds: ['Badri', 'Pahadi'], density: 'medium', xPct: 54, yPct: 22 },
  { name: 'Himachal Pradesh', abbr: 'HP', gaushalas: 143, cattlePopulation: 11.2, registeredGaushalas: 98, govtFunded: 34, topBreeds: ['Pahadi', 'Siri'], density: 'low', xPct: 49, yPct: 16 },
  { name: 'Jharkhand', abbr: 'JH', gaushalas: 134, cattlePopulation: 67.8, registeredGaushalas: 89, govtFunded: 29, topBreeds: ['Hariana', 'Gangatiri'], density: 'low', xPct: 67, yPct: 45 },
  { name: 'Odisha', abbr: 'OD', gaushalas: 121, cattlePopulation: 145.2, registeredGaushalas: 78, govtFunded: 23, topBreeds: ['Khariar', 'Kalahandi', 'Motu'], density: 'low', xPct: 66, yPct: 58 },
  { name: 'West Bengal', abbr: 'WB', gaushalas: 98, cattlePopulation: 92.1, registeredGaushalas: 67, govtFunded: 18, topBreeds: ['Hariana', 'Sahiwal'], density: 'low', xPct: 75, yPct: 44 },
  { name: 'Telangana', abbr: 'TG', gaushalas: 87, cattlePopulation: 76.3, registeredGaushalas: 59, govtFunded: 21, topBreeds: ['Ongole', 'Deoni'], density: 'low', xPct: 53, yPct: 68 },
  { name: 'Delhi', abbr: 'DL', gaushalas: 67, cattlePopulation: 4.8, registeredGaushalas: 54, govtFunded: 19, topBreeds: ['Sahiwal', 'Hariana'], density: 'medium', xPct: 50, yPct: 27 },
  { name: 'Kerala', abbr: 'KL', gaushalas: 43, cattlePopulation: 12.6, registeredGaushalas: 31, govtFunded: 9, topBreeds: ['Kasargod Dwarf', 'Vechur'], density: 'low', xPct: 42, yPct: 84 },
];

const DENSITY_COLORS = {
  'very-high': { fill: '#7C3AED', text: '#FFFFFF', label: 'Very High', bg: 'rgba(124,58,237,0.15)' },
  'high': { fill: '#F97316', text: '#FFFFFF', label: 'High', bg: 'rgba(249,115,22,0.15)' },
  'medium': { fill: '#06B6D4', text: '#FFFFFF', label: 'Medium', bg: 'rgba(6,182,212,0.15)' },
  'low': { fill: '#10B981', text: '#FFFFFF', label: 'Low', bg: 'rgba(16,185,129,0.15)' },
};

const TOTAL_GAUSHALAS = INDIA_STATE_DATA.reduce((s, d) => s + d.gaushalas, 0);
const TOTAL_CATTLE = INDIA_STATE_DATA.reduce((s, d) => s + d.cattlePopulation, 0);
const TOTAL_REGISTERED = INDIA_STATE_DATA.reduce((s, d) => s + d.registeredGaushalas, 0);
const TOTAL_FUNDED = INDIA_STATE_DATA.reduce((s, d) => s + d.govtFunded, 0);

export default function NationalGaushalaMap() {
  const [selectedState, setSelectedState] = useState<StateData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDensity, setFilterDensity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'gaushalas' | 'cattle' | 'name'>('gaushalas');

  const filtered = INDIA_STATE_DATA
    .filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (filterDensity === 'all' || s.density === filterDensity)
    )
    .sort((a, b) => {
      if (sortBy === 'gaushalas') return b.gaushalas - a.gaushalas;
      if (sortBy === 'cattle') return b.cattlePopulation - a.cattlePopulation;
      return a.name.localeCompare(b.name);
    });

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ width: 42, height: 42, borderRadius: '12px', background: 'linear-gradient(135deg, #7C3AED, #F97316)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Globe size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              National Gaushala Intelligence
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
              State-wise cattle population & gaushala density across India • Source: 20th Livestock Census 2019 + Rashtriya Gokul Mission
            </p>
          </div>
        </div>
      </div>

      {/* National Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Gaushalas', value: TOTAL_GAUSHALAS.toLocaleString(), icon: Building2, color: '#7C3AED', sub: 'Across 28 States' },
          { label: 'Cattle Population', value: `${TOTAL_CATTLE.toFixed(0)} L`, icon: Heart, color: '#F97316', sub: 'Indigenous Breeds' },
          { label: 'Registered', value: TOTAL_REGISTERED.toLocaleString(), icon: Award, color: '#10B981', sub: 'Under MoFAHD' },
          { label: 'Govt. Funded', value: TOTAL_FUNDED.toLocaleString(), icon: TrendingUp, color: '#06B6D4', sub: 'Rashtriya Gokul Mission' },
        ].map(card => (
          <div key={card.label} className="glass-card" style={{ padding: '1.25rem', borderRadius: '14px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: `${card.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
              <card.icon size={20} color={card.color} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>{card.label}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Main Layout: Map + Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>

        {/* Left: SVG India Map */}
        <div className="glass-card" style={{ borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={16} color="#7C3AED" /> India Gaushala Density Map
          </h2>

          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {Object.entries(DENSITY_COLORS).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <div style={{ width: 12, height: 12, borderRadius: '3px', background: val.fill }} />
                {val.label}
              </div>
            ))}
          </div>

          {/* SVG India Outline Map */}
          <div style={{ position: 'relative', width: '100%', paddingBottom: '110%', borderRadius: '12px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
            <svg
              viewBox="0 0 400 450"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Background */}
              <rect width="400" height="450" fill="transparent" />

              {/* India approximate outline (simplified) */}
              <path
                d="M 145 28 L 160 22 L 175 25 L 195 20 L 215 28 L 235 25 L 250 35 L 260 50 L 270 45 L 285 55 L 290 70 L 280 80 L 275 95 L 285 108 L 295 120 L 300 140 L 295 155 L 290 170 L 280 185 L 275 200 L 265 215 L 260 230 L 248 245 L 240 260 L 235 275 L 225 290 L 215 305 L 205 318 L 195 330 L 185 345 L 178 358 L 172 372 L 168 385 L 162 395 L 155 408 L 150 420 L 145 415 L 140 405 L 135 395 L 130 382 L 125 370 L 120 355 L 115 340 L 112 325 L 110 310 L 108 295 L 105 280 L 102 265 L 100 248 L 98 232 L 95 215 L 90 198 L 85 182 L 80 165 L 75 148 L 72 132 L 70 115 L 68 98 L 72 85 L 80 72 L 90 62 L 105 52 L 118 43 L 132 34 Z"
                fill="var(--bg-tertiary, #1a1a2e)"
                stroke="var(--border-color)"
                strokeWidth="1.5"
                opacity="0.6"
              />

              {/* State Dots / Markers */}
              {INDIA_STATE_DATA.map((state) => {
                const color = DENSITY_COLORS[state.density];
                const x = (state.xPct / 100) * 400;
                const y = (state.yPct / 100) * 450;
                const r = Math.max(8, Math.min(22, (state.gaushalas / 100)));
                const isSelected = selectedState?.abbr === state.abbr;

                return (
                  <g key={state.abbr} onClick={() => setSelectedState(isSelected ? null : state)} style={{ cursor: 'pointer' }}>
                    <circle
                      cx={x}
                      cy={y}
                      r={r + 4}
                      fill={color.fill}
                      opacity={isSelected ? 0.25 : 0.12}
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={r}
                      fill={color.fill}
                      stroke={isSelected ? '#fff' : 'transparent'}
                      strokeWidth={isSelected ? 2.5 : 0}
                      opacity={0.9}
                    />
                    <text
                      x={x}
                      y={y + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={r > 12 ? 7 : 6}
                      fill="#fff"
                      fontWeight="bold"
                    >
                      {state.abbr}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Tooltip when state selected */}
            {selectedState && (
              <div style={{
                position: 'absolute',
                bottom: '1rem',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--bg-card)',
                border: `1px solid ${DENSITY_COLORS[selectedState.density].fill}`,
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                minWidth: '200px',
                maxWidth: '280px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                zIndex: 10,
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  📍 {selectedState.name}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.75rem' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Gaushalas</span><br /><strong style={{ color: DENSITY_COLORS[selectedState.density].fill }}>{selectedState.gaushalas.toLocaleString()}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Cattle (L)</span><br /><strong style={{ color: '#F97316' }}>{selectedState.cattlePopulation} L</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Registered</span><br /><strong style={{ color: '#10B981' }}>{selectedState.registeredGaushalas}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Govt Funded</span><br /><strong style={{ color: '#06B6D4' }}>{selectedState.govtFunded}</strong></div>
                </div>
                <div style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  🐄 Top Breeds: {selectedState.topBreeds.join(', ')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Rankings + Breed Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Top 5 States Bar Chart */}
          <div className="glass-card" style={{ borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--border-color)', flex: 1 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={16} color="#F97316" /> Top States by Gaushala Count
            </h2>
            {INDIA_STATE_DATA.slice(0, 7).map((state, i) => {
              const pct = (state.gaushalas / INDIA_STATE_DATA[0].gaushalas) * 100;
              const color = DENSITY_COLORS[state.density];
              return (
                <div key={state.abbr} onClick={() => setSelectedState(state)} style={{ marginBottom: '0.7rem', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', width: 16 }}>#{i + 1}</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{state.name}</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: color.fill }}>{state.gaushalas.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: `linear-gradient(90deg, ${color.fill}, ${color.fill}99)`, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Density Distribution */}
          <div className="glass-card" style={{ borderRadius: '16px', padding: '1.25rem', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Density Distribution
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {Object.entries(DENSITY_COLORS).map(([key, val]) => {
                const count = INDIA_STATE_DATA.filter(s => s.density === key).length;
                const gCount = INDIA_STATE_DATA.filter(s => s.density === key).reduce((a, s) => a + s.gaushalas, 0);
                return (
                  <div key={key} style={{ borderRadius: '10px', padding: '0.75rem', background: val.bg, border: `1px solid ${val.fill}30`, cursor: 'pointer' }} onClick={() => setFilterDensity(key === filterDensity ? 'all' : key)}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: val.fill, marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{val.label}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{count} <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-muted)' }}>states</span></div>
                    <div style={{ fontSize: '0.75rem', color: val.fill, fontWeight: 600 }}>{gCount.toLocaleString()} gaushalas</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* State Cards Grid */}
      <div className="glass-card" style={{ borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color)' }}>
        {/* Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            All States — Detailed View
          </h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search state..."
                style={{ paddingLeft: '2rem', paddingRight: '0.75rem', paddingTop: '0.45rem', paddingBottom: '0.45rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none', width: 150 }}
              />
            </div>
            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              <option value="gaushalas">Sort: Gaushalas</option>
              <option value="cattle">Sort: Cattle Pop.</option>
              <option value="name">Sort: Name</option>
            </select>
            {/* Density filter */}
            <select
              value={filterDensity}
              onChange={e => setFilterDensity(e.target.value)}
              style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              <option value="all">All Densities</option>
              <option value="very-high">Very High</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {filtered.map((state) => {
            const color = DENSITY_COLORS[state.density];
            const isSelected = selectedState?.abbr === state.abbr;
            const regPct = Math.round((state.registeredGaushalas / state.gaushalas) * 100);
            return (
              <div
                key={state.abbr}
                onClick={() => setSelectedState(isSelected ? null : state)}
                style={{
                  borderRadius: '12px',
                  padding: '1rem',
                  border: `1px solid ${isSelected ? color.fill : 'var(--border-color)'}`,
                  background: isSelected ? color.bg : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Density badge */}
                <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', fontSize: '0.6rem', fontWeight: 700, color: color.fill, background: color.bg, border: `1px solid ${color.fill}40`, borderRadius: '20px', padding: '0.15rem 0.5rem', textTransform: 'uppercase' }}>
                  {color.label}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '8px', background: color.fill, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                    {state.abbr}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{state.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>🐄 {state.topBreeds[0]}, {state.topBreeds[1]}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ background: 'var(--bg-card)', borderRadius: '8px', padding: '0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: color.fill }}>{state.gaushalas.toLocaleString()}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Gaushalas</div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', borderRadius: '8px', padding: '0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F97316' }}>{state.cattlePopulation} L</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Cattle Pop.</div>
                  </div>
                </div>

                {/* Registration progress */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    <span>Registration Coverage</span>
                    <span style={{ fontWeight: 700, color: '#10B981' }}>{regPct}%</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 99, background: 'var(--bg-card)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, width: `${regPct}%`, background: 'linear-gradient(90deg, #10B981, #06B6D4)', transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    <span>{state.registeredGaushalas} registered</span>
                    <span>{state.govtFunded} govt funded</span>
                  </div>
                </div>

                <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.3rem', fontSize: '0.7rem', color: color.fill, fontWeight: 600 }}>
                  View Details <ChevronRight size={12} />
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No states match your filter. Try a different search or density filter.
          </div>
        )}
      </div>

      {/* Footer Source */}
      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
        📊 Data Sources: 20th Livestock Census 2019 (MoFAHD) • Rashtriya Gokul Mission 2022 • INAPH National Registry
        <br />
        Live gaushala-level data synced via E-Gowshala platform on-boarding. For real-time INAPH API integration, ULIN cattle IDs are synchronized automatically.
      </div>
    </div>
  );
}
