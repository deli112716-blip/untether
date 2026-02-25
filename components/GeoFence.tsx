
import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Shield, Navigation, Trash2, X, Save, Target, Radio, CheckCircle2 } from 'lucide-react';
import { Zone } from '../types';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon issue
// @ts-ignore
import iconUrl from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

function LocationMarker({ position, setPosition, radius }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void, radius: number }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <>
      <Marker position={position}></Marker>
      <Circle center={position} radius={radius} pathOptions={{ color: '#d8b4fe', fillColor: '#d8b4fe', fillOpacity: 0.2 }} />
    </>
  );
}

interface GeoFenceProps {
  zones: Zone[];
  setZones: React.Dispatch<React.SetStateAction<Zone[]>>;
}

export const GeoFence: React.FC<GeoFenceProps> = ({ zones, setZones }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isScanning, setIsScanning] = useState<string | null>(null);
  const [newZone, setNewZone] = useState({ name: '', radius: 100, address: '' });
  const [isLocating, setIsLocating] = useState(false);
  const [markerPos, setMarkerPos] = useState<L.LatLng | null>(null);

  // Parse existing address to LatLng if possible
  useEffect(() => {
    if (newZone.address.includes(',')) {
      const [lat, lng] = newZone.address.split(',').map(n => parseFloat(n.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        setMarkerPos(new L.LatLng(lat, lng));
      }
    }
  }, [newZone.address]);

  const handleMapClick = (latlng: L.LatLng) => {
    setMarkerPos(latlng);
    setNewZone(prev => ({ ...prev, address: `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}` }));
  };

  const toggleZone = (id: string) => {
    setZones(prev => prev.map(z => z.id === id ? { ...z, active: !z.active } : z));
  };

  const deleteZone = (id: string) => {
    setZones(prev => prev.filter(z => z.id !== id));
  };

  const simulateScan = (id: string) => {
    setIsScanning(id);
    setTimeout(() => setIsScanning(null), 3000);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const latlng = new L.LatLng(latitude, longitude);
        setMarkerPos(latlng);
        setNewZone(prev => ({ ...prev, address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` }));
        setIsLocating(false);
      },
      (error) => {
        console.error("Error detecting location:", error);
        alert("Unable to retrieve your location. Please ensure permissions are granted.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleAddZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZone.name.trim() || !newZone.address.includes(',')) {
      alert("Please provide a name and detect your location.");
      return;
    }

    const zone: Zone = {
      id: Date.now().toString(),
      name: newZone.name,
      address: newZone.address,
      radius: newZone.radius,
      active: true
    };

    setZones([zone, ...zones]);
    setIsAdding(false);
    setNewZone({ name: '', radius: 100, address: '' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 px-2 pb-20 pt-6">
      <div className="flex items-center justify-between pt-8 px-4">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-white italic uppercase">Jurisdictions</h2>
          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.5em] mt-2">Geographic Focus Enforcement</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="w-14 h-14 bg-white text-black rounded-[24px] flex items-center justify-center hover:bg-[var(--accent-primary)] hover:shadow-[0_0_20px_var(--accent-glow)] transition-all active:scale-90"
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-full max-w-sm opal-card p-10 rounded-[44px] border-white/10 space-y-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black tracking-tight italic">New Perimeter</h3>
              <button onClick={() => setIsAdding(false)} className="text-zinc-700 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddZone} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-2">Zone Identity</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newZone.name}
                    onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                    placeholder="e.g. Zen Garden"
                    required
                    autoFocus
                    className="flex-1 bg-black border border-white/5 rounded-[28px] px-6 py-5 text-white placeholder:text-zinc-800 focus:outline-none focus:border-[var(--accent-primary)] transition-all font-bold text-sm"
                  />
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={isLocating}
                    className={`w-14 h-14 rounded-[22px] flex items-center justify-center transition-all ${isLocating ? 'bg-zinc-900 text-zinc-700 animate-pulse' : 'bg-white/5 text-white hover:bg-white/10'}`}
                    title="Detect Current Location"
                  >
                    <Navigation size={20} className={isLocating ? 'animate-spin' : ''} />
                  </button>
                </div>
                <div className="h-48 w-full rounded-[24px] overflow-hidden border border-white/10 relative z-0">
                  <MapContainer
                    center={markerPos || [37.7749, -122.4194]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                    <LocationMarker position={markerPos} setPosition={handleMapClick} radius={newZone.radius} />
                  </MapContainer>
                </div>
                {newZone.address && (
                  <p className="text-[8px] font-black text-[var(--accent-primary)] uppercase tracking-widest ml-1 mt-2 flex items-center gap-1.5">
                    <CheckCircle2 size={10} /> Location Locked {newZone.address}
                  </p>
                )}
              </div>

              <div className="space-y-5">
                <div className="flex justify-between items-center px-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Suppression Radius</label>
                  <span className="text-sm font-black text-[var(--accent-primary)]">{newZone.radius}m</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="500"
                  step="10"
                  value={newZone.radius}
                  onChange={(e) => setNewZone({ ...newZone, radius: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-6 bg-white text-black rounded-[32px] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[var(--accent-primary)] hover:shadow-[0_0_30px_var(--accent-glow)] transition-all active:scale-95 shadow-xl"
              >
                <Save size={18} />
                ENFORCE BOUNDARY
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-600 ml-4">Managed Perimeters</h3>
        <div className="grid gap-6">
          {zones.map(zone => (
            <div key={zone.id} className="opal-card p-7 rounded-[40px] border-white/5 group relative overflow-hidden transition-all duration-700 hover:border-[var(--accent-primary)]/40">
              {isScanning === zone.id && (
                <div className="absolute inset-0 pointer-events-none bg-[var(--accent-primary)]/5 flex items-center justify-center animate-in fade-in zoom-in-50">
                  <div className="w-full h-full border-t-2 border-[var(--accent-primary)]/40 animate-scan-line"></div>
                </div>
              )}

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-all duration-[1s] ${zone.active ? 'bg-[var(--accent-glow)] text-[var(--accent-primary)] shadow-[0_0_30px_var(--accent-glow)]' : 'bg-zinc-900 text-zinc-800'}`}>
                    <MapPin size={28} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-black text-xl tracking-tight text-white">{zone.name}</h3>
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="flex items-center gap-2 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                        <Navigation size={10} /> {zone.address}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Target size={12} /> {zone.radius}m Radius</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[8px] ${zone.active ? 'text-[var(--accent-primary)] bg-[var(--accent-glow)] border border-[var(--accent-primary)]/10' : 'text-zinc-700 bg-zinc-950'}`}>
                          {zone.active ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <button
                    onClick={() => toggleZone(zone.id)}
                    className={`w-14 h-8 rounded-full relative transition-all duration-500 ease-[cubic-bezier(0.19, 1, 0.22, 1)] ${zone.active ? 'bg-[var(--accent-primary)]' : 'bg-zinc-800 shadow-inner'}`}
                  >
                    <div className={`absolute top-1.5 w-5 h-5 bg-white rounded-full transition-all duration-500 ${zone.active ? 'left-7.5 shadow-lg' : 'left-1.5'}`}></div>
                  </button>
                  <div className="flex items-center gap-2">
                    <button onClick={() => simulateScan(zone.id)} className="p-2 text-zinc-800 hover:text-[var(--accent-primary)] transition-colors">
                      <Radio size={16} />
                    </button>
                    <button onClick={() => deleteZone(zone.id)} className="p-2 text-zinc-800 hover:text-rose-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="opal-card p-12 rounded-[44px] border-white/5 bg-gradient-to-br from-zinc-950 to-transparent flex flex-col items-center text-center gap-6 py-14">
        <div className="w-20 h-20 bg-[var(--accent-glow)] rounded-[28px] flex items-center justify-center text-[var(--accent-primary)] shadow-[0_0_30px_var(--accent-glow)]">
          <Target size={36} strokeWidth={2.5} />
        </div>
        <div className="space-y-3">
          <h4 className="font-black text-base uppercase tracking-[0.3em] text-white italic">Signal Silencing</h4>
          <p className="text-[11px] text-zinc-600 font-bold px-8 leading-relaxed uppercase tracking-wider">
            When detected within these geographic boundaries, UnTether enforces your global app restriction policy automatically.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes scan-line {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scan-line {
          animation: scan-line 2s linear infinite;
        }
      `}</style>
    </div>
  );
};
