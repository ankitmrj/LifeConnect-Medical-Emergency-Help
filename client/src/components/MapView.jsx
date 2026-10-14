import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from 'react-leaflet';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Patient Icon
const patientIcon = L.divIcon({
  html: `
    <div style="
      width:18px;
      height:18px;
      border-radius:50%;
      background:#2563eb;
      border:3px solid white;
      box-shadow:0 1px 6px #555;
    "></div>
  `,
  className: '',
});

// Hospital Icon
const hospitalIcon = L.divIcon({
  html: `
    <div style="
      width:34px;
      height:34px;
      background:#dc2626;
      border:3px solid white;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      display:flex;
      align-items:center;
      justify-content:center;
      box-shadow:0 2px 7px rgba(0,0,0,.35);
    ">
      <div style="
        transform:rotate(45deg);
        color:white;
        font-size:22px;
        font-weight:900;
        line-height:1;
      ">
        +
      </div>
    </div>
  `,
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
});

// Ambulance Icon
const ambulanceIcon = L.divIcon({
  html: `
    <div style="
      width:30px;
      height:30px;
      background:#f59e0b;
      border:3px solid white;
      border-radius:50%;
      display:flex;
      align-items:center;
      justify-content:center;
      box-shadow:0 2px 7px rgba(0,0,0,.35);
      color:white;
      font-size:16px;
      font-weight:900;
    ">
      +
    </div>
  `,
  className: '',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

// Map View Component
export default function MapView({
  center,
  patient,
  hospitals = [],
  ambulance,
  route = [],
}) {
  const c = center || [26.76, 83.37];

  return (
    <MapContainer
      center={c}
      zoom={13}
      scrollWheelZoom
    >
      {/* Map Tiles */}
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Patient Marker */}
      {patient && (
        <Marker
          position={[patient[1], patient[0]]}
          icon={patientIcon}
        >
          <Popup>Patient</Popup>
        </Marker>
      )}

      {/* Hospital Markers */}
      {hospitals.map((h) => (
        <Marker
          key={h._id}
          position={[
            h.location.coordinates[1],
            h.location.coordinates[0],
          ]}
          icon={hospitalIcon}
        >
          <Popup>
            <strong>{h.name}</strong>
            <br />

            {h.distanceKm
              ? `${h.distanceKm} km`
              : ''}

            <br />
            Beds: {h.availableBeds ?? 0}
            <br />

            ICU: {h.icuAvailable
              ? 'Available'
              : 'Unavailable'}

            <br />

            Oxygen: {h.oxygenAvailable
              ? 'Available'
              : 'Unavailable'}

            <br />

            Antivenom: {h.antivenomAvailable
              ? `${h.antivenomUnits} units`
              : 'Unavailable'}
          </Popup>
        </Marker>
      ))}

      {/* Ambulance Marker */}
      {ambulance && (
        <Marker
          position={[ambulance[1], ambulance[0]]}
          icon={ambulanceIcon}
        >
          <Popup>Ambulance</Popup>
        </Marker>
      )}

      {/* Route Polyline */}
      {route.length > 1 && (
        <Polyline
          positions={route.map((p) => [p[1], p[0]])}
        />
      )}
    </MapContainer>
  );
}
