import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmallLeftBarComponent } from './small-left-bar.component';

describe('SmallLeftBarComponent', () => {
  let component: SmallLeftBarComponent;
  let fixture: ComponentFixture<SmallLeftBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SmallLeftBarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SmallLeftBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
