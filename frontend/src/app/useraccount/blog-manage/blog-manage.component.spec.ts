import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlogManageComponent } from './blog-manage.component';

describe('BlogManageComponent', () => {
  let component: BlogManageComponent;
  let fixture: ComponentFixture<BlogManageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlogManageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BlogManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
