import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { PostBlogOwnerService , Post } from '../../core/services/postowner.service';
import { QuillEditorComponent } from 'ngx-quill';
import { ProfileService, UserProfile} from '../../core/services/profile.service';
import { CategoryService, Category } from '../../core/services/category.service';
import { LanguageService, Language } from '../../core/services/language.service';
import Delta from 'quill-delta'; // Import Delta type for type safety
import { TranslateService } from '../../core/services/translate.service';

interface PostLanguageTab {
  title: string;
  content: string;
  delta: any; // Store delta object
  language: Language;
  isOriginal: boolean;
  isTranslating: boolean;
}

@Component({
  selector: 'app-create-blog',
  templateUrl: './create-blog.component.html',
  styleUrls: ['./create-blog.component.css'],
  standalone: false,
})
export class CreateBlogComponent implements OnInit {
  blogForm!: FormGroup;
  @ViewChild(QuillEditorComponent, { static: false }) quillEditor!: QuillEditorComponent;
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
  currentLanguage: Language | null = null;
  defaultLanguage: Language | null = null;
  languages: Language[] = [];
  languageTabs: PostLanguageTab[] = [];
  activeTabIndex: number = 0;

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
    private profileService: ProfileService,
    private categoryService: CategoryService,
    private languageService: LanguageService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.blogForm = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      languageid: [1, Validators.required],
      tags: [[]]
    });

    this.categoryService.getAllCategories().subscribe({
      next: (response) => {
        this.availableTags = response.categories.map((category: Category) => category.categoryname);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });

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
        // console.error('Error loading user profile:', error);
      }
    });
    
    this.loadLanguages();
  }

  // Create empty delta object
  createEmptyDelta(): any {
    return { ops: [] };
  }

  initializeDefaultTab(): void {
    if(this.defaultLanguage) {
      const defaultTab: PostLanguageTab = {
        title: '',
        content: '',
        delta: this.createEmptyDelta(),
        language: this.defaultLanguage,
        isOriginal: true,
        isTranslating: false
      };
      this.languageTabs.push(defaultTab);
      this.activeTabIndex = 0;
      this.updateFormWithActiveTab();
      this.isInitializing = false;
    }
  }
  // Get current delta from Quill editor
  getDeltaContent(): any {
    if (this.quillEditor && this.quillEditor.quillEditor) {
      return this.quillEditor.quillEditor.getContents();
    }
    return this.createEmptyDelta();
  }
  loadLanguages(): void {
    this.languageService.getLanguages().subscribe({
      next: (response) => {
        this.languages = response.data.languages || [];
        this.defaultLanguage = this.languages.find(lang => lang.is_default) || null;
        this.currentLanguage = this.defaultLanguage;
        this.initializeDefaultTab();
      },
      error: (error) => {
        this.errorMessage = 'Failed to load languages. Please try again later.' + error.message;
        this.isInitializing = false;
      }
    });
  }

  updateFormWithActiveTab(): void {
    const activeTab = this.languageTabs[this.activeTabIndex];
    if (!activeTab) return;
    
    this.blogForm.patchValue({
      title: activeTab.title,
      content: activeTab.content,
      languageid: activeTab.language.languageid,
    });

    // Set Quill editor content with a slight delay to ensure it's ready
    setTimeout(() => {
      if (this.quillEditor && this.quillEditor.quillEditor) {
        if (activeTab.delta && activeTab.delta.ops && activeTab.delta.ops.length > 0) {
          // Use delta if available
          this.quillEditor.quillEditor.setContents(activeTab.delta);
        } else if (activeTab.content) {
          // Fallback to HTML
          this.quillEditor.quillEditor.clipboard.dangerouslyPasteHTML(activeTab.content);
        } else {
          // Clear editor
          this.quillEditor.quillEditor.setText('');
        }
      }
    }, 100);

    // Enable/disable form controls based on tab type
    if(activeTab.isOriginal) {
      this.blogForm.get('title')?.enable();
      this.blogForm.get('content')?.enable();
    } else {
      this.blogForm.get('title')?.disable();
      this.blogForm.get('content')?.disable();
    }
  }

  switchTab(index: number): void {
    if (index === this.activeTabIndex) return;
    
    // Save current tab data if it's the original tab
    if (this.languageTabs[this.activeTabIndex]?.isOriginal) {
      this.saveCurrentTabData();
    }
    
    // Switch to new tab
    this.activeTabIndex = index;
    this.updateFormWithActiveTab();
  }

  saveCurrentTabData(): void {
    const currentTab = this.languageTabs[this.activeTabIndex];
    if (currentTab && currentTab.isOriginal) {
      currentTab.title = this.blogForm.get('title')?.value || '';
      // Get content directly from Quill editor
      if (this.quillEditor && this.quillEditor.quillEditor) {
        currentTab.delta = this.quillEditor.quillEditor.getContents();
        currentTab.content = this.quillEditor.quillEditor.root.innerHTML;
        console.log('Saved from editor - delta:', currentTab.delta);
        console.log('Saved from editor - content:', currentTab.content);
      } else {
        // Fallback to form value
        console.warn('Quill editor not available, using form value for content.');
        currentTab.content = this.blogForm.get('content')?.value || '';
      }
    }
  }

  addTranslationTab(language: Language): void {
    const existingTab = this.languageTabs.find(tab => tab.language.languageid === language.languageid);
    if(existingTab) {
      this.activeTabIndex = this.languageTabs.indexOf(existingTab);
      this.updateFormWithActiveTab();
      return;
    }
    
    // Save current original tab data first
    this.saveCurrentTabData();
    
    const originalTab = this.languageTabs.find(tab=> tab.isOriginal);
    if(!originalTab || !originalTab.content.trim() || !originalTab.title.trim()) {
      this.errorMessage = 'Please fill in the original content before adding a translation.';
      setTimeout(() => {
        this.errorMessage = '';
      }, 3000);
      return;
    }
    
    const translationTab: PostLanguageTab = {
      language: language,
      title: '',
      content: '',
      delta: this.createEmptyDelta(),
      isOriginal: false,
      isTranslating: true
    };
    
    this.languageTabs.push(translationTab);
    this.activeTabIndex = this.languageTabs.length - 1;
    this.translateContent(originalTab, translationTab);
  }
  isFormattingOnlyString(str: string): boolean {
    return /^\s*$/.test(str) || str === '\n' || str.trim() === '';
  }

  translateDeltaOps(originalDelta: any, targetLanguage: Language): Promise<any> {
    if (!originalDelta || !originalDelta.ops) {
      return Promise.resolve(this.createEmptyDelta());
    }

    const translatedOps = [...originalDelta.ops];
    const translationPromises: Promise<void>[] = [];

    for (let i = 0; i < translatedOps.length; i++) {
      const op = { ...translatedOps[i] };
      
      if (typeof op.insert === 'string') {
        if (this.isFormattingOnlyString(op.insert)) {
          // Keep formatting strings as-is
          translatedOps[i] = op;
        } else {
          // Create a promise for each translation
          const translationPromise = new Promise<void>((resolve, reject) => {
            this.translateService.translate(
              op.insert, 
              this.defaultLanguage?.languagename ?? 'auto', 
              targetLanguage.languagename
            ).subscribe({
              next: (response: any) => {
                try {
                  op.insert = response.candidates[0].content.parts[0].text.trim();
                  translatedOps[i] = op;
                  resolve();
                } catch (error) {
                  console.error('Error parsing translation response:', error);
                  op.insert = `[${targetLanguage.languagename}] ${op.insert}`; // Fallback
                  translatedOps[i] = op;
                  resolve();
                }
              },
              error: (error) => {
                console.error('Translation error:', error);
                op.insert = `[${targetLanguage.languagename}] ${op.insert}`; // Fallback
                translatedOps[i] = op;
                resolve(); // Still resolve to continue
              }
            });
          });
          
          translationPromises.push(translationPromise);
        }
      } else {
        // Keep non-string ops as-is
        translatedOps[i] = op;
      }
    }

    // Wait for all translations to complete
    return Promise.all(translationPromises).then(() => {
      return { ops: translatedOps };
    });
  }
  translateContent(originalTab: PostLanguageTab, targetTab: PostLanguageTab): void {
    targetTab.isTranslating = true;
    this.updateFormWithActiveTab();
    const targetLanguage = targetTab.language;
    console.log('Original title: ', originalTab.title);
    console.log('Original content HTML: ', originalTab.content);
    console.log('Original Delta: ', originalTab.delta);
    this.translateService.translate(
      originalTab.title,
      this.defaultLanguage?.languagename ?? 'auto',
      targetLanguage.languagename
    ).subscribe({
      next: (titleResponse: any) => {
        try {
          targetTab.title = titleResponse.candidates[0].content.parts[0].text.trim();
        } catch (error) {
          console.error('Error translating title:', error);
          targetTab.title = `[${targetLanguage?.languagename}] ${originalTab.title}`;
        }

        // Then translate content
        this.translateDeltaOps(originalTab.delta, targetLanguage).then((translatedDelta) => {
          targetTab.delta = translatedDelta;

          // Generate HTML content
          if (this.quillEditor && this.quillEditor.quillEditor) {
            const currentContents = this.quillEditor.quillEditor.getContents();
            this.quillEditor.quillEditor.setContents(targetTab.delta);
            console.log('Translated Delta: ', targetTab.delta);
            targetTab.content = this.quillEditor.quillEditor.root.innerHTML;
            this.quillEditor.quillEditor.setContents(currentContents);
          }

          targetTab.isTranslating = false;
          this.updateFormWithActiveTab();
          console.log('Target tab content: ', targetTab.content);
        }).catch((error) => {
          console.error('Translation failed:', error);
          targetTab.isTranslating = false;
          this.errorMessage = 'Translation failed. Please try again.';
        });
      },
      error: (error) => {
        console.error('Title translation error:', error);
        targetTab.title = `[${targetLanguage?.languagename}] ${originalTab.title}`;
        
        // Continue with content translation even if title fails
        this.translateDeltaOps(originalTab.delta, targetLanguage).then((translatedDelta) => {
          targetTab.delta = translatedDelta;
          
          if (this.quillEditor && this.quillEditor.quillEditor) {
            const currentContents = this.quillEditor.quillEditor.getContents();
            this.quillEditor.quillEditor.setContents(targetTab.delta);
            targetTab.content = this.quillEditor.quillEditor.root.innerHTML;
            this.quillEditor.quillEditor.setContents(currentContents);
          }

          targetTab.isTranslating = false;
          this.updateFormWithActiveTab();
        });
      }
    });
  }
  removeTab(index: number): void {
    const tab = this.languageTabs[index];
    if (tab.isOriginal) {
      this.errorMessage = 'Cannot remove the original language tab.';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.languageTabs.splice(index, 1);
    
    if (this.activeTabIndex >= index) {
      this.activeTabIndex = Math.max(0, this.activeTabIndex - 1);
    }
    
    this.updateFormWithActiveTab();
  }

  getAvailableTranslationLanguages(): Language[] {
    return this.languages.filter(lang => 
      !this.languageTabs.some(tab => tab.language.languageid === lang.languageid)
    );
  }

  getCurrentTab(): PostLanguageTab | null {
    return this.languageTabs[this.activeTabIndex] || null;
  }

  getLanguageById(languageId: number): Language | undefined {
    return this.languages.find(lang => lang.languageid === languageId);
  }

  loadPostForEditing(editPostId: number): void {
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

  submitBlog(): void {
    if(!isPlatformBrowser(this.platformId)) {
      this.errorMessage = 'This feature is only available in the browser.';
      return;
    }
    
    this.saveCurrentTabData();
    
    const originalTab = this.languageTabs.find(tab => tab.isOriginal);
    if (!originalTab || !originalTab.title.trim() || !originalTab.content.trim()) {
      this.errorMessage = 'Please fill in the original title and content.';
      return;
    }

    const hasTranslatingTabs = this.languageTabs.some(tab => tab.isTranslating);
    if (hasTranslatingTabs) {
      this.errorMessage = 'Please wait for all translations to complete before submitting.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: {
      originalPost: {
        title: string;
        content: string;
        languageid: number;
        tags: string[];
      };
      translations: {
        title: string;
        content: string;
        languageid: number;
        tags: string[];
      }[];
      postid?: number;
    } = {
      originalPost: {
        title: originalTab.title,
        content: originalTab.content,
        languageid: originalTab.language.languageid,
        tags: Array.from(this.selectedTags)
      },
      translations: this.languageTabs
        .filter(tab => !tab.isOriginal && tab.title.trim() && tab.content.trim())
        .map(tab => ({
          title: tab.title,
          content: tab.content,
          languageid: tab.language.languageid,
          tags: Array.from(this.selectedTags)
        }))
    };

    console.log('Submitting payload:', payload);

    if (this.isEditMode && this.editPostId !== null) {
      payload['postid'] = this.editPostId;

      this.http.put('http://localhost:3000/post-owner/update-post-with-translations', payload, { withCredentials: true }).subscribe({
        next: (response) => {
          this.successMessage = `Your blog "${payload.originalPost.title}" and its ${payload.translations.length} translation(s) were updated successfully! Redirecting...`;
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
      this.http.post('http://localhost:3000/post-owner/create-post-with-translations', payload, { withCredentials: true }).subscribe({
        next: (response) => {
          this.successMessage = `Your blog "${payload.originalPost.title}" and its ${payload.translations.length} translation(s) were submitted successfully! Redirecting...`;
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

  selectLanguage(language: Language): void {
    this.currentLanguage = language;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('locale_code', language.locale_code);
    }
  }
}