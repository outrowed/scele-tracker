import { Container } from './Container';
import { ThemeSelect } from './ThemeSelect';

export function SiteFooter() {
  return (
    <Container
      as="footer"
      className="flex flex-wrap justify-between items-center gap-3 border-t border-slate-200 dark:border-slate-700 py-6 text-xs text-slate-500 dark:text-slate-400"
    >
      <span>SCELE Tracker · Independent student tool, not an official UI service.</span>
      <ThemeSelect />
    </Container>
  );
}
