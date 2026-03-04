import { Link } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useMobile } from '../hooks/useMobile.js';
import ObulaLogo from './ObulaLogo.jsx';

function ProfileDropdown({ profile, isAdmin, onClose, onSignOut, isMobile }) {
  const ref = useRef(null);
  const [showEmail, setShowEmail] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const initials = (profile?.full_name?.split(' ')[0]?.[0] || profile?.email?.split('@')[0]?.[0] || '?').toUpperCase();

  return (
    <m.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute right-0 border border-white/[0.08] bg-[#111] shadow-2xl shadow-black/60 overflow-hidden z-[100] ${
        isMobile ? 'top-11 w-44 rounded-lg' : 'top-14 w-72 rounded-2xl'
      }`}
    >
      {/* User info header */}
      <div className={isMobile ? 'p-2 border-b border-white/[0.06]' : 'p-5 border-b border-white/[0.06]'}>
        <div className={`flex items-center ${isMobile ? 'gap-1.5' : 'gap-3'}`}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className={`rounded-full object-cover flex-shrink-0 ${isMobile ? 'w-7 h-7' : 'w-12 h-12'}`} />
          ) : (
            <div className={`rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0 ${isMobile ? 'w-7 h-7 text-xs' : 'w-12 h-12 text-lg'}`}>
              {initials}
            </div>
          )}
          <div className={`min-w-0 ${isMobile ? 'flex-1 min-w-0' : ''}`}>
            <p className={`text-white font-semibold truncate ${isMobile ? 'text-[11px]' : 'text-sm'}`}>
              {profile?.full_name || 'No name set'}
            </p>
            {isMobile ? (
              <div className="flex items-center gap-1 mt-0">
                {showEmail ? (
                  <p className="text-white/40 truncate text-[10px] flex-1 min-w-0">{profile?.email}</p>
                ) : null}
                <button
                  type="button"
                  onClick={() => setShowEmail((v) => !v)}
                  className="shrink-0 p-0.5 rounded text-white/40 hover:text-white/70 transition touch-manipulation"
                  aria-label={showEmail ? 'Hide email' : 'Show email'}
                  title={showEmail ? 'Hide email' : 'Show email'}
                >
                  {showEmail ? (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 mt-0.5">
                {showEmail ? (
                  <p className="text-white/40 truncate text-xs flex-1 min-w-0">{profile?.email}</p>
                ) : null}
                <button
                  type="button"
                  onClick={() => setShowEmail((v) => !v)}
                  className="shrink-0 p-0.5 rounded text-white/40 hover:text-white/70 transition"
                  aria-label={showEmail ? 'Hide email' : 'Show email'}
                  title={showEmail ? 'Hide email' : 'Show email'}
                >
                  {showEmail ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            )}
            {isAdmin && (
              <span className={`inline-block rounded-full bg-primary/20 text-primary font-semibold ${isMobile ? 'mt-0.5 text-[8px] px-1.5 py-px' : 'mt-1 text-[10px] px-1.5 py-0.5'}`}>
                Admin
              </span>
            )}
          </div>
        </div>

        {/* Credits bar */}
        <div className={`rounded-xl bg-white/[0.04] border border-white/[0.06] ${isMobile ? 'mt-1.5 p-1.5 rounded-lg' : 'mt-4 p-3'}`}>
          <div className={`flex items-center justify-between ${isMobile ? 'mb-0.5' : 'mb-1.5'}`}>
            <span className={`text-white/50 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>Credits</span>
            <span className={`font-bold ${(profile?.credits ?? 0) > 0 ? 'text-primary' : 'text-yellow-400'} ${isMobile ? 'text-[11px]' : 'text-sm'}`}>
              {profile?.credits ?? 0}
            </span>
          </div>
          <div className={`rounded-full bg-white/[0.06] overflow-hidden ${isMobile ? 'h-0.5' : 'h-1.5'}`}>
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, ((profile?.credits ?? 0) / 300) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Menu links */}
      <div className={isMobile ? 'p-1' : 'p-2'}>
        <button
          onClick={() => { onClose(); onSignOut(); }}
          className={`w-full flex items-center hover:bg-red-500/10 text-white/50 hover:text-red-400 transition group ${isMobile ? 'gap-1.5 px-2 py-1.5 rounded-lg' : 'gap-3 px-3 py-2.5 rounded-xl'}`}
        >
          <svg className={`text-white/20 group-hover:text-red-400/60 transition shrink-0 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
            <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
          </svg>
          <span className={isMobile ? 'text-[11px]' : 'text-sm'}>Sign out</span>
        </button>
      </div>
    </m.div>
  );
}

export default function LandingNav({ visible = true }) {
  const { isAuthenticated, user, profile, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const isMobile = useMobile();

  const initials = (profile?.full_name?.split(' ')[0]?.[0] || profile?.email?.split('@')[0]?.[0] || '?').toUpperCase();

  return (
    <m.header
      initial={false}
      animate={{
        y: visible ? 0 : -110,
        opacity: visible ? 1 : 0,
        visibility: visible ? 'visible' : 'hidden',
      }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 py-4"
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
    >
      <nav className="max-w-7xl mx-auto rounded-2xl px-3 sm:px-5 py-2 sm:py-3 glass-card min-h-[48px] sm:min-h-[52px] overflow-visible">
        {isMobile ? (
          /* Mobile: different layout for logged-in vs logged-out */
          isAuthenticated ? (
            /* Logged-in mobile: [OBULA left] [Pricing] [Create clip] [Profile right] */
            <div className="flex items-center justify-between gap-2 h-[40px]">
              <ObulaLogo size="md" className="shrink-0" />
              <Link
                to="/pricing"
                className="btn-accent flex items-center justify-center px-3 py-2 text-xs font-semibold leading-none rounded-xl touch-manipulation shrink-0"
              >
                Pricing
              </Link>
              <Link
                to="/upload"
                className="btn-accent flex items-center justify-center px-3 py-2 text-xs font-semibold leading-none rounded-xl touch-manipulation shrink-0 min-w-[88px]"
              >
                Create clip
              </Link>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    aria-haspopup="true"
                    aria-expanded={open}
                    aria-label="Account menu"
                    title="Account menu"
                    className={`w-8 h-8 rounded-full flex items-center justify-center ring-2 transition-all touch-manipulation flex-shrink-0 ${
                      open ? 'ring-primary' : 'ring-white/10'
                    }`}
                  >
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                        {initials}
                      </div>
                    )}
                  </button>
                  <AnimatePresence>
                    {open && (
                      <ProfileDropdown
                        profile={profile}
                        isAdmin={isAdmin}
                        onClose={() => setOpen(false)}
                        onSignOut={logout}
                        isMobile={isMobile}
                      />
                    )}
                  </AnimatePresence>
                </div>
            </div>
          ) : (
            /* Logged-out mobile: [OBULA left] [Pricing right] */
            <div className="flex items-center justify-between w-full h-[40px]">
              <ObulaLogo size="sm" className="shrink-0" />
              <Link
                to="/pricing"
                className="btn-accent flex items-center justify-center px-3 py-2 text-xs font-semibold leading-none rounded-xl touch-manipulation shrink-0"
              >
                Pricing
              </Link>
            </div>
          )
        ) : (
          /* Desktop: current layout (locked) */
          <div className="flex flex-nowrap items-center justify-between gap-3 h-[44px]">
            <ObulaLogo size="lg" className="shrink-0" />
            <div className="flex flex-nowrap items-center gap-3 shrink-0">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/pricing"
                    className="btn-accent flex items-center justify-center px-4 py-2.5 text-sm font-semibold leading-none rounded-xl touch-manipulation whitespace-nowrap"
                  >
                    Pricing
                  </Link>
                  <Link
                    to="/upload"
                    className="btn-accent flex items-center justify-center px-5 py-2.5 text-sm font-semibold leading-none rounded-xl touch-manipulation whitespace-nowrap"
                  >
                    Create clip
                  </Link>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpen((v) => !v)}
                      aria-haspopup="true"
                      aria-expanded={open}
                      aria-label="Account menu"
                      title="Account menu"
                      className={`w-9 h-9 rounded-full flex items-center justify-center ring-2 transition-all touch-manipulation flex-shrink-0 ${
                        open ? 'ring-primary' : 'ring-white/10 hover:ring-white/30'
                      }`}
                    >
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                          {initials}
                        </div>
                      )}
                    </button>
                    <AnimatePresence>
                      {open && (
                        <ProfileDropdown
                          profile={profile}
                          isAdmin={isAdmin}
                          onClose={() => setOpen(false)}
                          onSignOut={logout}
                          isMobile={isMobile}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <Link
                  to="/pricing"
                  className="btn-accent flex items-center justify-center px-5 py-2.5 text-sm font-semibold leading-none rounded-xl touch-manipulation whitespace-nowrap"
                >
                  Pricing
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </m.header>
  );
}
