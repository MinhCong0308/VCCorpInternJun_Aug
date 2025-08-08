import { Component, OnInit, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

interface UserProfile {
  email: string;
  username: string;
  fullname: string;
  avatarUrl: string;
}

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css'],
  standalone: false,
})
export class AccountComponent implements OnInit {
  @ViewChild('avatarInput') avatarInput!: ElementRef<HTMLInputElement>;

  userProfile: UserProfile = {
    email: '',
    username: '',
    fullname: '',
    avatarUrl: ''
  };

  editMode = {
    username: false,
    fullname: false
  };

  editValues = {
    username: '',
    fullname: ''
  };

  isLoading = false;
  isUploading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  async loadUserProfile(): Promise<void> {
    if(!isPlatformBrowser(this.platformId)) {
      this.errorMessage = 'This feature is only available in the browser.';
      return;
    }
    try {
      const response = await fetch('http://localhost:3000/account/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      if (response.ok) {
        const responseJson = await response.json();
        this.userProfile = {
          email: responseJson.data.email || this.userProfile.email,
          username: responseJson.data.username || this.userProfile.username,
          fullname: responseJson.data.fullname || this.userProfile.fullname,
          avatarUrl: responseJson.data.avatarUrl || this.userProfile.avatarUrl
        };
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  toggleEdit(type: 'username' | 'fullname'): void {
    this.editMode[type] = true;
    this.editValues[type] = this.userProfile[type];
    this.clearMessages();
  }

  cancelEdit(type: 'username' | 'fullname'): void {
    this.editMode[type] = false;
    this.editValues[type] = this.userProfile[type];
    this.clearMessages();
  }

  async saveEdit(type: 'username' | 'fullname', event: Event): Promise<void> {
    console.log('Saving edit for:', type);
    event.preventDefault();
    const value = this.editValues[type].trim();
    if(!isPlatformBrowser(this.platformId)) {
      this.errorMessage = 'This feature is only available in the browser.';
      return;
    }
    if (!value) {
      this.errorMessage = 'Value cannot be empty.';
      return;
    }
    this.isLoading = true;
    this.clearMessages();

    try {
      const fieldName = type === 'fullname' ? 'newFullname' : type;
      const response = await fetch(`http://localhost:3000/account/update-${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'},
        body: JSON.stringify({ [fieldName]: value }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (response.ok) {
        this.userProfile[type] = value;
        this.editMode[type] = false;
        this.successMessage = `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully!`;
        setTimeout(() => {
          this.successMessage = '';
        }, 1000);
      } else {
        this.errorMessage = data.message || 'Failed to update.';
      }
    } catch (error) {
      this.errorMessage = 'An error occurred while updating.';
      console.error('Update error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async handleAvatarChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      this.errorMessage = 'Please select a valid image file (JPG, PNG, or GIF)';
      return;
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      this.errorMessage = 'File size must be less than 2MB';
      return;
    }

    this.isUploading = true;
    this.clearMessages();

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('http://localhost:3000/account/update-avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        this.userProfile.avatarUrl = data.data.avatarUrl;
        this.successMessage = 'Profile photo updated successfully!';
      
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      } else {
        this.errorMessage = data.message || 'Failed to upload image';
      }
    } catch (error) {
      this.errorMessage = 'An error occurred while uploading the image';
      console.error('Upload error:', error);
    } finally {
      this.isUploading = false;
      // Clear file input
      input.value = '';
    }
  }

  async deactivateAccount(): Promise<void> {
    const confirmed = confirm('Are you sure you want to deactivate your account?');
    if (!confirmed) return;

    this.isLoading = true;
    this.clearMessages();

    try {
      const response = await fetch('http://localhost:3000/account/deactivate-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const data = await response.json();
      if (response.ok) {
        alert('Account deactivated successfully.');
        this.router.navigate(['/auth/login']);
      } else {
        this.errorMessage = data.message || 'Failed to deactivate account.';
      }
    } catch (error) {
      this.errorMessage = 'An error occurred while deactivating account.';
      console.error('Deactivate error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  logout(): void {    
    this.router.navigate(['/auth/login']);
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}