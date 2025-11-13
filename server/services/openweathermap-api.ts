/**
 * OpenWeatherMap API Service
 *
 * Free tier: 1,000 calls/day, 60 calls/minute
 * Sign up: https://openweathermap.org/api
 */

import axios from 'axios';

const API_KEY = process.env.OPENWEATHERMAP_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export interface CurrentWeather {
  temp?: number;
  feelsLike?: number;
  tempMin?: number;
  tempMax?: number;
  pressure?: number;
  humidity?: number;
  description?: string;
  icon?: string;
  windSpeed?: number;
  clouds?: number;
  visibility?: number;
}

export const openWeatherMapAPI = {
  /**
   * Get current weather data for coordinates
   */
  async getCurrentWeather(params: {
    lat: number;
    lon: number;
  }): Promise<CurrentWeather> {
    if (!API_KEY) {
      console.warn('OpenWeatherMap API key not configured');
      return {};
    }

    try {
      const response = await axios.get(`${BASE_URL}/weather`, {
        params: {
          lat: params.lat,
          lon: params.lon,
          appid: API_KEY,
          units: 'imperial', // Fahrenheit
        },
        timeout: 10000,
      });

      const data = response.data;

      return {
        temp: data.main?.temp,
        feelsLike: data.main?.feels_like,
        tempMin: data.main?.temp_min,
        tempMax: data.main?.temp_max,
        pressure: data.main?.pressure,
        humidity: data.main?.humidity,
        description: data.weather?.[0]?.description,
        icon: data.weather?.[0]?.icon,
        windSpeed: data.wind?.speed,
        clouds: data.clouds?.all,
        visibility: data.visibility,
      };
    } catch (error) {
      console.error('OpenWeatherMap API error:', error);
      return {};
    }
  },

  /**
   * Get 5-day weather forecast
   */
  async getForecast(params: {
    lat: number;
    lon: number;
  }): Promise<any[]> {
    if (!API_KEY) {
      console.warn('OpenWeatherMap API key not configured');
      return [];
    }

    try {
      const response = await axios.get(`${BASE_URL}/forecast`, {
        params: {
          lat: params.lat,
          lon: params.lon,
          appid: API_KEY,
          units: 'imperial',
        },
        timeout: 10000,
      });

      return response.data.list || [];
    } catch (error) {
      console.error('OpenWeatherMap forecast API error:', error);
      return [];
    }
  },
};
