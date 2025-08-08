import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';


@Component({
  selector: 'app-create-blog',
  templateUrl: './create-blog.component.html',
  styleUrls: ['./create-blog.component.css'],
  standalone: false,
})
export class CreateBlogComponent implements OnInit {
  blogForm!: FormGroup;

  selectedTags: Set<string> = new Set();
  availableTags: string[] = [];
  isEditMode : boolean = false;
  editPostId: number | null = null;

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

  constructor(private fb: FormBuilder, private http: HttpClient, private route: ActivatedRoute, private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {}

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
        this.editPostId = +editPostId; // Convert to number
        this.loadPostForEditing(this.editPostId);
      }
    });
  }
  loadPostForEditing(postId: number): void {
    if (!isPlatformBrowser(this.platformId)) {
      alert('This feature is only available in the browser.');
      return;
    }
    this.http.get<any>(`http://localhost:3000/post-owner/get-specific-post/${postId}`, { withCredentials: true }).subscribe({
      next: (data) => {
        console.log('Post data:', data.data);
        this.blogForm.patchValue({
          title: data.data.title,
          content: data.data.content,
          languageid: data.data.languageid,
          tags: data.data.tags || []
        });
        this.selectedTags = new Set(data.data.tags || []);
        this.selectedLanguageName = this.languages.find(lang => lang.id === data.data.languageid)?.name || 'English';
        this.selectedLanguageFlag = this.languages.find(lang => lang.id === data.data.languageid)?.flag || '🇺🇸';
      },
      error: (err) => {
        console.error(err);
        alert('Failed to load post for editing.');
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
      alert('This feature is only available in the browser.');
      return;
    }
    if (this.blogForm.invalid) {
      alert('Please fill in all required fields.');
      return;
    }
    const payload = this.blogForm.value;

    if (this.isEditMode && this.editPostId !== null) {
      payload['postid'] = this.editPostId;

      // Perform UPDATE
      this.http.put('http://localhost:3000/post-owner/update-post', payload, { withCredentials: true }).subscribe({
        next: () => {
          alert(`Your blog "${payload.title}" was updated successfully.`);
          window.location.href = 'home.html';
        },
        error: err => {
          console.error(err);
          alert('Failed to update blog.');
        }
      });
    } else {
      // Perform CREATE
      this.http.post('http://localhost:3000/post-owner/create-post', payload, { withCredentials: true }).subscribe({
        next: () => {
          alert(`Your blog "${payload.title}" was submitted successfully.`);
          window.location.href = 'home.html';
        },
        error: err => {
          console.error(err);
          alert('Failed to submit blog.');
        }
      });
    }
  }
}
