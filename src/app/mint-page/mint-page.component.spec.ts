import { ComponentFixture, TestBed } from "@angular/core/testing";

import { MintPageComponent } from "./mint-page.component";

describe("MintPageComponent", () => {
  let component: MintPageComponent;
  let fixture: ComponentFixture<MintPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MintPageComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MintPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
