import { ComponentFixture, TestBed } from "@angular/core/testing";

import { OfflineInfoComponent } from "./offline-info.component";

describe("OfflineInfoComponent", () => {
  let component: OfflineInfoComponent;
  let fixture: ComponentFixture<OfflineInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OfflineInfoComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OfflineInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
