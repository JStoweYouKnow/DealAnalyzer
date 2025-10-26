import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image as ImageIcon, Brain, Camera, Star, AlertTriangle, CheckCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Property } from "@shared/schema";

interface PhotoAnalysis {
  id: string;
  url: string;
  filename: string;
  aiScore: number;
  qualityScore: number;
  compositionScore: number;
  lightingScore: number;
  propertyConditionScore: number;
  insights: string[];
  suggestions: string[];
  tags: string[];
  roomType?: string;
  marketability: 'high' | 'medium' | 'low';
  analysisDate: string;
}

interface AIPhotoScoringProps {
  property: Property;
  existingPhotos?: string[];
}

export function AIPhotoScoring({ property, existingPhotos = [] }: AIPhotoScoringProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch photo analyses
  const { data: photoAnalyses = [], isLoading } = useQuery<PhotoAnalysis[]>({
    queryKey: ['/api/properties', property.id, 'photo-analyses'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/properties/${property.id}/photo-analyses`);
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!property.id
  });

  // Upload and analyze photos mutation
  const uploadPhotosMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`photos`, file);
      });
      formData.append('propertyId', property.id || '');
      formData.append('propertyType', property.propertyType);
      formData.append('propertyDescription', property.description);

      const response = await fetch('/api/analyze-property-photos', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['/api/properties', property.id, 'photo-analyses'] });
        setSelectedFiles([]);
        toast({
          title: "Photos Analyzed",
          description: `Successfully analyzed ${data.data?.length || 0} photos with AI insights.`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze photos",
        variant: "destructive",
      });
    }
  });

  // Delete photo analysis mutation
  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: string) => {
      const response = await apiRequest('DELETE', `/api/properties/${property.id}/photo-analyses/${photoId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties', property.id, 'photo-analyses'] });
      setSelectedPhoto(null);
      toast({
        title: "Photo Deleted",
        description: "Photo analysis has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete photo",
        variant: "destructive",
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      toast({
        title: "Invalid Files",
        description: "Only image files are allowed.",
        variant: "destructive",
      });
    }
    
    setSelectedFiles(prev => [...prev, ...imageFiles]);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const files = Array.from(event.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...imageFiles]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyzePhotos = () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Photos Selected",
        description: "Please select photos to analyze.",
        variant: "destructive",
      });
      return;
    }
    
    uploadPhotosMutation.mutate(selectedFiles);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const getMarketabilityBadge = (marketability: string) => {
    switch (marketability) {
      case 'high':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const averageScore = photoAnalyses.length > 0 
    ? photoAnalyses.reduce((sum, analysis) => sum + analysis.aiScore, 0) / photoAnalyses.length 
    : 0;

  const selectedAnalysis = photoAnalyses.find(analysis => analysis.id === selectedPhoto);

  return (
    <div className="space-y-6" data-testid="ai-photo-scoring">
      <div className="flex flex-col space-y-4">
        <h2 className="text-2xl font-bold">AI Photo Analysis & Scoring</h2>
        <p className="text-muted-foreground">
          Upload property photos to get AI-powered quality scores, composition analysis, and marketing insights.
        </p>
      </div>

      {/* Overall Score Summary */}
      {photoAnalyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Photo Portfolio Overview</span>
              <Badge className={getMarketabilityBadge(
                averageScore >= 80 ? 'high' : averageScore >= 60 ? 'medium' : 'low'
              )}>
                {averageScore >= 80 ? 'High' : averageScore >= 60 ? 'Medium' : 'Low'} Marketability
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{photoAnalyses.length}</p>
                <p className="text-sm text-muted-foreground">Photos Analyzed</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
                  {averageScore.toFixed(1)}
                </p>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {photoAnalyses.filter(p => p.marketability === 'high').length}
                </p>
                <p className="text-sm text-muted-foreground">High Quality Photos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {photoAnalyses.filter(p => p.roomType).length}
                </p>
                <p className="text-sm text-muted-foreground">Rooms Identified</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" data-testid="tab-upload">
            <Upload className="w-4 h-4 mr-2" />
            Upload & Analyze
          </TabsTrigger>
          <TabsTrigger value="gallery" data-testid="tab-gallery">
            <ImageIcon className="w-4 h-4 mr-2" />
            Photo Gallery
          </TabsTrigger>
          <TabsTrigger value="insights" data-testid="tab-insights">
            <Brain className="w-4 h-4 mr-2" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Property Photos</CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload photos to get AI-powered analysis of quality, composition, lighting, and marketability.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver 
                    ? 'border-primary bg-primary/10' 
                    : 'border-muted-foreground/25 hover:border-primary'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                data-testid="file-drop-zone"
              >
                <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  Drag and drop photos here, or click to browse
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports JPG, PNG, WEBP up to 10MB each
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="photo-upload"
                  data-testid="file-input"
                />
                <label htmlFor="photo-upload">
                  <Button variant="outline" className="cursor-pointer" data-testid="browse-button">
                    Browse Files
                  </Button>
                </label>
              </div>

              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Selected Photos ({selectedFiles.length})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0"
                          onClick={() => removeSelectedFile(index)}
                          data-testid={`remove-file-${index}`}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                        <p className="text-xs mt-1 truncate">{file.name}</p>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={handleAnalyzePhotos}
                    disabled={uploadPhotosMutation.isPending}
                    className="w-full"
                    data-testid="analyze-button"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    {uploadPhotosMutation.isPending ? 'Analyzing...' : `Analyze ${selectedFiles.length} Photos`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading photo analyses...</div>
          ) : photoAnalyses.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No photos analyzed yet.</p>
                <p className="text-sm text-muted-foreground mt-2">Upload photos to see AI analysis results.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {photoAnalyses.map((analysis) => (
                <Card 
                  key={analysis.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedPhoto === analysis.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedPhoto(analysis.id)}
                  data-testid={`photo-card-${analysis.id}`}
                >
                  <div className="relative">
                    <img
                      src={analysis.url}
                      alt={analysis.filename}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <Badge 
                      className={`absolute top-2 right-2 ${getMarketabilityBadge(analysis.marketability)}`}
                    >
                      {analysis.marketability}
                    </Badge>
                    <div className="absolute bottom-2 left-2">
                      <div className="flex items-center space-x-1 bg-black/50 text-white px-2 py-1 rounded">
                        <Star className="w-3 h-3" />
                        <span className="text-sm font-medium">{analysis.aiScore}</span>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium truncate mb-2">{analysis.filename}</h3>
                    <div className="space-y-2">
                      {analysis.roomType && (
                        <Badge variant="outline" className="text-xs">{analysis.roomType}</Badge>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Quality</p>
                          <p className={`font-medium ${getScoreColor(analysis.qualityScore)}`}>
                            {analysis.qualityScore}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Composition</p>
                          <p className={`font-medium ${getScoreColor(analysis.compositionScore)}`}>
                            {analysis.compositionScore}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {selectedAnalysis ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Photo Analysis</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePhotoMutation.mutate(selectedAnalysis.id)}
                      disabled={deletePhotoMutation.isPending}
                      data-testid="delete-photo-button"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <img
                    src={selectedAnalysis.url}
                    alt={selectedAnalysis.filename}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Overall Score</span>
                        <span className={`text-sm font-bold ${getScoreColor(selectedAnalysis.aiScore)}`}>
                          {selectedAnalysis.aiScore}/100
                        </span>
                      </div>
                      <Progress value={selectedAnalysis.aiScore} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Image Quality</span>
                        <span className={`text-sm font-bold ${getScoreColor(selectedAnalysis.qualityScore)}`}>
                          {selectedAnalysis.qualityScore}/100
                        </span>
                      </div>
                      <Progress value={selectedAnalysis.qualityScore} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Composition</span>
                        <span className={`text-sm font-bold ${getScoreColor(selectedAnalysis.compositionScore)}`}>
                          {selectedAnalysis.compositionScore}/100
                        </span>
                      </div>
                      <Progress value={selectedAnalysis.compositionScore} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Lighting</span>
                        <span className={`text-sm font-bold ${getScoreColor(selectedAnalysis.lightingScore)}`}>
                          {selectedAnalysis.lightingScore}/100
                        </span>
                      </div>
                      <Progress value={selectedAnalysis.lightingScore} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Property Condition</span>
                        <span className={`text-sm font-bold ${getScoreColor(selectedAnalysis.propertyConditionScore)}`}>
                          {selectedAnalysis.propertyConditionScore}/100
                        </span>
                      </div>
                      <Progress value={selectedAnalysis.propertyConditionScore} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                      AI Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedAnalysis.insights.map((insight, index) => (
                        <li key={index} className="text-sm flex items-start">
                          <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-2 flex-shrink-0" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                      Improvement Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedAnalysis.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-sm flex items-start">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Photo Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedAnalysis.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Select a photo from the gallery to view AI insights.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}