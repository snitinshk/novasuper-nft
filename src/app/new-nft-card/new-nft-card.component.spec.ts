import { ComponentFixture, TestBed } from "@angular/core/testing";

import { NewNftCardComponent } from "./new-nft-card.component";

describe("NewNftCardComponent", () => {
  let component: NewNftCardComponent;
  let fixture: ComponentFixture<NewNftCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NewNftCardComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewNftCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
