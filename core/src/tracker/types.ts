export type Activity = {
  id: string;
  kind: 'assignment' | 'quiz';
  name: string;
  courseId: number;
  courseName: string;
  description: string;
  url: string;
  opensAt: number | null;
  dueAt: number | null;
  cutoffAt: number | null;
  timeLimit: number | null;
  source: string;
};
export type Account = {
  id: string;
  mode: 'session' | 'token';
  username?: string;
  password?: string;
  token?: string;
};
export type SyncResult = { activities: Activity[]; complete: boolean };
export type SourceStatus = {
  id: string;
  state: 'ok' | 'partial' | 'error';
  updatedAt: string | null;
};
