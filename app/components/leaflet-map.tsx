"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
// Import Leaflet CSS - Safe because component is dynamically imported with ssr: false
import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMapInstance } from 'leaflet';

interface MapProperty {
  id: string;
  lat: number;
  lng: number;
  address: string;
  price: number;
  type: 'primary' | 'comparison' | 'comparable' | 'poi';
  status?: 'meets_criteria' | 'does_not_meet' | 'neutral';
  details?: any;
}

interface PointOfInterest {
  id: string;
  type: 'school' | 'shopping' | 'transport' | 'hospital' | 'park';
  name: string;
  lat: number;
  lng: number;
  distance: number;
  rating?: number;
}

interface LeafletMapProps {
  mapCenter: { lat: number; lng: number };
  zoomLevel: number;
  mapLayer: 'satellite' | 'street' | 'terrain';
  mapProperties: MapProperty[];
  pointsOfInterest: PointOfInterest[];
  showPOIs: boolean;
  onPropertyClick: (property: MapProperty) => void;
}

const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 };

const isFiniteNumber = (value?: number): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const sanitizeLatLng = (lat?: number, lng?: number) => ({
  lat: isFiniteNumber(lat) ? lat : DEFAULT_CENTER.lat,
  lng: isFiniteNumber(lng) ? lng : DEFAULT_CENTER.lng,
});

export function LeafletMap({
  mapCenter,
  zoomLevel,
  mapLayer,
  mapProperties,
  pointsOfInterest,
  showPOIs,
  onPropertyClick
}: LeafletMapProps) {
  const mapInstanceRef = useRef<LeafletMapInstance | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  const safeCenter = sanitizeLatLng(mapCenter.lat, mapCenter.lng);
  const validProperties = mapProperties.filter((property) =>
    isFiniteNumber(property.lat) && isFiniteNumber(property.lng)
  );
  const validPointsOfInterest = pointsOfInterest.filter((poi) =>
    isFiniteNumber(poi.lat) && isFiniteNumber(poi.lng)
  );
  const displayedPointsOfInterest = showPOIs ? validPointsOfInterest : [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  };

  // Debug: Log when props change
  useEffect(() => {
    console.log('LeafletMap: Props updated', { mapCenter, zoomLevel });
  }, [mapCenter.lat, mapCenter.lng, zoomLevel]);

  useEffect(() => {
    if (!isMounted) return;
    if (!mapInstanceRef.current) return;

    const nextCenter = sanitizeLatLng(mapCenter.lat, mapCenter.lng);

    try {
      mapInstanceRef.current.setView([nextCenter.lat, nextCenter.lng], zoomLevel, {
        animate: true,
        duration: 0.5,
      });
    } catch (err) {
      console.warn('LeafletMap: Failed to update map view', err);
    }
  }, [isMounted, mapCenter.lat, mapCenter.lng, zoomLevel]);

  useEffect(() => {
    if (!isMounted) return;
    if (!mapInstanceRef.current) return;

    const timer = window.setTimeout(() => {
      try {
        mapInstanceRef.current?.invalidateSize();
      } catch (err) {
        console.warn('LeafletMap: Failed to invalidate map size', err);
      }
    }, 150);

    return () => window.clearTimeout(timer);
  }, [isMounted, validProperties.length, displayedPointsOfInterest.length]);

  // Ensure component is mounted on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMounted(true);
      
      // Fix Leaflet icons after mount
      import('leaflet').then((L) => {
        try {
          delete (L.Icon.Default.prototype as any)._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          });
        } catch (err) {
          console.warn('Failed to fix Leaflet icons:', err);
        }
      }).catch(err => {
        console.warn('Failed to load Leaflet for icon fix:', err);
      });
    }
  }, []);

  // Don't render until mounted (prevents SSR/hydration errors)
  if (!isMounted || typeof window === 'undefined') {
    return <div className="w-full h-96 bg-gray-100 flex items-center justify-center rounded-lg">Loading map...</div>;
  }

  try {
    return (
      <div className="w-full h-full" style={{ minHeight: '384px' }}>
        <MapContainer
          center={[safeCenter.lat, safeCenter.lng]}
          zoom={zoomLevel}
          style={{ height: '100%', width: '100%', minHeight: '384px' }}
          className="rounded-lg z-0"
          scrollWheelZoom
          ref={(map) => {
            if (map) {
              mapInstanceRef.current = map;
              window.setTimeout(() => {
                try {
                  map.invalidateSize();
                } catch (err) {
                  console.warn('LeafletMap: Failed to invalidate size on create', err);
                }
              }, 0);
            }
          }}
        >
        <TileLayer
          url={
            mapLayer === 'satellite' 
              ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              : mapLayer === 'terrain'
              ? "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
          attribution={
            mapLayer === 'satellite'
              ? '&copy; <a href="https://www.esri.com/">Esri</a>'
              : mapLayer === 'terrain'
              ? '&copy; <a href="https://opentopomap.org/">OpenTopoMap</a>'
              : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          }
        />

      {/* Property Markers */}
      {validProperties.map((property) => (
        <Marker
          key={property.id}
          position={[property.lat, property.lng]}
          eventHandlers={{
            click: () => onPropertyClick(property),
          }}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-medium text-sm">{property.address}</h3>
              <p className="text-xs text-gray-600 mb-2">
                {property.type === 'primary' ? 'Primary Property' :
                 property.type === 'comparison' ? 'Comparison Property' :
                 'Comparable Sale'}
              </p>
              <div className="text-sm">
                <p><strong>Price:</strong> {formatCurrency(property.price)}</p>
                {property.status && (
                  <p><strong>Status:</strong> {property.status === 'meets_criteria' ? '✓ Meets Criteria' : '✗ Does Not Meet'}</p>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* POI Markers */}
      {displayedPointsOfInterest.map((poi) => (
        <Marker
          key={poi.id}
          position={[poi.lat, poi.lng]}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-medium text-sm">{poi.name}</h3>
              <p className="text-xs text-gray-600 capitalize">{poi.type}</p>
              <p className="text-sm"><strong>Distance:</strong> {poi.distance} miles</p>
              {poi.rating && (
                <p className="text-sm"><strong>Rating:</strong> {poi.rating}/5 ⭐</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
        </MapContainer>
      </div>
    );
  } catch (error) {
    console.error('Map rendering error:', error);
    return (
      <div className="w-full h-96 bg-red-50 flex items-center justify-center rounded-lg border border-red-200">
        <div className="text-center p-4">
          <p className="text-red-800 font-medium mb-2">Map failed to load</p>
          <p className="text-red-600 text-sm">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }
}


