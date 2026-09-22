// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { DataStatusNotice } from '../ui/src/components/DataStatusNotice';

afterEach(cleanup);
it('shows a loading status rather than a stale warning', () => {
  render(<DataStatusNotice error="" loading />);
  expect(screen.getByRole('status').textContent).toContain('Loading course data');
  expect(screen.queryByRole('alert')).toBeNull();
});
it('prioritizes real errors over loading and hides completed notices', () => {
  const { rerender } = render(<DataStatusNotice error="Connection failed" loading />);
  expect(screen.getByRole('alert').textContent).toContain('Connection failed');
  expect(screen.queryByRole('status')).toBeNull();
  rerender(<DataStatusNotice error="" loading={false} />);
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.queryByRole('status')).toBeNull();
});
