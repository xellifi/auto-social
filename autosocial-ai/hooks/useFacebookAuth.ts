import { useState, useEffect } from 'react';
import { FacebookService } from '../services/facebookService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useFacebookAuth = () => {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = urlParams.get('access_token');
      const state = urlParams.get('state');

      if (!accessToken || !state?.startsWith('fb_connect_')) {
        return;
      }

      setProcessing(true);
      setError(null);

      try {
        const { data: settings } = await supabase
          .from('app_settings')
          .select('fb_app_id, fb_app_secret')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!settings?.fb_app_id || !settings?.fb_app_secret) {
          throw new Error('Facebook App credentials not configured. Please go to Settings.');
        }

        const longLivedToken = await FacebookService.exchangeToken(
          accessToken,
          settings.fb_app_id,
          settings.fb_app_secret
        );

        const userInfo = await FacebookService.getUserInfo(longLivedToken.access_token);

        const facebookAccountId = await FacebookService.saveFacebookAccount(
          user.id,
          userInfo,
          longLivedToken.access_token,
          longLivedToken.expires_in
        );

        const pages = await FacebookService.getUserPages(longLivedToken.access_token);

        await FacebookService.saveFacebookPages(facebookAccountId, pages);

        window.history.replaceState({}, document.title, window.location.pathname);
        window.location.reload();
      } catch (err: any) {
        setError(err.message || 'Failed to connect Facebook account');
        console.error('Facebook OAuth error:', err);

        setTimeout(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          window.location.reload();
        }, 3000);
      } finally {
        setProcessing(false);
      }
    };

    handleOAuthCallback();
  }, [user]);

  return { processing, error };
};
