"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
// Import Leaflet CSS - Safe because component is dynamically imported with ssr: false
import 'leaflet/dist/leaflet.css';

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

// Fix Leaflet icons on client side only
// Use useEffect to ensure this runs only in browser environment

const MapUpdater = ({ mapCenter, zoomLevel }: { mapCenter: { lat: number; lng: number }, zoomLevel: number }) => {
  const map = useMap();
  const prevCenterRef = useRef<{ lat: number; lng: number } | null>(null);
  const prevZoomRef = useRef<number | null>(null);
  
  useEffect(() => {
    const currentCenter = [mapCenter.lat, mapCenter.lng] as [number, number];
    const currentZoom = zoomLevel;
    
    // Check if center or zoom has actually changed
    const centerChanged = !prevCenterRef.current || 
      prevCenterRef.current.lat !== mapCenter.lat || 
      prevCenterRef.current.lng !== mapCenter.lng;
    const zoomChanged = prevZoomRef.current === null || prevZoomRef.current !== currentZoom;
    
    if (centerChanged || zoomChanged) {
      console.log('MapUpdater: Updating map view', { 
        center: currentCenter, 
        zoom: currentZoom,
        centerChanged,
        zoomChanged,
        prevCenter: prevCenterRef.current,
        prevZoom: prevZoomRef.current
      });
      
      // Update map view with animation
      map.setView(currentCenter, currentZoom, {
        animate: true,
        duration: 0.5
      });
      
      // Update refs
      prevCenterRef.current = { lat: mapCenter.lat, lng: mapCenter.lng };
      prevZoomRef.current = currentZoom;
    } else {
      console.log('MapUpdater: No change detected, skipping update');
    }
  }, [map, mapCenter.lat, mapCenter.lng, zoomLevel]);

  // Invalidate map size after mount to ensure proper rendering
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);
  
  return null;
};

export function LeafletMap({
  mapCenter,
  zoomLevel,
  mapLayer,
  mapProperties,
  pointsOfInterest,
  showPOIs,
  onPropertyClick
}: LeafletMapProps) {
  const mapRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  };

  // Debug: Log when props change
  useEffect(() => {
    console.log('LeafletMap: Props updated', { mapCenter, zoomLevel });
  }, [mapCenter.lat, mapCenter.lng, zoomLevel]);

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
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={zoomLevel}
        style={{ height: '100%', width: '100%', minHeight: '384px' }}
        className="rounded-lg z-0"
        ref={mapRef}
        scrollWheelZoom={true}
      >
        <MapUpdater mapCenter={mapCenter} zoomLevel={zoomLevel} />
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
      {mapProperties.map((property) => (
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
      {showPOIs && pointsOfInterest.map((poi) => (
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


