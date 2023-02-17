import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatorProfileCreatedComponent } from './creator-profile-created.component';

describe('CreatorProfileCreatedComponent', () => {
  let component: CreatorProfileCreatedComponent;
  let fixture: ComponentFixture<CreatorProfileCreatedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreatorProfileCreatedComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatorProfileCreatedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
