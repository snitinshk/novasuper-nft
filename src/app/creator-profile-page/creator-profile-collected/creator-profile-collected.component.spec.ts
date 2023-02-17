import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CreatorProfileCollectedComponent } from "./creator-profile-collected.component";

describe("CreatorProfileCollectedComponent", () => {
  let component: CreatorProfileCollectedComponent;
  let fixture: ComponentFixture<CreatorProfileCollectedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreatorProfileCollectedComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatorProfileCollectedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
