import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateYourNftComponent } from './create-your-nft.component';

describe('CreateYourNftComponent', () => {
  let component: CreateYourNftComponent;
  let fixture: ComponentFixture<CreateYourNftComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateYourNftComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateYourNftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
