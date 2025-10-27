import { TestBed } from '@angular/core/testing';

import { AspectData } from './aspect-data';

describe('AspectData', () => {
  let service: AspectData;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AspectData);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
