import { describe, expect, it } from 'vitest';
import { calculateBaseTileSize, calculateReadableColumns, MIN_READABLE_TILE_PX } from './tileSizing';

describe('tileSizing helpers', () => {
  describe('calculateReadableColumns', () => {
    it('keeps requested columns when each column stays above the minimum width', () => {
      const result = calculateReadableColumns(800, 4, 8);
      expect(result).toBe(4);
    });

    it('reduces columns until column width meets minimum readable width', () => {
      const result = calculateReadableColumns(400, 4, 8);
      expect(result).toBe(2);
    });

    it('never drops below one column when container width is extremely small', () => {
      const result = calculateReadableColumns(50, 3, 8);
      expect(result).toBe(1);
    });

    it('returns requested columns when container width is unavailable', () => {
      const result = calculateReadableColumns(0, 5, 8);
      expect(result).toBe(5);
    });
  });

  describe('calculateBaseTileSize', () => {
    it('clamps to the minimum readable size when width per column is too small', () => {
      const result = calculateBaseTileSize(320, 4, 8);
      expect(result).toBe(MIN_READABLE_TILE_PX);
    });

    it('returns computed width when columns have ample space', () => {
      const result = calculateBaseTileSize(1000, 5, 8);
      const totalGaps = (5 - 1) * 8;
      const expected = Math.floor((1000 - totalGaps) / 5);
      expect(result).toBe(expected);
    });

    it('falls back to minimum readable size when container width is zero or columns invalid', () => {
      expect(calculateBaseTileSize(0, 3, 8)).toBe(MIN_READABLE_TILE_PX);
      expect(calculateBaseTileSize(300, 0, 8)).toBe(MIN_READABLE_TILE_PX);
    });
  });
});
