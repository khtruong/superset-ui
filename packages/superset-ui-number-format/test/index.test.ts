import {
  createD3NumberFormatter,
  createDurationFormatter,
  createSiAtMostNDigitFormatter,
  formatNumber,
  getNumberFormatter,
  getNumberFormatterRegistry,
  NumberFormats,
  NumberFormatter,
  PREVIEW_VALUE,
} from '../src/index';

describe('index', () => {
  it('exports modules', () => {
    [
      createD3NumberFormatter,
      createDurationFormatter,
      createSiAtMostNDigitFormatter,
      formatNumber,
      getNumberFormatter,
      getNumberFormatterRegistry,
      NumberFormats,
      NumberFormatter,
      PREVIEW_VALUE,
    ].forEach(x => expect(x).toBeDefined());
  });
});
