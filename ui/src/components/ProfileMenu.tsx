import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronDown, GraduationCap, LogOut, Shield, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeSelect } from './ThemeSelect';
import styles from './ProfileMenu.module.css';

export function ProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on clicks outside or Escape key
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (!user) return null;

  const prodiLabel = user.academicInfo || (user.kd_org ? `${user.prodi || 'Ilmu Komputer'} (${user.kd_org})` : (user.prodi || 'Ilmu Komputer'));
  const classLabel = user.angkatan ? `Class of ${user.angkatan}` : 'Class of 2026';

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="true"
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 transition hover:border-teal-500 dark:hover:border-teal-500 hover:text-teal-700 dark:hover:text-teal-300"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
          <UserIcon size={14} />
        </div>
        <span className="hidden font-medium md:inline max-w-[130px] lg:max-w-[180px] truncate">
          {user.fullname}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-400 dark:text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Profile popup menu"
          className="absolute right-0 z-50 mt-2 w-72 origin-top-right rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 shadow-lg ring-1 ring-black/5 dark:ring-white/5 focus:outline-none"
        >
          {/* User profile & academic header */}
          <div className="border-b border-slate-100 dark:border-slate-700/80 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                <UserIcon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {user.fullname}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  <span>{user.username}</span>
                  {user.role !== 'user' && (
                    <>
                      {' · '}
                      <span className="font-medium text-teal-700 dark:text-teal-400 capitalize">
                        {user.role === 'admin' ? 'Administrator' : user.role}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
            {(prodiLabel || classLabel) && (
              <div className="mt-2.5 flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-300">
                {prodiLabel && (
                  <div className="flex items-center gap-1.5">
                    <GraduationCap size={14} className="shrink-0 text-slate-400 dark:text-slate-400" />
                    <span className="truncate">{prodiLabel}</span>
                  </div>
                )}
                {classLabel && (
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Calendar size={14} className="shrink-0 text-slate-400 dark:text-slate-400" />
                    <span className="truncate">{classLabel}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="py-1">
            {user.role === 'admin' && (
              <Link
                to="/admin"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <Shield size={16} className="text-teal-600 dark:text-teal-400" />
                <span>Admin Page</span>
              </Link>
            )}

            {/* Theme selector section */}
            <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Theme</span>
              <ThemeSelect />
            </div>
          </div>

          {/* Sign out section */}
          <div className="border-t border-slate-100 dark:border-slate-700/80 pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-600 dark:text-rose-400 transition hover:bg-rose-50 dark:hover:bg-rose-950/60"
            >
              <LogOut size={16} className="text-rose-500 dark:text-rose-400" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
