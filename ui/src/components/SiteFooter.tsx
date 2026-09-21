import { Container } from './Container';

export function SiteFooter() {
  return (
    <Container
      as="footer"
      className="flex flex-wrap justify-between gap-3 border-t border-slate-200 py-6 text-xs text-slate-500"
    >
      <span>SCELE Tracker · Independent student tool, not an official UI service.</span>
      <span>Times displayed in your local time zone</span>
    </Container>
  );
}
