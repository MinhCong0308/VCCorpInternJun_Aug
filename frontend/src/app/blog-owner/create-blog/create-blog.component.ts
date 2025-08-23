import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { PostBlogOwnerService, Post } from '../../core/services/postowner.service';
import { QuillEditorComponent } from 'ngx-quill';
import { ProfileService, UserProfile } from '../../core/services/profile.service';
import { CategoryService, Category } from '../../core/services/category.service';
import { LanguageService, Language } from '../../core/services/language.service';
import { TranslateService } from '../../core/services/translate.service';
import { NotificationService } from '../../core/services/notification.service';
import { Subscription } from 'rxjs';

interface PostLanguageTab {
  title: string;
  content: string;
  delta: any;
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
export class CreateBlogComponent implements OnInit, OnDestroy {
  blogForm!: FormGroup;
  @ViewChild(QuillEditorComponent, { static: false }) quillEditor!: QuillEditorComponent;
  
  // State variables
  selectedTags: Set<string> = new Set();
  availableTags: string[] = [];
  isEditMode: boolean = false;
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
  translations: Post[] = [];

  // Subscription management
  private subscriptions: Subscription[] = [];
  private isUserScrolling = false;
  private scrollTimeout: any;

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

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private postService: PostBlogOwnerService,
    private profileService: ProfileService,
    private categoryService: CategoryService,
    private languageService: LanguageService,
    private translateService: TranslateService,
    private notificationService: NotificationService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      // Reset everything first
      this.resetAllState();
      
      // Initialize form
      this.initializeForm();
      
      // Load everything sequentially
      await this.initializeEverything();
      
    } catch (error) {
      console.error('Initialization error:', error);
      this.notificationService.error(
        'Initialization Failed',
        'Failed to initialize the page. Please refresh and try again.',
        [
          {
            label: 'Refresh Page',
            action: () => window.location.reload(),
            style: 'primary'
          }
        ]
      );
      this.isLoading = false;
      this.isInitializing = false;
    }
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    if(this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.resetQuillEditor();
  }

