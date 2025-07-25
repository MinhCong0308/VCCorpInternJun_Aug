import { Component, OnInit, AfterViewInit } from '@angular/core';

declare var Quill: any; // ✅ Declare outside the class

@Component({
  selector: 'app-create-blog',
  templateUrl: './create-blog.component.html',
  styleUrls: ['./create-blog.component.css'],
  standalone: false,
})
export class CreateBlogComponent implements OnInit, AfterViewInit {
  blogForm = {
    title: '',
    content: ''
  };

  selectedLanguageId = 1;
  selectedLanguageName = 'English';
  languages = [
    { id: 1, name: 'English' },
    { id: 2, name: 'Vietnamese' },
    { id: 3, name: 'French' }
  ];

  availableTags: string[] = [
    'Tech', 'Travel', 'Food', 'Education', 'Health',
    'Science', 'Art', 'Finance', 'Music', 'Games'
  ];
  selectedTags = new Set<string>();

  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    const quill = new Quill('#quill-editor', {
      theme: 'snow',
      placeholder: 'Tell your story...',
      modules: {
        toolbar: { container: '#quill-toolbar' }
      }
    });

    quill.on('text-change', () => {
      this.blogForm.content = quill.root.innerHTML;
    });
  }

  selectLanguage(id: number, name: string, event: Event): void {
    event.preventDefault();
    this.selectedLanguageId = id;
    this.selectedLanguageName = name;
  }

  toggleTag(tag: string, event: Event): void {
    event.preventDefault();
    if (this.selectedTags.has(tag)) {
      this.selectedTags.delete(tag);
    } else {
      this.selectedTags.add(tag);
    }
  }

  getSelectedTagsArray(): string[] {
    return Array.from(this.selectedTags);
  }

  removeTag(tag: string): void {
    this.selectedTags.delete(tag);
  }

  autoResizeTitle(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  async submitBlog(): Promise<void> {
    if (!this.blogForm.title || !this.blogForm.content) {
      this.errorMessage = 'Please enter both title and content.';
      return;
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      this.errorMessage = 'You need to be logged in to submit a blog.';
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/post-owner/create-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + accessToken
        },
        body: JSON.stringify({
          title: this.blogForm.title,
          content: this.blogForm.content,
          languageid: this.selectedLanguageId,
          tags: this.getSelectedTagsArray()
        })
      });

      const data = await res.json();
      if (res.ok) {
        this.successMessage = `Blog titled '${this.blogForm.title}' submitted successfully.`;
        setTimeout(() => location.href = '/home', 2000);
      } else {
        this.errorMessage = data.message || 'Failed to submit blog.';
      }
    } catch (err) {
      console.error(err);
      this.errorMessage = 'Something went wrong.';
    }
  }
}
