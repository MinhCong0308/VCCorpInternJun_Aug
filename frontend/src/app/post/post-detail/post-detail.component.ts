import { Component, OnInit } from '@angular/core';
import { PostService } from '../../core/services/post.service';
import { CommentService } from '../../core/services/comment.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-post-detail',
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.css'],
  standalone: false,
})
export class PostDetailComponent implements OnInit {
  postId: any;
  post: any;
  comments: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private postService: PostService,
    private commentService: CommentService,
  ) {}
  

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.postId = params.get('postId');
      console.log("postId:", this.postId);
      if (this.postId === null) {
        console.error("Invalid post id");
        return;
      }
      this.loadPost(this.postId);
      this.loadComments(this.postId);
    });
  }

  loadPost(id: any): void {
    this.postService.getPostDetail(id).subscribe({
      next: (res: any) => {
        this.post = res.data;
        console.log("this.post=", this.post)
      },
      error: (err) => console.error('Failed to load post', err)
    });
  }

  loadComments(id: any): void {
    this.commentService.getCommentsByPostId(id).subscribe({
        next: (res: any) => {
          this.comments = res.data;
        }
      });
  }
}
