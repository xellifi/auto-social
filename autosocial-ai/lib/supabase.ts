import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          updated_at?: string;
        };
      };
      facebook_accounts: {
        Row: {
          id: string;
          user_id: string;
          facebook_user_id: string;
          name: string;
          email: string | null;
          access_token: string;
          token_expires_at: string | null;
          avatar_url: string | null;
          is_connected: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          facebook_user_id: string;
          name: string;
          email?: string | null;
          access_token: string;
          token_expires_at?: string | null;
          avatar_url?: string | null;
          is_connected?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          email?: string | null;
          access_token?: string;
          token_expires_at?: string | null;
          avatar_url?: string | null;
          is_connected?: boolean;
          updated_at?: string;
        };
      };
      facebook_pages: {
        Row: {
          id: string;
          facebook_account_id: string;
          page_id: string;
          name: string;
          access_token: string;
          category: string | null;
          followers_count: number;
          avatar_url: string | null;
          automation_enabled: boolean;
          ai_instructions: string;
          instagram_account_id: string | null;
          instagram_username: string | null;
          instagram_avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          facebook_account_id: string;
          page_id: string;
          name: string;
          access_token: string;
          category?: string | null;
          followers_count?: number;
          avatar_url?: string | null;
          automation_enabled?: boolean;
          ai_instructions?: string;
          instagram_account_id?: string | null;
          instagram_username?: string | null;
          instagram_avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          access_token?: string;
          category?: string | null;
          followers_count?: number;
          avatar_url?: string | null;
          automation_enabled?: boolean;
          ai_instructions?: string;
          instagram_account_id?: string | null;
          instagram_username?: string | null;
          instagram_avatar_url?: string | null;
          updated_at?: string;
        };
      };
      scheduled_posts: {
        Row: {
          id: string;
          facebook_page_id: string;
          content: string | null;
          media_type: string;
          media_url: string | null;
          scheduled_time: string;
          status: string;
          recurrence: string;
          facebook_post_id: string | null;
          created_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          facebook_page_id: string;
          content?: string | null;
          media_type?: string;
          media_url?: string | null;
          scheduled_time: string;
          status?: string;
          recurrence?: string;
          facebook_post_id?: string | null;
          created_at?: string;
          published_at?: string | null;
        };
        Update: {
          content?: string | null;
          media_type?: string;
          media_url?: string | null;
          scheduled_time?: string;
          status?: string;
          recurrence?: string;
          facebook_post_id?: string | null;
          published_at?: string | null;
        };
      };
      api_configurations: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          api_key: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: string;
          api_key: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          provider?: string;
          api_key?: string;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      app_settings: {
        Row: {
          id: string;
          user_id: string;
          fb_app_id: string | null;
          fb_app_secret: string | null;
          smtp_host: string | null;
          smtp_port: number | null;
          smtp_user: string | null;
          smtp_pass: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          fb_app_id?: string | null;
          fb_app_secret?: string | null;
          smtp_host?: string | null;
          smtp_port?: number | null;
          smtp_user?: string | null;
          smtp_pass?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          fb_app_id?: string | null;
          fb_app_secret?: string | null;
          smtp_host?: string | null;
          smtp_port?: number | null;
          smtp_user?: string | null;
          smtp_pass?: string | null;
          updated_at?: string;
        };
      };
    };
  };
};
