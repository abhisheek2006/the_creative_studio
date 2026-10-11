import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get('/settings/public');
        if (active) setSettings(res.data.data.settings);
      } catch (_err) {
        if (active) {
          setSettings({
            businessName: 'The Creative Studio',
            tagline: 'Create • Craft • Customize • Share Happiness.',
            whatsappNumber: '919679573542',
            instagramUrl: 'https://www.instagram.com/the_creativestudio26/',
            instagramUsername: '@the_creativestudio26',
            currency: 'INR',
            announcementBarText: 'Handmade with Love, Just for You.',
            deliveryInformation:
              'Delivery charges are confirmed on WhatsApp based on your location and order size. Local pickup is also available.',
            footerText: 'Handmade gifts, paintings, flowers and printing services made with love.',
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({ settings, loading, setSettings }), [settings, loading]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}