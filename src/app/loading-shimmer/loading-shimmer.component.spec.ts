import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadingShimmerComponent } from './loading-shimmer.component';

describe('LoadingShimmerComponent', () => {
  let component: LoadingShimmerComponent;
  let fixture: ComponentFixture<LoadingShimmerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoadingShimmerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoadingShimmerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
