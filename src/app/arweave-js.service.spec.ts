import { TestBed } from "@angular/core/testing";

import { ArweaveJsService } from "./arweave-js.service";

describe("ArweaveJsService", () => {
  let service: ArweaveJsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArweaveJsService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
