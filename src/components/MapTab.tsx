import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useGameStore } from '../store/useGameStore';
import { Map as MapIcon, Compass } from 'lucide-react';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a custom icon for Animon markers
const createCustomIcon = (imageUrl: string) => {
  return L.divIcon({
    className: 'custom-animon-marker',
    html: `
      <div style="
        width: 40px; 
        height: 40px; 
        border-radius: 50%; 
        border: 3px solid #fbbf24; 
        background-color: white;
        background-image: url(${imageUrl});
        background-size: cover;
        background-position: center;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      "></div>
      <div style="
        width: 0; 
        height: 0; 
        border-left: 6px solid transparent; 
        border-right: 6px solid transparent; 
        border-top: 8px solid #fbbf24;
        margin: 0 auto;
        margin-top: -2px;
      "></div>
    `,
    iconSize: [40, 48],
    iconAnchor: [20, 48],
    popupAnchor: [0, -48],
  });
};

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

export const MapTab: React.FC = () => {
  const { inventory } = useGameStore();
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentPosition([position.coords.latitude, position.coords.longitude]);
        },
        (_err) => {
          setError('Không thể lấy vị trí hiện tại của bạn.');
        },
        { enableHighAccuracy: true }
      );
    } else {
      setError('Trình duyệt của bạn không hỗ trợ định vị GPS.');
    }
  }, []);

  const animonsWithLocation = inventory.filter(a => a.latitude && a.longitude);
  const centerPosition = currentPosition || (animonsWithLocation.length > 0 ? [animonsWithLocation[0].latitude!, animonsWithLocation[0].longitude!] : [14.0583, 108.2772]); // Default to Vietnam

  return (
    <div className="w-full h-[calc(100vh-140px)] relative bg-stone-100 rounded-3xl overflow-hidden shadow-inner border-4 border-white">
      {/* Header overlay */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex justify-between items-start pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lg border-2 border-indigo-100 pointer-events-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-500">
            <MapIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-black text-stone-800 leading-tight">Bản đồ Săn thú</h2>
            <p className="text-xs font-bold text-stone-500">Đã phát hiện {animonsWithLocation.length} dấu chân</p>
          </div>
        </div>

        <button 
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => setCurrentPosition([pos.coords.latitude, pos.coords.longitude]),
                () => {},
                { enableHighAccuracy: true }
              );
            }
          }}
          className="bg-white/90 p-3 rounded-xl shadow-lg border-2 border-indigo-100 text-indigo-500 pointer-events-auto hover:bg-indigo-50 transition-colors"
        >
          <Compass className="w-6 h-6" />
        </button>
      </div>

      {error && (
        <div className="absolute bottom-6 left-6 right-6 z-[400] bg-rose-50 border-2 border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-medium shadow-lg">
          {error}
        </div>
      )}

      <MapContainer 
        center={centerPosition as [number, number]} 
        zoom={16} 
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        zoomControl={false}
      >
        <ChangeView center={centerPosition as [number, number]} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User Current Position */}
        {currentPosition && (
          <Marker position={currentPosition}>
            <Popup>
              <div className="font-bold text-center">Vị trí của bạn</div>
            </Popup>
          </Marker>
        )}

        {/* Animon Markers */}
        {animonsWithLocation.map((animon) => (
          <Marker 
            key={animon.id} 
            position={[animon.latitude!, animon.longitude!]}
            icon={createCustomIcon(animon.imageUrl)}
          >
            <Popup className="animon-popup">
              <div className="text-center p-1">
                <img src={animon.imageUrl} alt={animon.name} className="w-24 h-24 object-cover rounded-lg mb-2 shadow-sm border-2 border-amber-200 mx-auto" />
                <h3 className="font-black text-stone-800">{animon.name}</h3>
                <p className="text-xs text-stone-500 font-medium">Bắt lúc: {new Date(animon.createdAt).toLocaleDateString()}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
