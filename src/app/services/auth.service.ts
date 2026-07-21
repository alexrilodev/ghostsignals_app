import { Injectable, inject } from '@angular/core';
import {
  Auth,
  User,
  user,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  updatePassword as firebaseUpdatePassword,
  deleteUser,
  GoogleAuthProvider,
  OAuthProvider,
  EmailAuthProvider,
  signInWithCredential,
  signInWithPopup,
  reauthenticateWithPopup,
  reauthenticateWithCredential,
} from '@angular/fire/auth';
import { Observable, of, switchMap } from 'rxjs';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);

  user$: Observable<User | null> = user(this.auth);

  get currentUser(): User | null {
    return this.auth.currentUser;
  }

  get uid(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  async login(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(this.auth, email, password);
    return credential.user;
  }

  async register(email: string, password: string): Promise<User> {
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    return credential.user;
  }

  async loginWithGoogle(): Promise<User> {
    if (Capacitor.isNativePlatform()) {
      const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
      const result = await FirebaseAuthentication.signInWithGoogle();
      const credential = GoogleAuthProvider.credential(result.credential?.idToken);
      const userCredential = await signInWithCredential(this.auth, credential);
      return userCredential.user;
    }
    const result = await signInWithPopup(this.auth, new GoogleAuthProvider());
    return result.user;
  }

  async loginWithApple(): Promise<User> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Apple Sign-In solo está disponible en dispositivos móviles');
    }
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
    const result = await FirebaseAuthentication.signInWithApple();
    const credential = new OAuthProvider('apple.com').credential({
      idToken: result.credential?.idToken,
      rawNonce: result.credential?.nonce,
    });
    const userCredential = await signInWithCredential(this.auth, credential);
    return userCredential.user;
  }

  async updateProfile(displayName: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    await firebaseUpdateProfile(user, { displayName });
  }

  async updatePhotoURL(photoURL: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    await firebaseUpdateProfile(user, { photoURL });
  }

  async updatePassword(newPassword: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    await firebaseUpdatePassword(user, newPassword);
  }

  async logout(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
      await FirebaseAuthentication.signOut();
    }
    await signOut(this.auth);
  }

  async deleteAccount(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    await deleteUser(user);
  }

  isGoogleProvider(): boolean {
    const user = this.currentUser;
    if (!user || !user.providerData) return false;
    return user.providerData.some(provider => provider.providerId === 'google.com');
  }

  async reauthenticateWithGoogle(): Promise<void> {
    const user = this.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');
    await reauthenticateWithPopup(user, new GoogleAuthProvider());
  }

  async reauthenticateWithEmail(email: string, password: string): Promise<void> {
    const user = this.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');
    const credential = EmailAuthProvider.credential(email, password);
    await reauthenticateWithCredential(user, credential);
  }

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  isAuthenticated(): Observable<boolean> {
    return this.user$.pipe(switchMap(user => of(!!user)));
  }
}
