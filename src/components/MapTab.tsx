import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useGameStore } from '../store/useGameStore';
import { Map as MapIcon, Compass } from 'lucide-react';
import { DECORATIONS } from '../constants/decorations';

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
    className: 'bg-transparent border-0',
    html: `
      <div class="w-12 h-12 rounded-full border-[3px] border-amber-400 bg-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] overflow-hidden relative" style="animation: float 3s ease-in-out infinite;">
        <div style="
          width: 100%; 
          height: 100%; 
          background-image: url(${imageUrl});
          background-size: cover;
          background-position: center;
        "></div>
        <style>
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0px); }
          }
        </style>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24],
  });
};

// Create a glowing dot for user location
const userLocationIcon = L.divIcon({
  className: 'bg-transparent border-0',
  html: `
    <div class="relative flex h-5 w-5">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" style="animation-duration: 2s;"></span>
      <span class="relative inline-flex rounded-full h-5 w-5 bg-blue-500 border-[3px] border-white shadow-[0_0_12px_rgba(59,130,246,0.8)]"></span>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}



export const MapTab: React.FC = () => {
  const { inventory, equippedMarker } = useGameStore();
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);

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

  const getCustomMarkerIcon = () => {
    const markerDef = DECORATIONS.find(d => d.id === equippedMarker);
    const styleClass = markerDef ? markerDef.styleClass : 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]';
    
    return L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          ${!markerDef ? '<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>' : ''}
          <span class="relative inline-flex rounded-full h-5 w-5 border-[3px] border-white ${styleClass}"></span>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10],
    });
  };

  return (
    <div className="w-full h-[calc(100vh-140px)] relative bg-stone-100 rounded-3xl overflow-hidden shadow-inner border-4 border-white">
      {/* Header overlay */}
      <div className="absolute top-4 left-4 right-4 z-40 flex justify-between items-start pointer-events-none">
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
          onClick={(e) => {
            e.stopPropagation();
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const latlng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                  setCurrentPosition(latlng);
                  if (map) map.flyTo(latlng, 18, { duration: 1.5 });
                },
                () => {
                  if (map && currentPosition) map.flyTo(currentPosition, 18, { duration: 1.5 });
                },
                { enableHighAccuracy: true }
              );
            } else if (map && currentPosition) {
              map.flyTo(currentPosition, 18, { duration: 1.5 });
            }
          }}
          className="bg-white/90 p-3 rounded-xl shadow-lg border-2 border-indigo-100 text-indigo-500 pointer-events-auto hover:bg-indigo-50 transition-colors cursor-pointer"
        >
          <Compass className="w-6 h-6" />
        </button>
      </div>

      {error && (
        <div className="absolute bottom-6 left-6 right-6 z-40 bg-rose-50 border-2 border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-medium shadow-lg">
          {error}
        </div>
      )}

      <MapContainer 
        ref={setMap}
        center={centerPosition as [number, number]} 
        zoom={18} 
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        zoomControl={false}
      >
        <ChangeView center={centerPosition as [number, number]} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
        />
        
        {/* User Current Position */}
        {currentPosition && (
          <Marker position={currentPosition} icon={getCustomMarkerIcon()}>
            <Popup className="rounded-xl">
              <div className="font-bold text-center text-stone-700">Vị trí của bạn</div>
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
