import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs';

export interface Signal {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  description: string;
  image_url: string;
  latitude: number;
  longitude: number;
  tags: string[];
  created_at: string;
}

export interface NearbySignal extends Signal {
  distance: number;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private authService: AuthService) {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );
  }

  private async getHeaders(): Promise<HeadersInit> {
    const user = this.authService.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const token = await user.getIdToken();
    return {
      apikey: environment.supabase.anonKey,
      Authorization: `Bearer ${token}`,
    };
  }

  async getNearbySignals(
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ): Promise<NearbySignal[]> {
    const { data, error } = await this.supabase.rpc('get_nearby_signals', {
      p_latitude: latitude,
      p_longitude: longitude,
      p_radius_km: radiusKm,
    });

    if (error) {
      console.error('Error fetching nearby signals:', error);
      throw error;
    }

    return data || [];
  }

  async getSignalsByTags(
    tags: string[],
    page: number = 0,
    limit: number = 20
  ): Promise<Signal[]> {
    let query = this.supabase
      .from('signals')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (tags.length > 0) {
      query = query.overlaps('tags', tags);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching signals by tags:', error);
      throw error;
    }

    return data || [];
  }

  async createSignal(signal: Omit<Signal, 'id' | 'created_at'>): Promise<Signal> {
    const { data, error } = await this.supabase
      .from('signals')
      .insert(signal)
      .select()
      .single();

    if (error) {
      console.error('Error creating signal:', error);
      throw error;
    }

    return data;
  }

  async deleteSignal(signalId: string): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await this.supabase
      .from('signals')
      .delete()
      .eq('id', signalId)
      .eq('user_id', user.uid);

    if (error) {
      console.error('Error deleting signal:', error);
      throw error;
    }
  }

  async updateSignal(
    signalId: string,
    updates: Partial<Pick<Signal, 'title' | 'description' | 'tags' | 'image_url'>>
  ): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await this.supabase
      .from('signals')
      .update(updates)
      .eq('id', signalId)
      .eq('user_id', user.uid);

    if (error) {
      console.error('Error updating signal:', error);
      throw error;
    }
  }

  async updateSignalImage(signalId: string, imageUrl: string): Promise<void> {
    const { error } = await this.supabase
      .from('signals')
      .update({ image_url: imageUrl })
      .eq('id', signalId);

    if (error) {
      console.error('Error updating signal image:', error);
      throw error;
    }
  }

  async getUserSignals(): Promise<Signal[]> {
    const user = this.authService.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await this.supabase
      .from('signals')
      .select('*')
      .eq('user_id', user.uid)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user signals:', error);
      throw error;
    }

    return data || [];
  }

  async deleteUserSignals(): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await this.supabase
      .from('signals')
      .delete()
      .eq('user_id', user.uid);

    if (error) {
      console.error('Error deleting user signals:', error);
      throw error;
    }
  }
}
