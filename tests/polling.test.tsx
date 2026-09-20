// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../ui/src/pages/DashboardPage';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it('polls visible dashboards only and cleans up after unmount', async () => {
  vi.useFakeTimers();
  let visible = false;
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() =>
    visible ? 'visible' : 'hidden',
  );
  const fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ activities: [], incomplete: false }),
  });
  vi.stubGlobal('fetch', fetch);
  const view = render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
  await act(async () => {
    await vi.advanceTimersByTimeAsync(120_000);
  });
  expect(fetch).not.toHaveBeenCalled();
  visible = true;
  await act(async () => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(fetch).toHaveBeenCalledTimes(1);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60_000);
  });
  expect(fetch).toHaveBeenCalledTimes(2);
  visible = false;
  await act(async () => {
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(120_000);
  });
  expect(fetch).toHaveBeenCalledTimes(2);
  view.unmount();
  visible = true;
  await act(async () => {
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(60_000);
  });
  expect(fetch).toHaveBeenCalledTimes(2);
});
