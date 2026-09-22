import { AlertCircle, Loader2 } from 'lucide-react';
import { MessageBox } from './MessageBox';

export function DataStatusNotice({
  error,
  loading,
}: {
  error: string;
  loading: boolean;
}) {
  if (error)
    return (
      <MessageBox
        role="alert"
        variant="error"
        icon={AlertCircle}
        title="Connection issue"
      >
        {error}
      </MessageBox>
    );
  if (!loading) return null;
  return (
    <MessageBox
      role="status"
      variant="info"
      icon={Loader2}
      iconClassName="animate-spin"
      title="Loading course data"
    >
      The system is preparing your course data and loading the latest activities from
      SCeLE. Some activities may take a moment to appear.
    </MessageBox>
  );
}
