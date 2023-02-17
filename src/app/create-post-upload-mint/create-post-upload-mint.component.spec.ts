import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePostUploadMintComponent } from './create-post-upload-mint.component';

describe('CreatePostUploadMintComponent', () => {
  let component: CreatePostUploadMintComponent;
  let fixture: ComponentFixture<CreatePostUploadMintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreatePostUploadMintComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatePostUploadMintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
