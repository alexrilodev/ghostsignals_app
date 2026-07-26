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
      const pathStart = imageUrl.lastIndexOf('/signals/') + '/signals/'.length;
      if (pathStart < '/signals/'.length) return;
      const filePath = imageUrl.substring(pathStart).split('?')[0];

      await this.supabase.storage.from('signals').remove([filePath]);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }

  async uploadProfilePhoto(
    base64String: string,
    format: string
  ): Promise<string> {
    const user = this.authService.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const fileName = `${user.uid}.${format}`;
    const contentType = `image/${format}`;

    const byteCharacters = atob(base64String);
    const byteArray = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i);
    }
    const blob = new Blob([byteArray], { type: contentType });

    await this.supabase.storage.from('profiles').remove([`${user.uid}.jpeg`, `${user.uid}.png`, `${user.uid}.webp`, `${user.uid}.gif`]).catch(() => {});

    const { error } = await this.supabase.storage
      .from('profiles')
      .upload(fileName, blob, { contentType });

    if (error) {
      console.error('Error uploading profile photo:', error);
      throw error;
    }

    const { data } = this.supabase.storage
      .from('profiles')
      .getPublicUrl(fileName);

    return data.publicUrl + '?t=' + Date.now();
  }

  async deleteAllUserSignalImages(): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) return;

    try {
      const { data: files } = await this.supabase.storage
        .from('signals')
        .list(`signals/${user.uid}`);

      if (files && files.length > 0) {
        const paths = files.map(f => `signals/${user.uid}/${f.name}`);
        await this.supabase.storage.from('signals').remove(paths);
      }
    } catch (error) {
      console.error('Error deleting user signal images:', error);
    }
  }

  async deleteProfilePhoto(): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) return;

    try {
      await this.supabase.storage
        .from('profiles')
        .remove([`${user.uid}.jpeg`, `${user.uid}.png`, `${user.uid}.webp`, `${user.uid}.gif`]);
    } catch (error) {
      console.error('Error deleting profile photo:', error);
    }
  }

  async downloadAndUploadGooglePhoto(googlePhotoUrl: string): Promise<string | null> {
    const user = this.authService.currentUser;
    if (!user || !googlePhotoUrl) return null;

    try {
      const existingUrl = await this.getProfilePhotoUrl();
      if (existingUrl) return null;

      const response = await fetch(googlePhotoUrl);
      if (!response.ok) return null;

      const blob = await response.blob();
      const ext = blob.type.includes('png') ? 'png' : 'jpeg';
      const fileName = `${user.uid}.${ext}`;
      const contentType = `image/${ext}`;

      await this.supabase.storage
        .from('profiles')
        .remove([`${user.uid}.jpeg`, `${user.uid}.png`, `${user.uid}.webp`, `${user.uid}.gif`])
        .catch(() => {});

      const { error } = await this.supabase.storage
        .from('profiles')
        .upload(fileName, blob, { contentType });

      if (error) {
        console.error('Error uploading Google photo:', error);
        return null;
      }

      const { data } = this.supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);

      return data.publicUrl + '?t=' + Date.now();
    } catch (error) {
      console.error('Error syncing Google photo:', error);
      return null;
    }
  }

  async getProfilePhotoUrl(): Promise<string | null> {
    const user = this.authService.currentUser;
    if (!user) return null;

    for (const ext of ['png', 'jpeg', 'webp', 'gif']) {
      const { data } = await this.supabase.storage
        .from('profiles')
        .list('', { search: `${user.uid}.${ext}` });

      if (data && data.length > 0) {
        const { data: urlData } = this.supabase.storage
          .from('profiles')
          .getPublicUrl(`${user.uid}.${ext}`);
        return urlData.publicUrl;
      }
    }
    return null;
  }
}
