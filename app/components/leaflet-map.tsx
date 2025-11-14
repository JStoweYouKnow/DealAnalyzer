"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

// Component to handle map instance setup
// This component is rendered inside MapContainer to access the map instance via useMap hook
function MapInstanceHandler({
  onMapReady,
  mapKey
}: {
  onMapReady: (map: LeafletMapInstance) => void;
  mapKey: string;
}) {
  const map = useMap();
  const hasInitializedRef = useRef(false);
  const mapIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Only initialize once per map instance
    if (map && !hasInitializedRef.current) {
      // Prevent double initialization
      const currentMapId = (map as any)._leaflet_id;
      if (mapIdRef.current === currentMapId) {
        console.warn('LeafletMap: MapInstanceHandler already handled this map instance');
        return;
      }

      hasInitializedRef.current = true;
      mapIdRef.current = currentMapId;

      // Check if map container already has an instance
      const container = map.getContainer();
      if ((container as any)._leaflet_id) {
        // If container has a different instance, clean it up first
        if ((container as any)._leaflet_id !== (map as any)._leaflet_id) {
          console.warn('LeafletMap: Container already has different Leaflet instance, cleaning up', {
            containerId: (container as any)._leaflet_id,
            mapId: (map as any)._leaflet_id
          });
          try {
            const existingMap = (container as any)._leaflet;
            if (existingMap && existingMap.remove && existingMap !== map) {
              existingMap.remove();
            }
            // Clear old references
            delete (container as any)._leaflet_id;
            delete (container as any)._leaflet;
          } catch (err) {
            console.warn('LeafletMap: Error cleaning up existing instance:', err);
          }
        }
      }

      onMapReady(map);
    }

    return () => {
      // Reset on unmount
      hasInitializedRef.current = false;
      mapIdRef.current = null;
    };
  }, [map, onMapReady, mapKey]);

  return null;
}

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cleanupDoneRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);
  const [mapKey, setMapKey] = useState(() => Date.now());
  const [isContainerReady, setIsContainerReady] = useState(false);
  const prevPrimaryIdRef = useRef<string | undefined>(undefined);

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


  // Callback to handle map instance when it's ready
  const handleMapReady = useCallback((map: LeafletMapInstance) => {
    // Always destroy any existing instance first
    if (mapInstanceRef.current && mapInstanceRef.current !== map) {
      console.warn('LeafletMap: Destroying existing map instance');
      try {
        mapInstanceRef.current.remove();
      } catch (err) {
        console.warn('LeafletMap: Error destroying existing map', err);
      }
      mapInstanceRef.current = null;
    }
    
    console.log('LeafletMap: Map instance ready');
    mapInstanceRef.current = map;
    
    // Invalidate size after a brief delay
    window.setTimeout(() => {
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      } catch (err) {
        console.warn('LeafletMap: Failed to invalidate size', err);
      }
    }, 200);
  }, []);

  // Cleanup map instance on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          console.log('LeafletMap: Cleaning up map instance on component unmount');
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (err) {
          console.warn('LeafletMap: Error cleaning up map instance', err);
        }
      }
    };
  }, []);

  // Update map when properties change instead of remounting
  // This avoids the "Map container is already initialized" error
  useEffect(() => {
    const primaryPropertyId = mapProperties.find(p => p.type === 'primary')?.id;

    if (primaryPropertyId && primaryPropertyId !== prevPrimaryIdRef.current) {
      console.log('LeafletMap: Primary property changed', {
        old: prevPrimaryIdRef.current,
        new: primaryPropertyId
      });

      // Update the stored ID
      prevPrimaryIdRef.current = primaryPropertyId;
      
      // Ensure container is ready when new property is detected
      if (!isContainerReady && containerRef.current) {
        setIsContainerReady(true);
        cleanupDoneRef.current = true;
      }
      
      // Don't remount - just update the map center if we have a map instance
      // The map will update its markers and center through props
      if (mapInstanceRef.current && mapProperties.length > 0) {
        const primaryProperty = mapProperties.find(p => p.type === 'primary');
        if (primaryProperty && isFiniteNumber(primaryProperty.lat) && isFiniteNumber(primaryProperty.lng)) {
          try {
            mapInstanceRef.current.setView([primaryProperty.lat, primaryProperty.lng], zoomLevel, {
              animate: true,
              duration: 1.0
            });
          } catch (err) {
            console.warn('LeafletMap: Error updating map view', err);
          }
        }
      }
    } else if (primaryPropertyId && !prevPrimaryIdRef.current) {
      // First mount - just store the ID and ensure container is ready
      prevPrimaryIdRef.current = primaryPropertyId;
      if (!isContainerReady && containerRef.current) {
        setIsContainerReady(true);
        cleanupDoneRef.current = true;
      }
    }
  }, [mapProperties, zoomLevel, isMounted, isContainerReady]);

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

  // Ref callback to set container reference
  const containerRefCallback = useCallback((node: HTMLDivElement | null) => {
    // Clean up previous container if it exists
    if (containerRef.current && containerRef.current !== node) {
      try {
        const prevContainer = containerRef.current;
        if ((prevContainer as any)._leaflet_id) {
          const L = (window as any).L;
          if (L) {
            const existingMap = (prevContainer as any)._leaflet;
            if (existingMap && typeof existingMap.remove === 'function') {
              existingMap.remove();
            }
          }
          delete (prevContainer as any)._leaflet_id;
          delete (prevContainer as any)._leaflet;
        }
      } catch (err) {
        console.warn('LeafletMap: Error cleaning up previous container:', err);
      }
    }

    containerRef.current = node;
    
    if (node) {
      // Clean up any existing Leaflet instances on this node
      const hasInstance = !!(node as any)._leaflet_id;
      
      if (hasInstance) {
        try {
          const L = (window as any).L;
          if (L) {
            const existingMap = (node as any)._leaflet;
            if (existingMap && typeof existingMap.remove === 'function') {
              existingMap.remove();
            }
          }
          delete (node as any)._leaflet_id;
          delete (node as any)._leaflet;
        } catch (err) {
          console.warn('LeafletMap: Error cleaning up orphaned instance:', err);
        }
      }
      
      // Always mark as ready - use immediate set and also a timeout as backup
      setIsContainerReady(true);
      cleanupDoneRef.current = true;
      
      // Also set with timeout as backup in case immediate set doesn't work
      setTimeout(() => {
        if (containerRef.current === node) {
          setIsContainerReady(true);
          cleanupDoneRef.current = true;
        }
      }, 10);
    } else {
      setIsContainerReady(false);
      cleanupDoneRef.current = false;
    }
  }, []);

  // Effect to ensure container is ready for rendering
  useEffect(() => {
    if (isMounted && containerRef.current && !mapInstanceRef.current) {
      const container = containerRef.current;
      // If container is clean, allow rendering
      if (!(container as any)._leaflet_id) {
        setIsContainerReady(true);
        cleanupDoneRef.current = true;
      } else {
        // Container has an instance, clean it up
        try {
          const L = (window as any).L;
          if (L) {
            const existingMap = (container as any)._leaflet;
            if (existingMap && typeof existingMap.remove === 'function') {
              existingMap.remove();
            }
          }
          delete (container as any)._leaflet_id;
          delete (container as any)._leaflet;
          // Force remount with new key
          setMapKey(Date.now());
          // Allow rendering after cleanup
          setTimeout(() => {
            if (containerRef.current === container && !(container as any)._leaflet_id) {
              setIsContainerReady(true);
              cleanupDoneRef.current = true;
            }
          }, 50);
        } catch (err) {
          console.warn('LeafletMap: Error in cleanup effect:', err);
          // Even if cleanup fails, allow rendering to proceed
          setIsContainerReady(true);
          cleanupDoneRef.current = true;
        }
      }
    }
  }, [isMounted]);

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
      
      // Fallback: Force container ready after a timeout to ensure map always initializes
      // Use shorter timeout and more aggressive fallback
      const fallbackTimer = setTimeout(() => {
        if (!isContainerReady) {
          console.log('LeafletMap: Fallback - forcing container ready');
          setIsContainerReady(true);
          cleanupDoneRef.current = true;
        }
      }, 100);
      
      // Additional fallback with longer timeout
      const longFallbackTimer = setTimeout(() => {
        if (!isContainerReady) {
          console.log('LeafletMap: Long fallback - forcing container ready');
          setIsContainerReady(true);
          cleanupDoneRef.current = true;
        }
      }, 1000);
      
      // Cleanup: Remove any existing Leaflet instances from container on unmount
      return () => {
        clearTimeout(fallbackTimer);
        clearTimeout(longFallbackTimer);
        if (containerRef.current) {
          try {
          // Check if container has a Leaflet instance attached
          const container = containerRef.current;
          if ((container as any)._leaflet_id) {
            // Try to find and remove the map instance
            const L = (window as any).L;
            if (L && L.Map) {
              const existingMap = (container as any)._leaflet;
              if (existingMap && existingMap.remove) {
                existingMap.remove();
              }
            }
            // Clear the leaflet ID
            delete (container as any)._leaflet_id;
            delete (container as any)._leaflet;
          }
        } catch (err) {
          console.warn('LeafletMap: Error cleaning up container:', err);
        }
        }
      }
    };
  }, []);

  // Don't render until mounted (prevents SSR/hydration errors)
  if (!isMounted || typeof window === 'undefined') {
    return <div className="w-full h-96 bg-gray-100 flex items-center justify-center rounded-lg">Loading map...</div>;
  }

  // Final safety check before rendering
  // Render if mounted and container is ready (or will be ready soon)
  // We'll do a final check inside the render to prevent double initialization
  const container = containerRef.current;
  const hasLeafletInstance = container && (container as any)._leaflet_id;
  // Simplified: render if mounted and we have a container (isContainerReady will be set by ref callback)
  // If container is ready OR we have a container ref, allow rendering
  const shouldRenderMap = isMounted && (isContainerReady || container) && !hasLeafletInstance;

  // Render the map - use key on wrapper to force complete DOM recreation
  // This avoids the "Map container is already initialized" error
  try {
    return (
      <div
        className="w-full h-full"
        style={{ minHeight: '384px' }}
      >
        {!shouldRenderMap ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="text-sm text-muted-foreground">Initializing map...</div>
          </div>
        ) : (
          <div
            key={`map-outer-${mapKey}`}
            ref={containerRefCallback}
            className="w-full h-full"
            style={{ minHeight: '384px' }}
          >
            {(() => {
              // Final render-time check - be very defensive
              if (!containerRef.current) {
                return null;
              }
              
              const container = containerRef.current;
              
              // If container already has a Leaflet instance, don't render MapContainer
              if ((container as any)._leaflet_id) {
                console.warn('LeafletMap: Container already has Leaflet ID, skipping render');
                // Try to clean it up and force remount
                try {
                  const L = (window as any).L;
                  if (L) {
                    const existingMap = (container as any)._leaflet;
                    if (existingMap && typeof existingMap.remove === 'function') {
                      existingMap.remove();
                    }
                  }
                  delete (container as any)._leaflet_id;
                  delete (container as any)._leaflet;
                  // Force remount on next render
                  setTimeout(() => setMapKey(Date.now()), 0);
                } catch (err) {
                  console.warn('LeafletMap: Error cleaning up during render:', err);
                }
                return null;
              }

              return (
                <MapContainer
                  key={`map-instance-${mapKey}`}
                  center={[safeCenter.lat, safeCenter.lng]}
                  zoom={zoomLevel}
                  style={{ height: '100%', width: '100%', minHeight: '384px' }}
                  className="rounded-lg z-0"
                  scrollWheelZoom={true}
                >
                  <MapInstanceHandler onMapReady={handleMapReady} mapKey={`handler-${mapKey}`} />
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
                  {validProperties.map((property) => {
                    // Create custom green icon for primary property
                    const isPrimary = property.type === 'primary';
                    let customIcon: any = null;
                    
                    if (isPrimary && typeof window !== 'undefined') {
                      const L = (window as any).L;
                      if (L) {
                        // Create green marker icon for primary property using divIcon for better reliability
                        customIcon = L.divIcon({
                          className: 'custom-green-marker',
                          html: `<div style="
                            background-color: #22c55e;
                            width: 30px;
                            height: 30px;
                            border-radius: 50% 50% 50% 0;
                            transform: rotate(-45deg);
                            border: 3px solid #ffffff;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                            position: relative;
                          ">
                            <div style="
                              transform: rotate(45deg);
                              color: white;
                              font-weight: bold;
                              font-size: 18px;
                              line-height: 30px;
                              text-align: center;
                            ">🏠</div>
                          </div>`,
                          iconSize: [30, 30],
                          iconAnchor: [15, 15],
                          popupAnchor: [0, -15]
                        });
                      }
                    }
                    
                    return (
                    <Marker
                      key={property.id}
                      position={[property.lat, property.lng]}
                      icon={customIcon || undefined}
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
                    );
                  })}

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
              );
            })()}
          </div>
        )}
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


