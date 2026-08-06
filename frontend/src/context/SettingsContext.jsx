import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { getPublicApiBase } from '../utils/publicApi';

const SettingsContext = createContext();

const getInitialSettings = () => {
  try {
    const cached = localStorage.getItem('cachedAppSettings');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading cached settings:', e);
  }
  return {
    companyName: 'Smart Plaza BD',
    companyAddress: '1 KDA Avenue, Shibbari, Khulna, Khulna, Bangladesh, 9100',
    phone: '01842-144844',
    email: 'smartplazabd@gmail.com',
    website: '',
    logo: ''
  };
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(getInitialSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const publicBase = getPublicApiBase();
      const token = localStorage.getItem('token');
      let data = null;

      if (token) {
        try {
          const apiBase = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : 'http://localhost:5001/api';
          const authRes = await axios.get(`${apiBase}/settings`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (authRes.data && authRes.data.success && authRes.data.data) {
            data = authRes.data.data;
          }
        } catch (authErr) {
          // Suppress connection refused logs when backend is restarting or offline
        }
      }

      if (!data) {
        try {
          const res = await axios.get(`${publicBase}/settings`);
          if (res.data && res.data.success && res.data.data) {
            data = res.data.data;
          }
        } catch (pubErr) {
          // Suppress connection refused logs
        }
      }

      if (data) {
        setSettings(prev => {
          const updated = {
            ...prev,
            ...data
          };
          try {
            localStorage.setItem('cachedAppSettings', JSON.stringify(updated));
          } catch (e) {
            console.error('Error caching settings:', e);
          }
          return updated;
        });
        if (data.companyName) {
          document.title = `${data.companyName} - Electronics & Accessories Shop`;
        }
        const iconSrc = data.favicon || data.logo;
        if (iconSrc && !iconSrc.includes('google.com/imgres')) {
          const links = document.querySelectorAll("link[rel*='icon']");
          links.forEach(link => {
            link.href = iconSrc;
          });
        }
      }
    } catch (err) {
      // General error fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    const handleShopSwitched = () => {
      fetchSettings();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('shopSwitched', handleShopSwitched);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('shopSwitched', handleShopSwitched);
      }
    };
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, setSettings, fetchSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export default SettingsContext;
