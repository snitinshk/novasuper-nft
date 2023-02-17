import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MarketplaceLeftBarMobileComponent } from "./marketplace-left-bar-mobile.component";

describe("MarketplaceLeftBarMobileComponent", () => {
  let component: MarketplaceLeftBarMobileComponent;
  let fixture: ComponentFixture<MarketplaceLeftBarMobileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MarketplaceLeftBarMobileComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MarketplaceLeftBarMobileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
