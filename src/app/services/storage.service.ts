import { Injectable, inject } from '@angular/core';
import { Storage, ref, uploadString, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private storage = inject(Storage);

  constructor(private authService: AuthService) {}

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
    const storageRef = ref(this.storage, fileName);

    await uploadString(storageRef, base64String, 'base64', {
      contentType: `image/${format}`,
    });

    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  }

  async deleteSignalImage(imageUrl: string): Promise<void> {
    try {
      const storageRef = ref(this.storage, imageUrl);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }
}
