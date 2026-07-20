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
}
