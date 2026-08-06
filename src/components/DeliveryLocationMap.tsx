import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon under bundlers that don't resolve Leaflet's relative asset paths.
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface DeliveryLocationMapProps {
  latitude: number;
  longitude: number;
  height?: number;
}

/** Read-only pin drop — no search, no click-to-move. Just shows where a delivery is headed. */
export function DeliveryLocationMap({ latitude, longitude, height = 220 }: DeliveryLocationMapProps) {
  const position: [number, number] = [latitude, longitude];

  return (
    <div className="w-full rounded-ios overflow-hidden border border-ios-gray5 relative z-0" style={{ height }}>
      <MapContainer
        center={position}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={position} />
      </MapContainer>
    </div>
  );
}
