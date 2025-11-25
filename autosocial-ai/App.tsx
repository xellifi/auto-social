import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Replies } from './components/Replies';
import { Activity } from './components/Activity';
import { Poster } from './components/Poster';
import { ApiManager } from './components/ApiManager';
import { Settings } from './components/Settings';
import { Guide } from './components/Guide';
import { Legal } from './components/Legal';
import { View, ApiConfig } from './types';
import { useFacebookAuth } from './hooks/useFacebookAuth';
import { supabase } from './lib/supabase';
import { FacebookService } from './services/facebookService';
import { Loader2 } from 'lucide-react';

const DEFAULT_APIS: ApiConfig[] = [
  { provider: 'openai', apiKey: '', isActive: false },
  { provider: 'deepseek', apiKey: '', isActive: false },
  { provider: 'anthropic', apiKey: '', isActive: false },
  { provider: 'mistral', apiKey: '', isActive: false },
  { provider: 'xai', apiKey: '', isActive: false },
  { provider: 'cohere', apiKey: '', isActive: false },
  { provider: 'gemini', apiKey: '', isActive: true },
  { provider: 'stability', apiKey: '', isActive: false },
  { provider: 'veo', apiKey: '', isActive: false },
  { provider: 'runway', apiKey: '', isActive: false },
  { provider: 'luma', apiKey: '', isActive: false },
];

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { processing: fbProcessing, error: fbError } = useFacebookAuth();

  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [pages, setPages] = useState<any[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>(DEFAULT_APIS);
  const [facebookAccount, setFacebookAccount] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });
  const [unreadNotifications] = useState(3);
  const [repliesSelectedPageId, setRepliesSelectedPageId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.body.classList.remove('light-mode');
      document.documentElement.classList.add('dark');
    } else {
      document.body.classList.add('light-mode');
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!repliesSelectedPageId && pages.length > 0) {
      setRepliesSelectedPageId(pages[0].id);
    }
  }, [pages, repliesSelectedPageId]);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const fbAccount = await FacebookService.getFacebookAccount(user.id);
        setFacebookAccount(fbAccount);

        if (fbAccount) {
          const fbPages = await FacebookService.getFacebookPages(fbAccount.id);
          const mappedPages = fbPages.map(p => ({
            id: p.id,
            name: p.name,
            accessToken: p.access_token,
            isConnected: true,
            automationEnabled: p.automation_enabled,
            followers: p.followers_count,
            aiInstructions: p.ai_instructions,
            avatarUrl: p.avatar_url,
            connectedInstagram: p.instagram_username,
            instagramAvatarUrl: p.instagram_avatar_url,
          }));
          setPages(mappedPages);

          const { data: posts } = await supabase
            .from('scheduled_posts')
            .select('*')
            .in('facebook_page_id', fbPages.map(p => p.id))
            .order('scheduled_time', { ascending: false });

          if (posts) {
            const mappedPosts = posts.map(p => ({
              id: p.id,
              pageId: p.facebook_page_id,
              content: p.content,
              mediaType: p.media_type,
              mediaUrl: p.media_url,
              scheduledTime: p.scheduled_time,
              status: p.status,
              recurrence: p.recurrence,
            }));
            setScheduledPosts(mappedPosts);
          }
        }

        const { data: apiData } = await supabase
          .from('api_configurations')
          .select('*')
          .eq('user_id', user.id);

        if (apiData && apiData.length > 0) {
          const merged = DEFAULT_APIS.map(def => {
            const existing = apiData.find(p => p.provider === def.provider);
            return existing ? {
              provider: existing.provider as any,
              apiKey: existing.api_key,
              isActive: existing.is_active
            } : def;
          });
          setApiConfigs(merged);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  useEffect(() => {
    const saveApiConfigs = async () => {
      if (!user) return;

      const configsToSave = apiConfigs.filter(c => c.apiKey);

      for (const config of configsToSave) {
        await supabase
          .from('api_configurations')
          .upsert({
            user_id: user.id,
            provider: config.provider,
            api_key: config.apiKey,
            is_active: config.isActive,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,provider'
          });
      }
    };

    const debounce = setTimeout(() => {
      saveApiConfigs();
    }, 1000);

    return () => clearTimeout(debounce);
  }, [apiConfigs, user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (fbProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Connecting Facebook Account</h3>
          <p className="text-slate-400">Please wait while we fetch your pages...</p>
        </div>
      </div>
    );
  }

  if (fbError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md bg-red-500/10 border border-red-500/20 rounded-xl p-6">
          <h3 className="text-xl font-bold text-red-400 mb-2">Connection Failed</h3>
          <p className="text-red-300 mb-4">{fbError}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-primary hover:bg-indigo-600 text-true-white px-6 py-2 rounded-lg"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return (
          <Dashboard
            pages={pages}
            setPages={setPages}
            scheduledPosts={scheduledPosts}
            facebookAccount={facebookAccount}
            onNavigateToReplies={(pageId) => {
              setRepliesSelectedPageId(pageId);
              setCurrentView(View.REPLIES);
            }}
            onNavigateToGuide={() => setCurrentView(View.GUIDE)}
            isDarkMode={isDarkMode}
            toggleTheme={() => setIsDarkMode(!isDarkMode)}
          />
        );
      case View.REPLIES:
        return (
          <Replies
            pages={pages}
            setPages={setPages}
            apiConfigs={apiConfigs}
            selectedPageId={repliesSelectedPageId}
            setSelectedPageId={setRepliesSelectedPageId}
            onClose={() => setCurrentView(View.DASHBOARD)}
            onNavigateToApiManager={() => setCurrentView(View.API_MANAGER)}
          />
        );
      case View.ACTIVITY:
        return <Activity pages={pages} />;
      case View.POSTER:
        return <Poster pages={pages} scheduledPosts={scheduledPosts} setScheduledPosts={setScheduledPosts} apiConfigs={apiConfigs} />;
      case View.API_MANAGER:
        return <ApiManager apiConfigs={apiConfigs} setApiConfigs={setApiConfigs} />;
      case View.SETTINGS:
        return <Settings />;
      case View.GUIDE:
        return <Guide onClose={() => setCurrentView(View.DASHBOARD)} />;
      case View.LEGAL:
        return <Legal />;
      default:
        return (
          <Dashboard
            pages={pages}
            setPages={setPages}
            scheduledPosts={scheduledPosts}
            facebookAccount={facebookAccount}
            onNavigateToReplies={() => {}}
            onNavigateToGuide={() => {}}
            isDarkMode={isDarkMode}
            toggleTheme={() => setIsDarkMode(!isDarkMode)}
          />
        );
    }
  };

  return (
    <Layout
      currentView={currentView}
      setCurrentView={setCurrentView}
      isDarkMode={isDarkMode}
      toggleTheme={() => setIsDarkMode(!isDarkMode)}
      unreadNotifications={unreadNotifications}
    >
      {renderView()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
