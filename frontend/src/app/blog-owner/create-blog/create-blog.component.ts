import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { PostBlogOwnerService , Post} from '../../core/services/postowner.service';
import { QuillEditorComponent } from 'ngx-quill';
import { ProfileService, UserProfile} from '../../core/services/profile.service';

@Component({
  selector: 'app-create-blog',
  templateUrl: './create-blog.component.html',
  styleUrls: ['./create-blog.component.css'],
  standalone: false,
})
export class CreateBlogComponent implements OnInit {
  blogForm!: FormGroup;
  @ViewChild('quillEditor', { static: false }) quillEditor!: QuillEditorComponent;
  selectedTags: Set<string> = new Set();
  availableTags: string[] = [];
  isEditMode : boolean = false;
  editPostId: number | null = null;
  post: Post | null = null;

  isInitializing: boolean = true;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  userProfile: UserProfile | null = null;

  languages = [
    { id: 1, name: 'English', flag: '🇺🇸' },
    { id: 2, name: 'Vietnamese', flag: '🇻🇳' },
    { id: 3, name: 'French', flag: '🇫🇷' }
  ];
  selectedLanguageName: string = 'English';
  selectedLanguageFlag: string = '🇺🇸';

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ header: [1, 2, 3, false] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean']
    ]
  };

  constructor(private fb: FormBuilder, 
    private http: HttpClient, 
    private route: ActivatedRoute, 
    private router: Router, 
    @Inject(PLATFORM_ID) private platformId: Object, 
    private postService: PostBlogOwnerService,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    this.blogForm = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      languageid: [1, Validators.required],
      tags: [[]]
    });
    
    this.availableTags = this.getAllTagsFromDB();
    this.route.queryParams.subscribe(params => {
      const editPostId = params['edit'];
      if( editPostId) {
        this.isEditMode = true;
        this.editPostId = +editPostId;
        this.loadPostForEditing(this.editPostId);
      }
    });
    this.profileService.getUserProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
      }
    });
    this.isInitializing = false;
  }

  loadPostForEditing(postId: number): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.errorMessage = 'This feature is only available in the browser.';
      return;
    }

    // Set loading state
    this.isLoading = true;
    this.errorMessage = '';

    this.postService.getSpecificPost(postId).subscribe({
      next: (post) => {
        console.log('Post loaded for editing:', post);
        this.post = post;
        this.blogForm.patchValue({
          title: post.title,
          content: post.content,
          languageid: post.languageid,
          tags: post.tags
        });
        this.selectedTags = new Set(post.tags);
        this.selectedLanguageName = this.languages.find(lang => lang.id === post.languageid)?.name || 'English';
        this.selectedLanguageFlag = this.languages.find(lang => lang.id === post.languageid)?.flag || '🇺🇸';
        
        // Clear loading state
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading post:', error);
        this.errorMessage = 'Failed to load post for editing.';
        this.isLoading = false;
      }
    });
  }

  selectLanguage(lang: { id: number; name: string; flag: string }, event: Event): void {
    event.preventDefault();
    this.blogForm.patchValue({ languageid: lang.id });
    this.selectedLanguageName = lang.name;
    this.selectedLanguageFlag = lang.flag;
  }

  toggleTag(tag: string, event: Event): void {
    event.preventDefault();
    if (this.selectedTags.has(tag)) {
      this.selectedTags.delete(tag);
    } else {
      this.selectedTags.add(tag);
    }
    this.blogForm.patchValue({ tags: Array.from(this.selectedTags) });
  }

  getSelectedTagsArray(): string[] {
    return Array.from(this.selectedTags);
  }

  removeTag(tag: string): void {
    this.selectedTags.delete(tag);
    this.blogForm.patchValue({ tags: Array.from(this.selectedTags) });
  }

  getAllTagsFromDB(): string[] {
    return ['Technology', 'Romantic', 'Natural Language Processing'];
  }

  submitBlog(): void {
    if(!isPlatformBrowser(this.platformId)) {
      this.errorMessage = 'This feature is only available in the browser.';
      return;
    }
    
    if (this.blogForm.invalid) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    // Set loading state
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = this.blogForm.value;

    if (this.isEditMode && this.editPostId !== null) {
      payload['postid'] = this.editPostId;

      // Perform UPDATE
      this.http.put('http://localhost:3000/post-owner/update-post', payload, { withCredentials: true }).subscribe({
        next: () => {
          this.successMessage = `Your blog "${payload.title}" was updated successfully! Redirecting...`;
          this.isLoading = false;
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 2000);
        },
        error: err => {
          console.error('Update error:', err);
          this.errorMessage = 'Failed to update blog. Please try again.';
          this.isLoading = false;
        }
      });
    } else {
      // Perform CREATE
      this.http.post('http://localhost:3000/post-owner/create-post', payload, { withCredentials: true }).subscribe({
        next: () => {
          this.successMessage = `Your blog "${payload.title}" was submitted successfully! Redirecting...`;
          this.isLoading = false;
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 2000);
        },
        error: err => {
          console.error('Create error:', err);
          this.errorMessage = 'Failed to submit blog. Please try again.';
          this.isLoading = false;
        }
      });
    }
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}