  setUpAutoScroll(): void {
    if(!this.quillEditor || !this.quillEditor.quillEditor) return;
    const quillEditor = this.quillEditor.quillEditor;
    const editorElement = quillEditor.container.querySelector('.ql-editor');
    if(!editorElement) return;
    editorElement.addEventListener('scroll', () => {
      this.isUserScrolling = true;
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        this.isUserScrolling = false;
      }, 100);
    });
    quillEditor.on('selection-change', (range: any, oldRange: any, source: string) => {
      if (source === 'user' && range && !this.isUserScrolling) {
        setTimeout(() => {
          this.scrollToCurrentCursor();
        }, 10);
      }
    });
  }
  scrollToCurrentCursor(): void {
      if (!this.quillEditor?.quillEditor) return;   
      const quillEditor = this.quillEditor.quillEditor;
      const selection = quillEditor.getSelection();
      
      if (!selection) return;
      
      const editorElement = quillEditor.container.querySelector('.ql-editor');
      if (!editorElement) return;
      const bounds = quillEditor.getBounds(selection.index);
      if (!bounds) return;
      const editorRect = editorElement.getBoundingClientRect();
      const editorHeight = editorElement.clientHeight;      
      const cursorPosition = bounds.top;
      const scrollTop = editorElement.scrollTop;
      const visibleBottom = scrollTop + editorHeight;
      const bufferZone = 100; // Pixels from bottom to trigger scroll      
      if (cursorPosition > editorHeight - bufferZone) {
        const newScrollTop = scrollTop + (cursorPosition - (editorHeight - bufferZone));
        editorElement.scrollTo({
          top: newScrollTop,
          behavior: 'smooth'
        });
      }
  }
  resetAllState(): void {
    // Reset all component state
    this.selectedTags = new Set();
    this.isEditMode = false;
    this.editPostId = null;
    this.post = null;
    this.isInitializing = true;
    this.isLoading = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.userProfile = null;
    this.currentLanguage = null;
    this.defaultLanguage = null;
    this.languages = [];
    this.languageTabs = [];
    this.activeTabIndex = 0;
    this.translations = [];
    
    // Clear subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
    
    console.log('All state reset successfully');
  }

  resetQuillEditor(): void {
    setTimeout(() => {
      if (this.quillEditor && this.quillEditor.quillEditor) {
        this.quillEditor.quillEditor.setText('');
        this.quillEditor.quillEditor.setContents(this.createEmptyDelta());
        if (this.quillEditor.quillEditor.history) {
          this.quillEditor.quillEditor.history.clear();
        }
      }
    }, 100);
  }

  initializeForm(): void {
    this.blogForm = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      languageid: [1, Validators.required],
      tags: [[]]
    });
  }

  async initializeEverything(): Promise<void> {
    this.isLoading = true;
    this.isInitializing = true;

    try {
      await this.loadCategories();
      await this.loadUserProfile();      
      await this.loadLanguages();      
      await this.handleRouteParams();
      console.log('Initialization completed successfully');
    } catch (error) {
      console.error('Error during initialization:', error);
      this.notificationService.error(
        'Initialization Failed',
        'Failed to initialize the page. Please refresh and try again.',
        [
          {
            label: 'Refresh Page',
            action: () => window.location.reload(),
            style: 'primary'
          }
        ]
      );
      throw error;
    } finally {
      this.isLoading = false;
      this.isInitializing = false;
    }
  }
  loadCategories(): Promise<void> {
    return new Promise((resolve) => {
      const sub = this.categoryService.getCategories().subscribe({
        next: (response) => {
          this.availableTags = (response || []).map((c) => c.categoryname);
          console.log('Categories loaded:', this.availableTags.length);
          resolve();
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.availableTags = []; // Fallback
          resolve(); // Don't fail initialization
        }
      });
      this.subscriptions.push(sub);
    });
  }
  loadUserProfile(): Promise<void> {
    return new Promise((resolve) => {
      const sub = this.profileService.getUserProfile().subscribe({
        next: (profile) => {
          this.userProfile = profile;
          console.log('User profile loaded successfully');
          resolve();
        },
        error: (error) => {
          console.log('User profile not loaded (optional)');
          resolve(); // Don't fail initialization
        }
      });
      this.subscriptions.push(sub);
    });
  }

  loadLanguages(): Promise<void> {
    return new Promise((resolve, reject) => {
      const sub = this.languageService.getLanguages().subscribe({
        next: (response) => {
          this.languages = response.data.languages || [];
          this.defaultLanguage = this.languages.find(lang => lang.is_default) || null;
          this.currentLanguage = this.defaultLanguage;
          console.log('Languages loaded:', this.languages.length);
          resolve();
        },
        error: (error) => {
          console.error('Error loading languages:', error);
          this.notificationService.error(
            'Language Loading Failed',
            'Failed to load languages. Please refresh the page.',
            [
              {
                label: 'Refresh Page',
                action: () => window.location.reload(),
                style: 'primary'
              },
              {
                label: 'Go to Home',
                action: () => this.router.navigate(['/home']),
                style: 'secondary'
              }
            ]
          );
          reject(error);
        }
      });
      this.subscriptions.push(sub);
    });
  }

  handleRouteParams(): Promise<void> {
    return new Promise((resolve) => {
      const sub = this.route.queryParams.subscribe({
        next: async (params) => {
          const editPostId = params['edit'];
          if (editPostId) {
            console.log('Edit mode detected:', editPostId);
            this.isEditMode = true;
            this.editPostId = +editPostId;
            await this.loadPostForEditing(this.editPostId);
          } else {
            console.log('Create mode - initializing default tab');
            this.initializeDefaultTab();
          }
          resolve();
        },
        error: (error) => {
          console.error('Error handling route params:', error);
          resolve(); // Don't fail initialization
        }
      });
      this.subscriptions.push(sub);
    });
  }


  initializeDefaultTab(): void {
    if (this.defaultLanguage && !this.isEditMode) {
      const defaultTab: PostLanguageTab = {
        title: '',
        content: '',
        delta: this.createEmptyDelta(),
        language: this.defaultLanguage,
        isOriginal: true,
        isTranslating: false
      };
      
      this.languageTabs = [defaultTab];
      this.activeTabIndex = 0;
      
      setTimeout(() => {
        this.updateFormWithActiveTab();
      }, 200);
      
      console.log('Default tab initialized successfully');
    }
  }

  createEmptyDelta(): any {
    return { ops: [] };
  }

  updateFormWithActiveTab(): void {
    const activeTab = this.languageTabs[this.activeTabIndex];
    if (!activeTab) {
      console.warn('No active tab found');
      return;
    }

    this.blogForm.patchValue({
      title: activeTab.title,
      content: activeTab.content,
      languageid: activeTab.language.languageid,
    }, { emitEvent: false });

    setTimeout(() => {
      try {
        if (this.quillEditor && this.quillEditor.quillEditor) {
          if (activeTab.delta && activeTab.delta.ops && activeTab.delta.ops.length > 0) {
            this.quillEditor.quillEditor.setContents(activeTab.delta);
          } else if (activeTab.content) {
            this.quillEditor.quillEditor.clipboard.dangerouslyPasteHTML(activeTab.content);
          } else {
            this.quillEditor.quillEditor.setText('');
          }
          this.setUpAutoScroll();
        }
      } catch (error) {
        console.error('Error updating Quill editor:', error);
      }
    }, 300);

    if (activeTab.isOriginal) {
      this.blogForm.get('title')?.enable({ emitEvent: false });
      this.blogForm.get('content')?.enable({ emitEvent: false });
    } else {
      this.blogForm.get('title')?.disable({ emitEvent: false });
      this.blogForm.get('content')?.disable({ emitEvent: false });
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
      } else {
        console.warn('Quill editor not available, using form value for content.');
        currentTab.content = this.blogForm.get('content')?.value || '';
      }
    }
  }

  removeTab(index: number): void {
    const tab = this.languageTabs[index];
    if (tab.isOriginal) {
      this.notificationService.warning(
        'Cannot Remove Tab',
        'Cannot remove the original language tab.'
      );
      return;
    }

    this.languageTabs.splice(index, 1);
    
    if (this.activeTabIndex >= index) {
      this.activeTabIndex = Math.max(0, this.activeTabIndex - 1);
    }
    
    this.updateFormWithActiveTab();
  }


  async loadPostForEditing(editPostId: number): Promise<void> {
    try {
      console.log('Loading post for editing:', editPostId);
      this.languageTabs = [];
      this.translations = [];
      this.activeTabIndex = 0;
      this.selectedTags.clear();      
      const post = await this.getPost(editPostId);
      this.post = post;
      const postLanguage = this.languages.find(lang => lang.languageid === post.languageid);
      if (!postLanguage) {
        throw new Error('Post language not found');
      }
      const originalTab: PostLanguageTab = {
        title: post.title,
        content: post.content,
        language: postLanguage,
        isOriginal: true,
        isTranslating: false,
        delta: this.createEmptyDelta(),
      };
      
      this.languageTabs = [originalTab];
      this.activeTabIndex = 0;
      
      // Set tags
      if (post.tags && Array.isArray(post.tags)) {
        this.selectedTags = new Set(post.tags);
      }      
      this.blogForm.patchValue({
        title: post.title,
        content: post.content,
        languageid: post.languageid,
        tags: post.tags || []
      });
      await this.convertHtmlToDelta(originalTab, post.content);
      await this.loadTranslations(editPostId);      
      this.updateFormWithActiveTab();
      
      console.log('Post loaded successfully for editing');
      
    } catch (error) {
      console.error('Error loading post for editing:', error);
      this.isLoading = false; 
      this.isInitializing = false;
      this.notificationService.error(
        'Post Loading Failed',
        'Failed to load post for editing. Please try again.',
        [
          {
            label: 'Go to Profile',
            action: () => this.router.navigate(['/useraccount/profile']),
            style: 'primary'
          }
        ],
        3000
      );
      setTimeout(() => {
        this.router.navigate(['/useraccount/profile']);
      }, 3000);
    }
  }

  getPost(postId: number): Promise<Post> {
    return new Promise((resolve, reject) => {
      const sub = this.postService.getSpecificPost(postId).subscribe({
        next: (post) => resolve(post),
        error: (error) => reject(error)
      });
      this.subscriptions.push(sub);
    });
  }

  loadTranslations(editPostId: number): Promise<void> {
    return new Promise((resolve) => {
      const sub = this.postService.getTranslationPost(editPostId).subscribe({
        next: async (translations) => {
          this.translations = translations;
          await this.createTranslationTabs();
          console.log('Translations loaded successfully:', translations.length);
          resolve();
        },
        error: (error) => {
          console.error('Error loading translations:', error);
          resolve(); // Don't fail - translations are optional
        }
      });
      this.subscriptions.push(sub);
    });
  }

  async createTranslationTabs(): Promise<void> {
    for (const translation of this.translations) {
      const translationLanguage = this.languages.find(lang => lang.languageid === translation.languageid);
      
      if (translationLanguage) {
        const translationTab: PostLanguageTab = {
          title: translation.title,
          content: translation.content,
          delta: this.createEmptyDelta(),
          language: translationLanguage,
          isOriginal: false,
          isTranslating: false
        };
        
        this.languageTabs.push(translationTab);
        
        await this.convertHtmlToDelta(translationTab, translation.content);        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  convertHtmlToDelta(tab: PostLanguageTab, htmlContent: string): Promise<void> {
    return new Promise((resolve) => {
      if (!htmlContent || !this.quillEditor?.quillEditor) {
        tab.delta = this.createEmptyDelta();
        resolve();
        return;
      }
      setTimeout(() => {
        try {
          const currentContents = this.quillEditor.quillEditor.getContents();
          this.quillEditor.quillEditor.clipboard.dangerouslyPasteHTML(htmlContent);
          tab.delta = this.quillEditor.quillEditor.getContents();
          this.quillEditor.quillEditor.setContents(currentContents);
          resolve();
        } catch (error) {
          console.error('Error converting HTML to Delta:', error);
          tab.delta = this.createEmptyDelta();
          resolve();
        }
      }, 200);
    });
  }

  addTranslationTab(language: Language): void {
    const existingTab = this.languageTabs.find(tab => tab.language.languageid === language.languageid);
    if (existingTab) {
      this.activeTabIndex = this.languageTabs.indexOf(existingTab);
      this.updateFormWithActiveTab();
      return;
    }
    
    this.saveCurrentTabData();
    
    const originalTab = this.languageTabs.find(tab => tab.isOriginal);
    if (!originalTab || !originalTab.content.trim() || !originalTab.title.trim()) {
      this.notificationService.warning(
        'Missing Content',
        'Please fill in the original content before adding a translation.'
      );
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

  async translateDeltaOps(originalDelta: any, targetLanguage: Language): Promise<any> {
    if (!originalDelta || !originalDelta.ops) {
      return Promise.resolve(this.createEmptyDelta());
    }
    const translatedOps = [...originalDelta.ops];
    const translationPromises: Promise<void>[] = [];
    for (let i = 0; i < translatedOps.length; i++) {
      const op = { ...translatedOps[i] };
      if (typeof op.insert === 'string') {
        if (this.isFormattingOnlyString(op.insert)) {
          translatedOps[i] = op;
        } else {
          const translationPromise = new Promise<void>((resolve) => {
            const sub = this.translateService.translate(
              op.insert, 
              this.defaultLanguage?.languagename ?? 'auto', 
              targetLanguage.languagename
            ).subscribe({
              next: (response: any) => {
                try {
                  op.insert = response.data;
                  translatedOps[i] = op;
                  resolve();
                } catch (error) {
                  console.error('Error parsing translation response:', error);
                  op.insert = `[${targetLanguage.languagename}] ${op.insert}`;
                  translatedOps[i] = op;
                  resolve();
                }
              },
              error: (error) => {
                console.error('Translation error:', error);
                op.insert = `[${targetLanguage.languagename}] ${op.insert}`;
                translatedOps[i] = op;
                resolve();
              }
            });
            this.subscriptions.push(sub);
          });
          
          translationPromises.push(translationPromise);
        }
      } else {
        translatedOps[i] = op;
      }
    }
    await Promise.all(translationPromises);
    return { ops: translatedOps };
  }

  translateContent(originalTab: PostLanguageTab, targetTab: PostLanguageTab): void {
    targetTab.isTranslating = true;
    this.updateFormWithActiveTab();
    const targetLanguage = targetTab.language;
    const titleSub = this.translateService.translate(
      originalTab.title,
      this.defaultLanguage?.languagename ?? 'auto',
      targetLanguage.languagename
    ).subscribe({
      next: (response: any) => {
        try {
          targetTab.title = response.data;
        } catch (error) {
          console.error('Error translating title:', error);
          targetTab.title = `[${targetLanguage?.languagename}] ${originalTab.title}`;
        }
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
        }).catch((error) => {
          console.error('Translation failed:', error);
          targetTab.isTranslating = false;
          this.notificationService.error(
            'Translation Failed',
            'Translation failed. Please try again.',
            [
              {
                label: 'Retry Translation',
                action: () => this.translateContent(originalTab, targetTab),
                style: 'primary'
              }
            ]
          );
        });
      },
      error: (error) => {
        console.error('Title translation error:', error);
        targetTab.title = `[${targetLanguage?.languagename}] ${originalTab.title}`;
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
    this.subscriptions.push(titleSub);
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

  getDeltaContent(): any {
    if (this.quillEditor && this.quillEditor.quillEditor) {
      return this.quillEditor.quillEditor.getContents();
    }
    return this.createEmptyDelta();
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
    if (!isPlatformBrowser(this.platformId)) {
      // this.errorMessage = 'This feature is only available in the browser.';
      return;
    }
    
    this.saveCurrentTabData();
    
    const originalTab = this.languageTabs.find(tab => tab.isOriginal);
    if (!originalTab || !originalTab.title.trim() || !originalTab.content.trim()) {
      this.notificationService.warning(
        'Missing Required Fields',
        'Please fill in the original title and content.'
      );
      return;
    }

    const hasTranslatingTabs = this.languageTabs.some(tab => tab.isTranslating);
    if (hasTranslatingTabs) {
      this.notificationService.info(
        'Translation in Progress',
        'Please wait for all translations to complete before submitting.'
      );
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

    const endpoint = this.isEditMode 
      ? 'http://localhost:3000/post-owner/update-post'
      : 'http://localhost:3000/post-owner/create-post';
    
    const method = this.isEditMode ? 'put' : 'post';

    if (this.isEditMode && this.editPostId !== null) {
      payload['postid'] = this.editPostId;
    }

    const sub = this.http[method](endpoint, payload, { withCredentials: true }).subscribe({
      next: (response) => {
        const action = this.isEditMode ? 'updated' : 'submitted';
        this.notificationService.success(
          'Success!',
          `Your blog "${payload.originalPost.title}" and its ${payload.translations.length} translation(s) were ${action} successfully! Redirecting...`,
          2000
        );
        this.isLoading = false;
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 2000);
      },
      error: (err) => {
        console.error('Submit error:', err);
        const action = this.isEditMode ? 'update' : 'submit';
        this.notificationService.error(
          'Submission Failed',
          `Failed to ${action} blog. Please try again.`,
          [
            {
              label: 'Try Again',
              action: () => this.submitBlog(),
              style: 'primary'
            }
          ]
        );
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }
  selectLanguage(language: Language): void {
    this.currentLanguage = language;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('locale_code', language.locale_code);
    }
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}