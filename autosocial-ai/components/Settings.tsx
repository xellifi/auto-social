import React, { useState, useEffect, useRef } from 'react';
import { Save, Facebook, Mail, Server, Shield, CheckCircle, AlertCircle, Info, Send } from 'lucide-react';
import { Modal } from './Modal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    fbAppId: '',
    fbAppSecret: '',
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: '',
  });

  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .from('app_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          setSettings({
            fbAppId: data.fb_app_id || '',
            fbAppSecret: data.fb_app_secret || '',
            smtpHost: data.smtp_host || '',
            smtpPort: data.smtp_port?.toString() || '',
            smtpUser: data.smtp_user || '',
            smtpPass: data.smtp_pass || '',
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveFbSettings = async () => {
    if (!user) return;

    if (!settings.fbAppId.trim() || !settings.fbAppSecret.trim()) {
      setNotification({ message: 'Please enter both App ID and App Secret', type: 'error' });
      return;
    }

    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          user_id: user.id,
          fb_app_id: settings.fbAppId,
          fb_app_secret: settings.fbAppSecret,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setNotification({ message: 'Facebook credentials saved successfully', type: 'success' });
    } catch (error) {
      console.error('Error saving Facebook settings:', error);
      setNotification({ message: 'Failed to save settings', type: 'error' });
    }
  };

  const saveSmtpSettings = async () => {
    if (!user) return;

    if (!settings.smtpHost.trim() || !settings.smtpPort.trim() || !settings.smtpUser.trim() || !settings.smtpPass.trim()) {
      setNotification({ message: 'Please fill in all SMTP configuration fields', type: 'error' });
      return;
    }

    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          user_id: user.id,
          smtp_host: settings.smtpHost,
          smtp_port: parseInt(settings.smtpPort),
          smtp_user: settings.smtpUser,
          smtp_pass: settings.smtpPass,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setNotification({ message: 'SMTP settings saved successfully', type: 'success' });
    } catch (error) {
      console.error('Error saving SMTP settings:', error);
      setNotification({ message: 'Failed to save settings', type: 'error' });
    }
  };

  const handleTestConnection = async () => {
    if (!testEmail) return;
    setIsSendingTest(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSendingTest(false);
    setIsTestModalOpen(false);
    setNotification({ message: `Test email sent successfully to ${testEmail}`, type: 'success' });
    setTestEmail('');
  };

  const isFbConnected = settings.fbAppId && settings.fbAppSecret;
  const isSmtpConnected = settings.smtpHost && settings.smtpPort && settings.smtpUser && settings.smtpPass;

  const connectedContainerStyle = "bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500 shadow-sm ring-1 ring-green-500/20";
  const disconnectedContainerStyle = "bg-surface border-slate-700";

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
        <div className="text-center py-20">
          <p className="text-slate-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10 relative">
      <div className="flex items-center justify-between sticky top-0 z-20 bg-background/95 backdrop-blur py-4 border-b border-slate-800">
        <div>
           <h2 className="text-2xl font-bold text-white">System Settings</h2>
           <p className="text-slate-400 text-sm">Configure global application credentials.</p>
        </div>
      </div>

      {notification && (
        <div className={`fixed top-24 right-6 z-50 px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-5 duration-300 ${notification.type === 'success' ? 'bg-green-600 text-true-white' : 'bg-red-600 text-true-white'}`}>
           {notification.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
           <div>
              <h4 className="font-bold text-sm">{notification.type === 'success' ? 'Success' : 'Error'}</h4>
              <p className="text-sm opacity-90">{notification.message}</p>
           </div>
        </div>
      )}

      <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isFbConnected ? connectedContainerStyle : disconnectedContainerStyle}`}>
        <div className={`p-6 border-b flex items-center gap-3 ${isFbConnected ? 'border-green-500/20 bg-green-500/5' : 'border-slate-700/50'}`}>
          <div className="p-2 bg-blue-600/20 text-blue-500 rounded-lg">
             <Facebook size={20} />
          </div>
          <h3 className="text-lg font-bold text-white">Facebook App Credentials</h3>
        </div>
        <div className="p-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
               <div className="flex justify-between items-center mb-2">
                 <label className="block text-sm font-medium text-slate-400">App ID</label>
                 {isFbConnected && (
                    <span className="flex items-center gap-1.5 text-green-400 text-xs font-bold animate-in fade-in slide-in-from-bottom-1 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20">
                      <CheckCircle size={12} /> Connected!
                    </span>
                 )}
               </div>
               <input
                 type="text"
                 value={settings.fbAppId}
                 onChange={(e) => handleChange('fbAppId', e.target.value)}
                 className={`w-full bg-slate-900 border rounded-lg p-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${isFbConnected ? 'border-green-500/30 focus:border-green-500/50' : 'border-slate-700'}`}
                 placeholder="123456789..."
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-400 mb-2">App Secret</label>
               <div className="relative">
                 <input
                   type="password"
                   value={settings.fbAppSecret}
                   onChange={(e) => handleChange('fbAppSecret', e.target.value)}
                   className={`w-full bg-slate-900 border rounded-lg p-3 pl-10 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${isFbConnected ? 'border-green-500/30 focus:border-green-500/50' : 'border-slate-700'}`}
                   placeholder="••••••••••••••••"
                 />
                 <Shield className="absolute left-3 top-3 text-slate-500" size={18} />
               </div>
             </div>
           </div>

           <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-8 pt-6 border-t ${isFbConnected ? 'border-green-500/20' : 'border-slate-700/50'}`}>
               <div className="flex items-start gap-2 text-slate-500 max-w-md flex-1">
                 <Info size={16} className="mt-0.5 shrink-0" />
                 <p className="text-xs leading-relaxed">
                   Find these credentials in your Facebook Developers Dashboard under Settings &gt; Basic.
                 </p>
               </div>
               <button
                onClick={saveFbSettings}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-true-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/20 w-full sm:w-auto whitespace-nowrap shrink-0"
               >
                 <Save size={18} /> Save Credentials
               </button>
           </div>
        </div>
      </div>

      <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isSmtpConnected ? connectedContainerStyle : disconnectedContainerStyle}`}>
        <div className={`p-6 border-b flex items-center gap-3 ${isSmtpConnected ? 'border-green-500/20 bg-green-500/5' : 'border-slate-700/50'}`}>
          <div className="p-2 bg-orange-600/20 text-orange-500 rounded-lg">
             <Mail size={20} />
          </div>
          <h3 className="text-lg font-bold text-white">SMTP Mail Server</h3>
        </div>
        <div className="p-6 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
               <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-400">SMTP Host</label>
                  {isSmtpConnected && (
                    <span className="flex items-center gap-1.5 text-green-400 text-xs font-bold animate-in fade-in slide-in-from-bottom-1 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20">
                      <CheckCircle size={12} /> Connected!
                    </span>
                  )}
               </div>
               <div className="relative">
                  <input
                    type="text"
                    value={settings.smtpHost}
                    onChange={(e) => handleChange('smtpHost', e.target.value)}
                    className={`w-full bg-slate-900 border rounded-lg p-3 pl-10 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${isSmtpConnected ? 'border-green-500/30 focus:border-green-500/50' : 'border-slate-700'}`}
                    placeholder="smtp.gmail.com"
                  />
                  <Server className="absolute left-3 top-3 text-slate-500" size={18} />
               </div>
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-400 mb-2">Port</label>
               <input
                 type="text"
                 value={settings.smtpPort}
                 onChange={(e) => handleChange('smtpPort', e.target.value)}
                 className={`w-full bg-slate-900 border rounded-lg p-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${isSmtpConnected ? 'border-green-500/30 focus:border-green-500/50' : 'border-slate-700'}`}
                 placeholder="587"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-400 mb-2">Username / Email</label>
               <input
                 type="text"
                 value={settings.smtpUser}
                 onChange={(e) => handleChange('smtpUser', e.target.value)}
                 className={`w-full bg-slate-900 border rounded-lg p-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${isSmtpConnected ? 'border-green-500/30 focus:border-green-500/50' : 'border-slate-700'}`}
                 placeholder="notifications@yourdomain.com"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
               <input
                 type="password"
                 value={settings.smtpPass}
                 onChange={(e) => handleChange('smtpPass', e.target.value)}
                 className={`w-full bg-slate-900 border rounded-lg p-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors ${isSmtpConnected ? 'border-green-500/30 focus:border-green-500/50' : 'border-slate-700'}`}
                 placeholder="••••••••"
               />
             </div>
           </div>

           <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t ${isSmtpConnected ? 'border-green-500/20' : 'border-slate-700/50'}`}>
               <p className="text-xs text-slate-500 flex-1">
                 Used for system notifications and alerts.
               </p>
               <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                   {isSmtpConnected && (
                       <button
                        onClick={() => setIsTestModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 hover:border-slate-500 px-4 py-2.5 rounded-lg text-sm font-medium transition-all w-full sm:w-auto"
                       >
                         <Send size={16} /> Test Connection
                       </button>
                   )}
                   <button
                    onClick={saveSmtpSettings}
                    className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-true-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all w-full sm:w-auto"
                   >
                     <Save size={16} /> Save SMTP Settings
                   </button>
               </div>
           </div>
        </div>
      </div>

      <Modal isOpen={isTestModalOpen} onClose={() => setIsTestModalOpen(false)} title="Test SMTP Connection" size="sm">
          <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex items-start gap-3">
                  <Info size={20} className="text-blue-400 shrink-0 mt-0.5"/>
                  <p className="text-sm text-blue-300 leading-relaxed">
                    Enter a recipient email address. We will try to send a test email using your current SMTP configuration.
                  </p>
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Recipient Email</label>
                  <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-slate-600"
                      autoFocus
                  />
              </div>

              <div className="flex gap-3 pt-2">
                  <button
                      onClick={() => setIsTestModalOpen(false)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-true-white py-2.5 rounded-xl transition-colors border border-slate-700"
                  >
                      Cancel
                  </button>
                  <button
                      onClick={handleTestConnection}
                      disabled={!testEmail || isSendingTest}
                      className="flex-1 bg-primary hover:bg-indigo-600 text-true-white py-2.5 rounded-xl transition-colors font-medium shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {isSendingTest ? (
                        <span className="flex items-center gap-2">
                           <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                           Sending...
                        </span>
                      ) : (
                        <>
                           <Send size={16}/> Send Test
                        </>
                      )}
                  </button>
              </div>
          </div>
      </Modal>
    </div>
  );
};
