import { ComponentFixture, TestBed } from "@angular/core/testing";

import { PageSmallNavComponent } from "./page-small-nav.component";

describe("PageSmallNavComponent", () => {
  let component: PageSmallNavComponent;
  let fixture: ComponentFixture<PageSmallNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PageSmallNavComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PageSmallNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
