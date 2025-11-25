import { supabase } from '../lib/supabase';

interface FacebookUser {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  fan_count?: number;
  picture?: {
    data: {
      url: string;
    };
  };
  instagram_business_account?: {
    id: string;
    username: string;
  };
}

export class FacebookService {
  private static FB_API_VERSION = 'v19.0';
  private static FB_GRAPH_URL = `https://graph.facebook.com/${FacebookService.FB_API_VERSION}`;

  static async getUserInfo(accessToken: string): Promise<FacebookUser> {
    const response = await fetch(
      `${this.FB_GRAPH_URL}/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch user info');
    }

    return response.json();
  }

  static async getUserPages(accessToken: string): Promise<FacebookPage[]> {
    const response = await fetch(
      `${this.FB_GRAPH_URL}/me/accounts?fields=id,name,access_token,category,fan_count,picture.type(large),instagram_business_account{id,username}&access_token=${accessToken}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch pages');
    }

    const data = await response.json();
    return data.data || [];
  }

  static async getInstagramAvatar(instagramAccountId: string, pageAccessToken: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.FB_GRAPH_URL}/${instagramAccountId}?fields=profile_picture_url&access_token=${pageAccessToken}`
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.profile_picture_url || null;
    } catch (error) {
      console.error('Error fetching Instagram avatar:', error);
      return null;
    }
  }

  static async exchangeToken(shortLivedToken: string, appId: string, appSecret: string): Promise<{
    access_token: string;
    expires_in: number;
  }> {
    const response = await fetch(
      `${this.FB_GRAPH_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to exchange token');
    }

    return response.json();
  }

  static async saveFacebookAccount(
    userId: string,
    userInfo: FacebookUser,
    accessToken: string,
    expiresIn: number
  ): Promise<string> {
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const { data, error } = await supabase
      .from('facebook_accounts')
      .upsert({
        user_id: userId,
        facebook_user_id: userInfo.id,
        name: userInfo.name,
        email: userInfo.email || null,
        access_token: accessToken,
        token_expires_at: expiresAt,
        avatar_url: userInfo.picture?.data?.url || null,
        is_connected: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'facebook_user_id'
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  static async saveFacebookPages(
    facebookAccountId: string,
    pages: FacebookPage[]
  ): Promise<void> {
    const pagesData = await Promise.all(
      pages.map(async (page) => {
        let instagramAvatarUrl = null;

        if (page.instagram_business_account) {
          instagramAvatarUrl = await this.getInstagramAvatar(
            page.instagram_business_account.id,
            page.access_token
          );
        }

        return {
          facebook_account_id: facebookAccountId,
          page_id: page.id,
          name: page.name,
          access_token: page.access_token,
          category: page.category || null,
          followers_count: page.fan_count || 0,
          avatar_url: page.picture?.data?.url || null,
          automation_enabled: false,
          ai_instructions: '',
          instagram_account_id: page.instagram_business_account?.id || null,
          instagram_username: page.instagram_business_account?.username || null,
          instagram_avatar_url: instagramAvatarUrl,
          updated_at: new Date().toISOString(),
        };
      })
    );

    const { error } = await supabase
      .from('facebook_pages')
      .upsert(pagesData, {
        onConflict: 'page_id'
      });

    if (error) throw error;
  }

  static async getFacebookAccount(userId: string) {
    const { data, error } = await supabase
      .from('facebook_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_connected', true)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async getFacebookPages(facebookAccountId: string) {
    const { data, error } = await supabase
      .from('facebook_pages')
      .select('*')
      .eq('facebook_account_id', facebookAccountId)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async disconnectFacebookAccount(facebookAccountId: string) {
    const { error } = await supabase
      .from('facebook_accounts')
      .update({ is_connected: false, updated_at: new Date().toISOString() })
      .eq('id', facebookAccountId);

    if (error) throw error;
  }

  static async deleteFacebookAccount(facebookAccountId: string) {
    const { error } = await supabase
      .from('facebook_accounts')
      .delete()
      .eq('id', facebookAccountId);

    if (error) throw error;
  }

  static async updatePageAutomation(pageId: string, enabled: boolean) {
    const { error } = await supabase
      .from('facebook_pages')
      .update({
        automation_enabled: enabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', pageId);

    if (error) throw error;
  }

  static async updatePageAiInstructions(pageId: string, instructions: string) {
    const { error } = await supabase
      .from('facebook_pages')
      .update({
        ai_instructions: instructions,
        updated_at: new Date().toISOString()
      })
      .eq('id', pageId);

    if (error) throw error;
  }

  static async deletePage(pageId: string) {
    const { error } = await supabase
      .from('facebook_pages')
      .delete()
      .eq('id', pageId);

    if (error) throw error;
  }
}
