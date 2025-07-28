import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-create-blog',
  templateUrl: './create-blog.component.html',
  styleUrls: ['./create-blog.component.css'],
  standalone: false,
})
export class CreateBlogComponent implements OnInit {
  blogForm!: FormGroup;

  selectedTags: Set<string> = new Set();
  availableTags: string[] = [
    'Tech', 'Travel', 'Food', 'Education', 'Health',
    'Science', 'Art', 'Finance', 'Music', 'Games'
  ];

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

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.blogForm = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      languageId: [1, Validators.required],
      tags: [[]]
    });
  }

  selectLanguage(lang: { id: number; name: string; flag: string }, event: Event): void {
    event.preventDefault();
    this.blogForm.patchValue({ languageId: lang.id });
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

  submitBlog(): void {
    if (this.blogForm.invalid) {
      alert('Please fill in all required fields.');
      return;
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      alert('You need to be logged in to submit.');
      return;
    }

    const payload = this.blogForm.value;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${accessToken}`);

    this.http.post('http://localhost:3000/post-owner/create-post', payload, { headers }).subscribe({
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
