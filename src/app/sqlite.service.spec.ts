import { TestBed, inject } from '@angular/core/testing';

import { SqliteService } from './sqlite.service';

describe('SqliteService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SqliteService]
    });
  });

  it('should be created', inject([SqliteService], (service: SqliteService) => {
    expect(service).toBeTruthy();
  }));
});
