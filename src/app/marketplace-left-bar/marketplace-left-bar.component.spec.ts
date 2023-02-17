import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MarketplaceLeftBarComponent } from "./marketplace-left-bar.component";

describe("MarketplaceLeftBarComponent", () => {
  let component: MarketplaceLeftBarComponent;
  let fixture: ComponentFixture<MarketplaceLeftBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MarketplaceLeftBarComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MarketplaceLeftBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
