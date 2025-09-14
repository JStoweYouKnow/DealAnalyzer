import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Map, 
  MapPin, 
  Navigation, 
  Layers, 
  Target, 
  Home, 
  School, 
  ShoppingCart, 
  Car,
  TrendingUp,
  TrendingDown,
  Info
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { DealAnalysis, ComparableSale, NeighborhoodTrend } from "@shared/schema";

interface MapIntegrationProps {
  analysis?: DealAnalysis;
  comparisonAnalyses?: DealAnalysis[];
}

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

export function MapIntegration({ analysis, comparisonAnalyses = [] }: MapIntegrationProps) {
  const [mapCenter, setMapCenter] = useState({ lat: 39.8283, lng: -98.5795 }); // Center of US
  const [zoomLevel, setZoomLevel] = useState(10);
  const [selectedProperty, setSelectedProperty] = useState<MapProperty | null>(null);
  const [mapLayer, setMapLayer] = useState<'satellite' | 'street' | 'terrain'>('street');
  const [showPOIs, setShowPOIs] = useState(true);
  const [searchAddress, setSearchAddress] = useState("");

  // Mock map properties data (in real implementation, this would come from backend)
  const [mapProperties, setMapProperties] = useState<MapProperty[]>([]);
  const [pointsOfInterest, setPointsOfInterest] = useState<PointOfInterest[]>([]);

  // Fetch comparable sales for map
  const { data: comparableSales = [] } = useQuery<ComparableSale[]>({
    queryKey: ['/api/market/comparable-sales', analysis?.property.address],
    queryFn: async () => {
      if (!analysis?.property.address) return [];
      
      const response = await apiRequest('GET', 
        `/api/market/comparable-sales?address=${encodeURIComponent(analysis.property.address)}&radius=5`
      );
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!analysis?.property.address
  });

  // Mock geocoding function (in real implementation, use Google Maps API or similar)
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    // Mock coordinates based on some common cities
    const mockCoordinates: { [key: string]: { lat: number; lng: number } } = {
      'austin': { lat: 30.2672, lng: -97.7431 },
      'dallas': { lat: 32.7767, lng: -96.7970 },
      'houston': { lat: 29.7604, lng: -95.3698 },
      'los angeles': { lat: 34.0522, lng: -118.2437 },
      'miami': { lat: 25.7617, lng: -80.1918 },
      'new york': { lat: 40.7128, lng: -74.0060 },
      'chicago': { lat: 41.8781, lng: -87.6298 },
      'seattle': { lat: 47.6062, lng: -122.3321 }
    };

    const cityKey = Object.keys(mockCoordinates).find(city => 
      address.toLowerCase().includes(city)
    );

    if (cityKey) {
      const base = mockCoordinates[cityKey];
      return {
        lat: base.lat + (Math.random() - 0.5) * 0.1,
        lng: base.lng + (Math.random() - 0.5) * 0.1
      };
    }

    // Default to random coordinates in US
    return {
      lat: 39.8283 + (Math.random() - 0.5) * 20,
      lng: -98.5795 + (Math.random() - 0.5) * 40
    };
  };

  // Initialize map data
  useEffect(() => {
    const initializeMapData = async () => {
      const properties: MapProperty[] = [];
      
      // Add primary property
      if (analysis) {
        const coords = await geocodeAddress(analysis.property.address);
        if (coords) {
          properties.push({
            id: analysis.propertyId,
            lat: coords.lat,
            lng: coords.lng,
            address: analysis.property.address,
            price: analysis.property.purchasePrice,
            type: 'primary',
            status: analysis.meetsCriteria ? 'meets_criteria' : 'does_not_meet',
            details: analysis
          });
          setMapCenter(coords);
          setZoomLevel(12);
        }
      }

      // Add comparison properties
      for (const comp of comparisonAnalyses) {
        const coords = await geocodeAddress(comp.property.address);
        if (coords) {
          properties.push({
            id: comp.propertyId,
            lat: coords.lat,
            lng: coords.lng,
            address: comp.property.address,
            price: comp.property.purchasePrice,
            type: 'comparison',
            status: comp.meetsCriteria ? 'meets_criteria' : 'does_not_meet',
            details: comp
          });
        }
      }

      // Add comparable sales
      for (const sale of comparableSales) {
        const coords = await geocodeAddress(sale.address);
        if (coords) {
          properties.push({
            id: sale.id!,
            lat: coords.lat,
            lng: coords.lng,
            address: sale.address,
            price: sale.salePrice,
            type: 'comparable',
            details: sale
          });
        }
      }

      setMapProperties(properties);

      // Generate mock points of interest
      if (properties.length > 0) {
        const center = properties[0]; // Use first property as center
        const pois: PointOfInterest[] = [
          {
            id: '1',
            type: 'school',
            name: 'Elementary School',
            lat: center.lat + 0.01,
            lng: center.lng + 0.01,
            distance: 0.5,
            rating: 4.2
          },
          {
            id: '2',
            type: 'shopping',
            name: 'Shopping Center',
            lat: center.lat - 0.015,
            lng: center.lng + 0.02,
            distance: 1.2,
            rating: 4.0
          },
          {
            id: '3',
            type: 'transport',
            name: 'Bus Station',
            lat: center.lat + 0.005,
            lng: center.lng - 0.01,
            distance: 0.3
          },
          {
            id: '4',
            type: 'hospital',
            name: 'Medical Center',
            lat: center.lat - 0.02,
            lng: center.lng - 0.015,
            distance: 2.1,
            rating: 4.5
          },
          {
            id: '5',
            type: 'park',
            name: 'City Park',
            lat: center.lat + 0.02,
            lng: center.lng - 0.005,
            distance: 1.8,
            rating: 4.3
          }
        ];
        setPointsOfInterest(pois);
      }
    };

    initializeMapData();
  }, [analysis, comparisonAnalyses, comparableSales]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  };

  const getPropertyMarkerColor = (property: MapProperty) => {
    switch (property.type) {
      case 'primary':
        return property.status === 'meets_criteria' ? 'bg-green-600' : 'bg-red-600';
      case 'comparison':
        return property.status === 'meets_criteria' ? 'bg-blue-600' : 'bg-orange-600';
      case 'comparable':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getPOIIcon = (type: string) => {
    switch (type) {
      case 'school': return <School className="w-3 h-3" />;
      case 'shopping': return <ShoppingCart className="w-3 h-3" />;
      case 'transport': return <Car className="w-3 h-3" />;
      case 'hospital': return <Home className="w-3 h-3" />;
      case 'park': return <TrendingUp className="w-3 h-3" />;
      default: return <MapPin className="w-3 h-3" />;
    }
  };

  const handleAddressSearch = async () => {
    if (!searchAddress.trim()) return;
    
    const coords = await geocodeAddress(searchAddress);
    if (coords) {
      setMapCenter(coords);
      setZoomLevel(14);
    }
  };

  return (
    <div className="space-y-6" data-testid="map-integration">
      <div className="flex flex-col space-y-4">
        <h2 className="text-2xl font-bold">Interactive Property Map</h2>
        <p className="text-muted-foreground">
          Explore property locations, comparable sales, and nearby amenities on an interactive map.
        </p>
      </div>

      <Tabs defaultValue="map" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="map" data-testid="tab-map">
            <Map className="w-4 h-4 mr-2" />
            Interactive Map
          </TabsTrigger>
          <TabsTrigger value="properties" data-testid="tab-properties">
            <MapPin className="w-4 h-4 mr-2" />
            Properties
          </TabsTrigger>
          <TabsTrigger value="amenities" data-testid="tab-amenities">
            <Layers className="w-4 h-4 mr-2" />
            Local Amenities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Property Location Map</span>
                <div className="flex space-x-2">
                  <Select value={mapLayer} onValueChange={(value: any) => setMapLayer(value)}>
                    <SelectTrigger className="w-32" data-testid="select-map-layer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="street">Street</SelectItem>
                      <SelectItem value="satellite">Satellite</SelectItem>
                      <SelectItem value="terrain">Terrain</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPOIs(!showPOIs)}
                    data-testid="toggle-pois"
                  >
                    <Layers className="w-4 h-4 mr-2" />
                    {showPOIs ? 'Hide' : 'Show'} POIs
                  </Button>
                </div>
              </CardTitle>
              <div className="flex space-x-2">
                <Input
                  placeholder="Search address..."
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  className="flex-1"
                  data-testid="input-address-search"
                />
                <Button onClick={handleAddressSearch} data-testid="button-search">
                  <Navigation className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Mock Map Container */}
              <div 
                className="relative w-full h-96 bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25 overflow-hidden"
                data-testid="map-container"
              >
                {/* Map Background */}
                <div className={`absolute inset-0 ${
                  mapLayer === 'satellite' ? 'bg-green-100' : 
                  mapLayer === 'terrain' ? 'bg-amber-50' : 'bg-gray-100'
                }`}>
                  <div className="absolute inset-0 opacity-20">
                    {/* Grid lines to simulate map */}
                    <svg className="w-full h-full">
                      <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="1"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                  </div>
                </div>

                {/* Property Markers */}
                {mapProperties.map((property, index) => (
                  <div
                    key={property.id}
                    className={`absolute w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-pointer transform -translate-x-3 -translate-y-3 ${getPropertyMarkerColor(property)}`}
                    style={{
                      left: `${20 + (index * 15) % 60}%`,
                      top: `${30 + (index * 12) % 40}%`
                    }}
                    onClick={() => setSelectedProperty(property)}
                    data-testid={`marker-${property.id}`}
                    title={property.address}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="w-3 h-3 text-white" />
                    </div>
                  </div>
                ))}

                {/* POI Markers */}
                {showPOIs && pointsOfInterest.map((poi, index) => (
                  <div
                    key={poi.id}
                    className="absolute w-5 h-5 bg-blue-500 rounded-full border border-white shadow cursor-pointer transform -translate-x-2 -translate-y-2"
                    style={{
                      left: `${40 + (index * 10) % 40}%`,
                      top: `${50 + (index * 8) % 30}%`
                    }}
                    title={`${poi.name} (${poi.distance}mi)`}
                    data-testid={`poi-${poi.id}`}
                  >
                    <div className="w-full h-full flex items-center justify-center text-white">
                      {getPOIIcon(poi.type)}
                    </div>
                  </div>
                ))}

                {/* Map Controls */}
                <div className="absolute top-2 right-2 flex flex-col space-y-1">
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => setZoomLevel(Math.min(zoomLevel + 1, 18))}
                    data-testid="zoom-in"
                  >
                    +
                  </Button>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => setZoomLevel(Math.max(zoomLevel - 1, 1))}
                    data-testid="zoom-out"
                  >
                    -
                  </Button>
                </div>

                {/* Zoom Level Indicator */}
                <div className="absolute bottom-2 left-2 bg-white/80 rounded px-2 py-1 text-xs">
                  Zoom: {zoomLevel}
                </div>

                {/* Layer Indicator */}
                <div className="absolute bottom-2 right-2 bg-white/80 rounded px-2 py-1 text-xs capitalize">
                  {mapLayer} View
                </div>
              </div>

              {/* Map Legend */}
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                  <span>Primary Property (Meets Criteria)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                  <span>Primary Property (Doesn't Meet)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                  <span>Comparison Properties</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-purple-600 rounded-full"></div>
                  <span>Comparable Sales</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span>Points of Interest</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Property Details */}
          {selectedProperty && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Property Details</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedProperty(null)}
                    data-testid="close-property-details"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">{selectedProperty.address}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedProperty.type === 'primary' ? 'Primary Property' :
                       selectedProperty.type === 'comparison' ? 'Comparison Property' :
                       'Comparable Sale'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Price</p>
                      <p className="text-lg font-semibold">{formatCurrency(selectedProperty.price)}</p>
                    </div>
                    {selectedProperty.status && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                        <Badge className={
                          selectedProperty.status === 'meets_criteria' 
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-red-100 text-red-800 border-red-200'
                        }>
                          {selectedProperty.status === 'meets_criteria' ? 'Meets Criteria' : 'Does Not Meet'}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {selectedProperty.details && selectedProperty.type !== 'comparable' && (
                    <div className="pt-4 border-t">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Cash Flow</p>
                          <p className={`font-medium ${selectedProperty.details.cashFlow > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(selectedProperty.details.cashFlow)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">COC Return</p>
                          <p className="font-medium">{(selectedProperty.details.cocReturn * 100).toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Cap Rate</p>
                          <p className="font-medium">{(selectedProperty.details.capRate * 100).toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="properties" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mapProperties.map((property) => (
              <Card 
                key={property.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedProperty(property)}
                data-testid={`property-card-${property.id}`}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg truncate">{property.address}</span>
                    <div className={`w-3 h-3 rounded-full ${getPropertyMarkerColor(property)}`} />
                  </CardTitle>
                  <p className="text-sm text-muted-foreground capitalize">
                    {property.type} Property
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Price:</span>
                      <span className="font-medium">{formatCurrency(property.price)}</span>
                    </div>
                    {property.status && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <Badge size="sm" className={
                          property.status === 'meets_criteria' 
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-red-100 text-red-800 border-red-200'
                        }>
                          {property.status === 'meets_criteria' ? '✓' : '✗'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="amenities" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pointsOfInterest.map((poi) => (
              <Card key={poi.id} data-testid={`amenity-card-${poi.id}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                        {getPOIIcon(poi.type)}
                      </div>
                      <span className="text-lg">{poi.name}</span>
                    </div>
                    <Badge variant="outline">{poi.distance} mi</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground capitalize">{poi.type}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Distance:</span>
                      <span className="font-medium">{poi.distance} miles</span>
                    </div>
                    {poi.rating && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Rating:</span>
                        <div className="flex items-center space-x-1">
                          <span className="font-medium">{poi.rating}</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span 
                                key={i} 
                                className={`text-xs ${i < Math.floor(poi.rating!) ? 'text-yellow-400' : 'text-gray-300'}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}