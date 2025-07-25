import { Injectable } from '@angular/core';

export interface CreateBlogRequest {
  title: string;
  content: string;
  languageid: number;
  tags: string[];
}
export interface CreateBlogResponse {
  success: boolean;
  message: string;
  data?: any;
}
@Injectable({
  providedIn: 'root'
})
export class BlogService {
  createPost(blogData: { title: string; content: any; languageid: number; tags: string[]; }) {
    throw new Error('Method not implemented.');
  }
  private baseUrl = 'http://localhost:3000';
  constructor() { }
  // Add methods to interact with the blog API
  async createBlog(blogData: CreateBlogRequest): Promise<CreateBlogResponse> {
    const accessToken = localStorage.getItem('accessToken');
    if(!accessToken) {
      return {
        success: false,
        message: 'You need to be logged in to create a blog.'
      };
    }
    try {
      const response = await fetch(`${this.baseUrl}/post-owner/create-post`, {
        method: 'POST',
        headers: {
          'Content-Type' : 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(blogData)
      });
      const data = await response.json();
      return {
        success: response.ok,
        message: data.message || (response.ok ? 'Blog created successfully!' : 'Failed to create blog'),
        data: data.data
      }
    } catch(error: any) {
      console.error('Error creating blog', error);
      return {
        success: false,
        message: 'Network error occured while creating blog'
      }
    }
  }
}
