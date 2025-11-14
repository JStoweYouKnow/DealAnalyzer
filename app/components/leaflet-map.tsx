"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
// Import Leaflet CSS - Safe because component is dynamically imported with ssr: false
import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMapInstance } from 'leaflet';
import { logger } from '@/lib/logger';

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

const POI_EMOJI_MAP: Record<string, string> = {
  'school': '🏫',
  'shopping': '🛒',
  'transport': '🚇',
  'hospital': '🏥',
  'park': '🌳'
};

const isFiniteNumber = (value?: number): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const sanitizeLatLng = (lat?: number, lng?: number) => ({
  lat: isFiniteNumber(lat) ? lat : DEFAULT_CENTER.lat,
  lng: isFiniteNumber(lng) ? lng : DEFAULT_CENTER.lng,
});

// Helper function to safely remove a Leaflet map instance
// Prevents "Map container is being reused by another instance" errors
const safeRemoveMap = (map: any, container?: HTMLElement | null): boolean => {
  if (!map || typeof map.remove !== 'function') {
    return false;
  }

  try {
    // Check if map is still valid by verifying it has a container
    const mapContainer = map.getContainer && map.getContainer();
    if (!mapContainer) {
      // Map is already removed or invalid
      return false;
    }

    // If a specific container is provided, verify the map belongs to it
    if (container && mapContainer !== container) {
      // Map doesn't belong to this container, don't remove it
      return false;
    }

    // Check if the container still references this map instance
    if (mapContainer && (mapContainer as any)._leaflet) {
      const containerMap = (mapContainer as any)._leaflet;
      if (containerMap !== map) {
        // Container is being used by a different map instance
        return false;
      }
    }

    // Check if map has already been removed by checking internal state
    if ((map as any)._removed) {
      return false;
    }

    // All checks passed, safe to remove
    map.remove();
    return true;
  } catch (err: any) {
    // Specifically catch the "Map container is being reused" error
    const errorMessage = err?.message || err?.toString() || '';
    if (errorMessage.includes('Map container is being reused') || 
        errorMessage.includes('being reused by another instance') ||
        errorMessage.includes('reused by another')) {
      // This is expected in some cleanup scenarios, just clear references
      logger.debug('LeafletMap: Map container already reused, skipping removal');
      return false;
    }
    // For other errors, log but don't throw
    logger.debug('LeafletMap: Error during safe map removal:', err);
    return false;
  }
};

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
        // Silently return if we've already handled this instance
        return;
      }

      hasInitializedRef.current = true;
      mapIdRef.current = currentMapId;

      // Check if map container already has an instance
      const container = map.getContainer();
      if ((container as any)._leaflet_id) {
        // If container has a different instance, clean it up first
        if ((container as any)._leaflet_id !== (map as any)._leaflet_id) {
          // Only log in development to avoid console noise in production
          const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
          if (isDev) {
            logger.debug('LeafletMap: Container already has different Leaflet instance, cleaning up', {
              containerId: (container as any)._leaflet_id,
              mapId: (map as any)._leaflet_id
            });
          }
          try {
            const existingMap = (container as any)._leaflet;
            if (existingMap && existingMap !== map) {
              // Use safe removal to prevent "Map container is being reused" errors
              safeRemoveMap(existingMap, container);
            }
            // Always clear old references even if removal fails
            delete (container as any)._leaflet_id;
            delete (container as any)._leaflet;
          } catch (err) {
            // Only log errors, not warnings for expected cleanup scenarios
            logger.error('LeafletMap: Error cleaning up existing instance:', err);
            // Still clear references on error
            delete (container as any)._leaflet_id;
            delete (container as any)._leaflet;
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
  const [isLeafletReady, setIsLeafletReady] = useState(false);
  const [leafletDegraded, setLeafletDegraded] = useState(false);
  const prevPrimaryIdRef = useRef<string | undefined>(undefined);
  const needsRemountRef = useRef(false);
  const remountTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        logger.debug('LeafletMap: Destroying existing map instance');
        safeRemoveMap(mapInstanceRef.current);
        mapInstanceRef.current = null;
      }
      
      logger.debug('LeafletMap: Map instance ready');
    mapInstanceRef.current = map;
    
    // Invalidate size after a brief delay
    window.setTimeout(() => {
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
        } catch (err) {
          logger.warn('LeafletMap: Failed to invalidate size', err);
        }
    }, 200);
  }, []);

  // Cleanup map instance on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        logger.debug('LeafletMap: Cleaning up map instance on component unmount');
        safeRemoveMap(mapInstanceRef.current);
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map when properties change instead of remounting
  // This avoids the "Map container is already initialized" error
  useEffect(() => {
    const primaryPropertyId = mapProperties.find(p => p.type === 'primary')?.id;

    if (primaryPropertyId && primaryPropertyId !== prevPrimaryIdRef.current) {
      logger.debug('LeafletMap: Primary property changed', {
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
            logger.warn('LeafletMap: Error updating map view', err);
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
    logger.debug('LeafletMap: Props updated', { mapCenter, zoomLevel });
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
        logger.warn('LeafletMap: Failed to update map view', err);
      }
  }, [isMounted, mapCenter.lat, mapCenter.lng, zoomLevel]);

  useEffect(() => {
    if (!isMounted) return;
    if (!mapInstanceRef.current) return;

    const timer = window.setTimeout(() => {
      try {
        mapInstanceRef.current?.invalidateSize();
      } catch (err) {
        logger.warn('LeafletMap: Failed to invalidate map size', err);
      }
    }, 150);

    return () => window.clearTimeout(timer);
  }, [isMounted, validProperties.length, displayedPointsOfInterest.length]);

  // Handle remount requests with proper cleanup
  useEffect(() => {
    if (needsRemountRef.current && !remountTimeoutRef.current) {
      const id = setTimeout(() => {
        if (needsRemountRef.current) {
          setMapKey(Date.now());
          needsRemountRef.current = false;
        }
        remountTimeoutRef.current = null;
      }, 0);

      remountTimeoutRef.current = id;
    }

    return () => {
      if (remountTimeoutRef.current) {
        clearTimeout(remountTimeoutRef.current);
        remountTimeoutRef.current = null;
      }
    };
  });

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
            safeRemoveMap(existingMap, prevContainer);
          }
          delete (prevContainer as any)._leaflet_id;
          delete (prevContainer as any)._leaflet;
        }
        } catch (err) {
          logger.warn('LeafletMap: Error cleaning up previous container:', err);
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
            safeRemoveMap(existingMap, node);
          }
          delete (node as any)._leaflet_id;
          delete (node as any)._leaflet;
        } catch (err) {
          logger.warn('LeafletMap: Error cleaning up orphaned instance:', err);
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
            safeRemoveMap(existingMap, container);
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
          logger.warn('LeafletMap: Error in cleanup effect:', err);
          // Even if cleanup fails, allow rendering to proceed
          setIsContainerReady(true);
          cleanupDoneRef.current = true;
        }
      }
    }
  }, [isMounted]);

  // Set up global error handler and patch Leaflet's remove method
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Set up global error handler for Leaflet map errors
      const originalErrorHandler = window.onerror;
      window.onerror = (message, source, lineno, colno, error) => {
        // Catch and suppress "Map container is being reused" errors
        if (error && (
          (error as Error).message?.includes('Map container is being reused') ||
          (error as Error).message?.includes('being reused by another instance') ||
          String(message).includes('Map container is being reused') ||
          String(message).includes('being reused by another instance')
        )) {
          logger.debug('LeafletMap: Caught and suppressed "Map container is being reused" error');
          return true; // Suppress the error
        }
        // Call original error handler for other errors
        if (originalErrorHandler) {
          return originalErrorHandler(message, source, lineno, colno, error);
        }
        return false;
      };

      return () => {
        // Restore original error handler
        window.onerror = originalErrorHandler;
      };
    }
  }, []);

  // Ensure component is mounted on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMounted(true);

      // Fix Leaflet icons after mount - ensure this happens before any markers are rendered
      import('leaflet').then((L) => {
        try {
          // Store L in window for global access
          (window as any).L = L;
          
          // Patch Leaflet's Map.prototype.remove to catch "Map container is being reused" errors
          if (L.Map && L.Map.prototype && L.Map.prototype.remove) {
            const OriginalRemove = L.Map.prototype.remove;
            L.Map.prototype.remove = function(this: any) {
              try {
                // Check if map is already removed or container is being reused
                const container = this.getContainer && this.getContainer();
                if (!container) {
                  return this; // Already removed
                }
                
                // Check if container is being used by another map
                if (container && (container as any)._leaflet) {
                  const containerMap = (container as any)._leaflet;
                  if (containerMap !== this) {
                    // Container is being used by a different map, don't remove
                    logger.debug('LeafletMap: Container is being reused, skipping remove');
                    return this;
                  }
                }
                
                return OriginalRemove.call(this);
              } catch (err: any) {
                const errorMessage = err?.message || err?.toString() || '';
                if (errorMessage.includes('Map container is being reused') || 
                    errorMessage.includes('being reused by another instance')) {
                  logger.debug('LeafletMap: Caught "Map container is being reused" in patched remove');
                  return this; // Return map instance to maintain chainability
                }
                throw err; // Re-throw other errors
              }
            };
          }
          
          // Clear any existing icon configuration
          delete (L.Icon.Default.prototype as any)._getIconUrl;

          // Set up default icon URLs - this must happen before any Marker components are created
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          });

          // Ensure createIcon method exists
          if (!L.Icon.Default.prototype.createIcon) {
            L.Icon.Default.prototype.createIcon = function(oldIcon: any) {
              return L.DomUtil.create('div', 'leaflet-marker-icon ' + (this.options.className || ''), oldIcon);
            };
          }

          logger.debug('LeafletMap: Icon configuration set successfully');
          setIsLeafletReady(true);
        } catch (err) {
          logger.error('LeafletMap: Failed to configure Leaflet icons:', err);
          setLeafletDegraded(true);
          // Do not mark as ready - icons failed to load
        }
      }).catch(err => {
        logger.error('LeafletMap: Failed to load Leaflet library:', err);
        setLeafletDegraded(true);
        // Do not mark as ready - Leaflet failed to load
      });
      
      // Fallback: Force container ready after a timeout to ensure map always initializes
      // Use shorter timeout and more aggressive fallback
      const fallbackTimer = setTimeout(() => {
        if (!isContainerReady) {
          logger.debug('LeafletMap: Fallback - forcing container ready');
          setIsContainerReady(true);
          cleanupDoneRef.current = true;
        }
      }, 100);
      
      // Additional fallback with longer timeout
      const longFallbackTimer = setTimeout(() => {
        if (!isContainerReady) {
          logger.debug('LeafletMap: Long fallback - forcing container ready');
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
              safeRemoveMap(existingMap, container);
            }
            // Clear the leaflet ID
            delete (container as any)._leaflet_id;
            delete (container as any)._leaflet;
          }
        } catch (err) {
          logger.warn('LeafletMap: Error cleaning up container:', err);
        }
        }
      }
    };
  }, []);

  // Don't render until mounted and Leaflet is ready (prevents SSR/hydration errors and icon errors)
  // Also ensure Leaflet is loaded in window before rendering
  const isLeafletLoaded = typeof window !== 'undefined' && (window as any).L;
  if (!isMounted || !isLeafletReady || !isLeafletLoaded || typeof window === 'undefined') {
    // Show degraded state warning if Leaflet failed to load
    if (leafletDegraded) {
      return (
        <div className="w-full h-96 bg-yellow-50 border-2 border-yellow-400 flex flex-col items-center justify-center rounded-lg p-6">
          <div className="text-center max-w-md">
            <div className="text-yellow-800 font-bold text-lg mb-2">⚠️ Map Loading Failed</div>
            <p className="text-yellow-700 text-sm mb-2">
              The map could not be initialized properly. This may be due to:
            </p>
            <ul className="text-yellow-700 text-sm list-disc list-inside mb-4 space-y-1">
              <li>Failed to load Leaflet library</li>
              <li>Icon configuration errors</li>
              <li>Network connectivity issues</li>
            </ul>
            <p className="text-yellow-600 text-xs">
              Please refresh the page or check your network connection.
            </p>
          </div>
        </div>
      );
    }
    return <div className="w-full h-96 bg-gray-100 flex items-center justify-center rounded-lg">Loading map...</div>;
  }

  // Final safety check before rendering
  // Render if mounted, Leaflet is ready, and container is ready (or will be ready soon)
  // We'll do a final check inside the render to prevent double initialization
  const container = containerRef.current;
  const hasLeafletInstance = container && (container as any)._leaflet_id;
  // Simplified: render if mounted, Leaflet ready, and we have a container (isContainerReady will be set by ref callback)
  // If container is ready OR we have a container ref, allow rendering
  // Also ensure container doesn't already have an instance
  // isLeafletLoaded is already checked in the render guard above
  const shouldRenderMap = isMounted && isLeafletReady && isLeafletLoaded && (isContainerReady || container) && !hasLeafletInstance;

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
                // Only log in development
                const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
                if (isDev) {
                  logger.debug('LeafletMap: Container already has Leaflet ID, skipping render');
                }
                // Try to clean it up and force remount
                try {
                  const L = (window as any).L;
                  if (L) {
                    const existingMap = (container as any)._leaflet;
                    if (existingMap) {
                      // Use safe removal to prevent "Map container is being reused" errors
                      safeRemoveMap(existingMap, container);
                    }
                  }
                  // Always clear references
                  delete (container as any)._leaflet_id;
                  delete (container as any)._leaflet;
                  // Force remount on next render (handled by useEffect with cleanup)
                  needsRemountRef.current = true;
                } catch (err) {
                  logger.error('LeafletMap: Error cleaning up during render:', err);
                  // Still clear references on error
                  delete (container as any)._leaflet_id;
                  delete (container as any)._leaflet;
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
                    // Always create explicit icons - never rely on default icon
                    const isPrimary = property.type === 'primary';
                    let customIcon: any = null;

                    const L = (window as any).L;
                    if (L && L.divIcon) {
                      if (isPrimary) {
                        // Create green marker icon for primary property using divIcon
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
                      } else {
                        // Always use divIcon for non-primary markers to avoid default icon issues
                        const color = property.type === 'comparison' ? '#f59e0b' : '#3b82f6';
                        customIcon = L.divIcon({
                          className: 'custom-marker',
                          html: `<div style="
                            background-color: ${color};
                            width: 25px;
                            height: 25px;
                            border-radius: 50% 50% 50% 0;
                            transform: rotate(-45deg);
                            border: 2px solid #ffffff;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                          "></div>`,
                          iconSize: [25, 25],
                          iconAnchor: [12, 12],
                          popupAnchor: [0, -12]
                        });
                      }
                    }
                    
                    // Don't render marker if icon creation failed
                    if (!customIcon) {
                      return null;
                    }
                    
                    return (
                    <Marker
                      key={property.id}
                      position={[property.lat, property.lng]}
                      icon={customIcon}
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
                  {displayedPointsOfInterest.map((poi) => {
                    // Create custom icons for POIs using divIcon for better reliability
                    let poiIcon: any = null;

                    if (typeof window !== 'undefined') {
                      const L = (window as any).L;
                      if (L) {
                        // Use emoji-based divIcon for POIs
                        poiIcon = L.divIcon({
                          className: 'custom-poi-marker',
                          html: `<div style="
                            background-color: #3b82f6;
                            width: 28px;
                            height: 28px;
                            border-radius: 50% 50% 50% 0;
                            transform: rotate(-45deg);
                            border: 2px solid #ffffff;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                            position: relative;
                          ">
                            <div style="
                              transform: rotate(45deg);
                              font-size: 16px;
                              line-height: 28px;
                              text-align: center;
                            ">${POI_EMOJI_MAP[poi.type] || '📍'}</div>
                          </div>`,
                          iconSize: [28, 28],
                          iconAnchor: [14, 14],
                          popupAnchor: [0, -14]
                        });
                      }
                    }

                    return (
                      <Marker
                        key={poi.id}
                        position={[poi.lat, poi.lng]}
                        icon={poiIcon || undefined}
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
                    );
                  })}
                </MapContainer>
              );
            })()}
          </div>
        )}
      </div>
    );
  } catch (error) {
    logger.error('Map rendering error:', error);
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

// Default export for compatibility
export default LeafletMap;

