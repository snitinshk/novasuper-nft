import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BidsAccordionComponent } from './bids-accordion.component';

describe('BidsAccordionComponent', () => {
  let component: BidsAccordionComponent;
  let fixture: ComponentFixture<BidsAccordionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BidsAccordionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BidsAccordionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
