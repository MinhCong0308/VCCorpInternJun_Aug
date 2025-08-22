import { Component, OnInit, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService, UserProfile} from '../../core/services/profile.service';
import { isPlatformBrowser } from '@angular/common';
import { Language, LanguageService} from '../../core/services/language.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css'],
  standalone: false,
})
export class AccountComponent implements OnInit {
  @ViewChild('avatarInput') avatarInput!: ElementRef<HTMLInputElement>;
  userProfile: UserProfile | null = null;
  isInitializing = true;
  editMode: Record<'username' | 'fullname', boolean> = {
    username: false,
    fullname: false,
  };

  editValues: Record<'username' | 'fullname', string> = {
    username: '',
    fullname: '',
  };

  isLoading = false;
  isUploading = false;
  defaultLanguage: Language | null = null;
  currentLanguage: Language | null = null;
  languages: Language[] = [];
  constructor(private router: Router, @Inject(PLATFORM_ID) private platformId: Object, private authService: AuthService, private profileService: ProfileService, private languageService: LanguageService, private notificationService: NotificationService) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.isInitializing = false;
      return;
    }
    // console.log('ACCOUNT COMPONENT: Starting profile load...');
    this.isLoading = true;
    this.profileService.getUserProfile().subscribe({
      next: (profile) => {
        // console.log('Account component: User profile loaded successfully');
        this.userProfile = profile;
        this.loadLanguage();
        // console.log('Languages loaded:', this.languages);
        // this.defaultLanguage = this.languages.find(lang => lang.is_default) || null;
        // console.log('Default language:', this.defaultLanguage);
        // this.currentLanguage = this.defaultLanguage;
        this.isInitializing = false;
        this.isLoading = false; 

      },
      error: (error) => {
        // console.error('Error fetching user profile:', error);
        this.isLoading = false; 
        this.isInitializing = false;
        if (error.status === 401) {
          console.log('Account component: User not authenticated, redirecting to login');
          this.authService.clearSessionCache();
          this.router.navigate(['/auth/login'], {replaceUrl: true});
          return;
        }
        this.notificationService.error('Error', 'Failed to load user profile. Please try again later.');
      }
    }); 
  }

  toggleEdit(type: 'username' | 'fullname'): void {
    if (!this.userProfile) return;
    this.editMode[type] = true;
    this.editValues[type] = this.userProfile[type] ?? '';
  }

  cancelEdit(type: 'username' | 'fullname'): void {
    if (!this.userProfile) return; 
    this.editMode[type] = false;
    this.editValues[type] = this.userProfile[type] ?? '';
  }

  saveEdit(type: 'username' | 'fullname', event: Event): void {
    event.preventDefault();
    
    if (!this.userProfile) return; 
    
    const value = this.editValues[type].trim();
    this.isLoading = true;
    
    const req$ = type === 'username'
      ? this.profileService.updateUsername(value)
      : this.profileService.updateFullname(value);
      
    req$.subscribe({
      next: () => {
        if (this.userProfile) { 
          this.userProfile[type] = value;
        }
        this.editMode[type] = false;
        this.notificationService.success('Success', `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully!`);
      },
      error: (error) => {
        // console.error('Error updating user profile:', error);
        this.notificationService.error('Error', 'Failed to update user profile.');
      },
      complete: () => {
        this.isLoading = false;
        this.editMode[type] = false;
      }
    });
  }

  async handleAvatarChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.userProfile) return;
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      this.notificationService.error('Error', 'Please select a valid image file (JPG, PNG, or GIF)');
      return;
    }
    
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      this.notificationService.error('Error', 'File size must be less than 2MB');
      return;
    }
    
    this.isUploading = true; 
    
    this.profileService.updateAvatar(file).subscribe({
      next: ({ avatarUrl }) => {
        if (this.userProfile) { 
          this.userProfile.avatarUrl = avatarUrl;
        }
        this.notificationService.success('Success', 'Profile photo updated successfully!');
      },
      error: (error) => {
        this.notificationService.error('Error', error.message || 'Failed to update profile photo.');
      },
      complete: () => {
        this.isUploading = false; 
        input.value = '';
      }
    });
  }

  async deactivateAccount(): Promise<void> {
    const confirmed = confirm('Are you sure you want to deactivate your account?');
    if (!confirmed) return;

    this.isLoading = true;
    
    this.profileService.deactivateAccount().subscribe({
      next: () => {
        alert('Account deactivated successfully.');
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        this.notificationService.error('Error', error.message || 'Failed to deactivate account.');
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        // console.error('Logout error:', error);
        this.router.navigate(['/auth/login']);
      }
    });
  }
  loadLanguage(): void {
    this.languageService.getLanguages().subscribe({
      next: (response) => {
        this.languages = response.data.languages || [];
        this.defaultLanguage = this.languages.find(lang => lang.is_default) || null;
        this.currentLanguage = this.defaultLanguage;
      }
    })
  }
  selectLanguage(language: Language): void {
    this.currentLanguage = language;
  }
}