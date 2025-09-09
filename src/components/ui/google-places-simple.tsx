"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';
import { MapPin, Loader2 } from 'lucide-react';

interface GooglePlacesSimpleProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: any) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// Declare Google Maps types
declare global {
  interface Window {
    google: any;
    initGoogleMapsSimple: () => void;
  }
}

const GooglePlacesSimple: React.FC<GooglePlacesSimpleProps> = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Enter an address",
  className,
  disabled = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);

  useEffect(() => {
    loadGoogleMapsAPI();
  }, []);

  const loadGoogleMapsAPI = async () => {
    try {
      setIsLoading(true);
      
      // Check if already loaded
      if (window.google && window.google.maps) {
        setIsApiLoaded(true);
        setIsLoading(false);
        initializeServices();
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Wait for it to load
        existingScript.addEventListener('load', () => {
          setIsApiLoaded(true);
          setIsLoading(false);
          initializeServices();
        });
        return;
      }

      // Load the Google Maps API with Places library
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMapsSimple`;
      script.async = true;
      script.defer = true;
      
      // Set up global callback
      window.initGoogleMapsSimple = () => {
        setIsApiLoaded(true);
        setIsLoading(false);
        initializeServices();
      };
      
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
        setIsLoading(false);
      };

      document.head.appendChild(script);
    } catch (error) {
      console.error('Error loading Google Maps API:', error);
      setIsLoading(false);
    }
  };

  const initializeServices = () => {
    if (window.google && window.google.maps && window.google.maps.places) {
      try {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        placesService.current = new window.google.maps.places.PlacesService(
          document.createElement('div')
        );
      } catch (error) {
        console.error('Error initializing Google Places services:', error);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    if (inputValue.length > 2 && autocompleteService.current) {
      setIsLoading(true);
      
      const request = {
        input: inputValue,
        types: ['establishment', 'geocode'],
        componentRestrictions: { country: ['in', 'us', 'ca', 'gb', 'au'] }
      };

      autocompleteService.current.getPlacePredictions(request, (predictions: any[], status: any) => {
        setIsLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setPredictions(predictions);
          setShowPredictions(true);
        } else {
          setPredictions([]);
          setShowPredictions(false);
        }
      });
    } else {
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  const handlePredictionClick = (prediction: any) => {
    onChange(prediction.description);
    setShowPredictions(false);
    setPredictions([]);

    if (onPlaceSelect && placesService.current) {
      const request = {
        placeId: prediction.place_id,
        fields: ['name', 'formatted_address', 'geometry', 'address_components', 'types']
      };

      placesService.current.getDetails(request, (place: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          onPlaceSelect(place);
        }
      });
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowPredictions(false);
    }, 200);
  };

  const handleFocus = () => {
    if (predictions.length > 0) {
      setShowPredictions(true);
    }
  };

  // If API is not loaded yet, show loading state
  if (!isApiLoaded) {
    return (
      <div className={cn("relative", className)}>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={placeholder}
            disabled={disabled || true}
            className="pl-10 pr-10"
          />
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {showPredictions && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {predictions.map((prediction, index) => (
            <div
              key={index}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handlePredictionClick(prediction)}
            >
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {prediction.structured_formatting?.main_text || prediction.description}
                  </p>
                  {prediction.structured_formatting?.secondary_text && (
                    <p className="text-xs text-gray-500 truncate">
                      {prediction.structured_formatting.secondary_text}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GooglePlacesSimple;
