import { TestBed } from '@angular/core/testing';

import { PostBlogOwnerService } from './postowner.service';

describe('PostBlogOwnerService', () => {
  let service: PostBlogOwnerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PostBlogOwnerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
