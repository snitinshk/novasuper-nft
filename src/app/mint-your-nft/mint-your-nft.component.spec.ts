import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MintYourNftComponent } from './mint-your-nft.component';

describe('MintYourNftComponent', () => {
  let component: MintYourNftComponent;
  let fixture: ComponentFixture<MintYourNftComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MintYourNftComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MintYourNftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
