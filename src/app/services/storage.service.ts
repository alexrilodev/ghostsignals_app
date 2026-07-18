import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private supabase: SupabaseClient;

  constructor(private authService: AuthService) {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );
  }

  async uploadSignalImage(
    base64String: string,
    format: string
  ): Promise<string> {
    const user = this.authService.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const timestamp = Date.now();
    const fileName = `signals/${user.uid}/${timestamp}.${format}`;
    const contentType = `image/${format}`;

    const byteCharacters = atob(base64String);
    const byteArray = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i);
    }
    const blob = new Blob([byteArray], { type: contentType });

    const { error } = await this.supabase.storage
      .from('signals')
      .upload(fileName, blob, { contentType });

    if (error) {
      console.error('Error uploading image to Supabase Storage:', error);
      throw error;
    }

    const { data } = this.supabase.storage
      .from('signals')
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async deleteSignalImage(imageUrl: string): Promise<void> {
    try {
      const urlParts = imageUrl.split('/signals/');
      if (urlParts.length < 2) return;
      const filePath = 'signals/' + urlParts[1];

      await this.supabase.storage.from('signals').remove([filePath]);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }
}
