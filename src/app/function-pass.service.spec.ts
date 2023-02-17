import { TestBed } from '@angular/core/testing';

import { FunctionPassService } from './function-pass.service';

describe('FunctionPassService', () => {
  let service: FunctionPassService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FunctionPassService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
