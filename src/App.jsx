import { lazy, Suspense, useState } from 'react';
import { LazyMotion, domAnimation } from 'framer-motion';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ScrollProvider } from './context/ScrollContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import PageTransitionLayout from './components/PageTransitionLayout.jsx';
import PageLoading from './components/PageLoading.jsx';
import SplashScreen from './components/SplashScreen.jsx';

const Landing = lazy(() => import('./pages/Landing.jsx'));
const SignUp = lazy(() => import('./pages/SignUp.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const AuthCallback = lazy(() => import('./pages/AuthCallback.jsx'));
const Upload = lazy(() => import('./pages/Upload.jsx'));
const Editor = lazy(() => import('./pages/Editor.jsx'));
const Processing = lazy(() => import('./pages/Processing.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const Pricing = lazy(() => import('./pages/Pricing.jsx'));
const CompleteProfile = lazy(() => import('./pages/CompleteProfile.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));
const MyVideos = lazy(() => import('./pages/MyVideos.jsx'));

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <>
      {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}
      <ThemeProvider>
      <AuthProvider>
        <ScrollProvider>
          <LazyMotion features={domAnimation} strict>
            <BrowserRouter>
              <Routes>
                <Route element={<PageTransitionLayout />}>
                  {/* Public */}
                  <Route index element={<Suspense fallback={<PageLoading />}><Landing /></Suspense>} />
                  <Route path="login" element={<Navigate to="/" replace />} />
                  <Route path="signup" element={<Suspense fallback={<PageLoading />}><SignUp /></Suspense>} />
                  <Route path="contact" element={<Suspense fallback={<PageLoading />}><Contact /></Suspense>} />
                  <Route path="complete-profile" element={<Suspense fallback={<PageLoading />}><CompleteProfile /></Suspense>} />
                  <Route path="pricing" element={<Suspense fallback={<PageLoading />}><Pricing /></Suspense>} />
                  <Route path="forgot-password" element={<Suspense fallback={<PageLoading />}><ForgotPassword /></Suspense>} />

                  {/* OAuth + password reset callbacks */}
                  <Route path="auth/callback" element={<Suspense fallback={<PageLoading />}><AuthCallback /></Suspense>} />
                  <Route path="auth/reset-password" element={<Suspense fallback={<PageLoading />}><ResetPassword /></Suspense>} />

                  {/* Protected — requires auth */}
                  <Route path="editor" element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoading />}><Editor /></Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="upload" element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoading />}><Upload /></Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="upload/processing" element={<Navigate to="/upload" replace />} />
                  <Route path="upload/processing/:jobId" element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoading />}><Processing /></Suspense>
                    </ProtectedRoute>
                  } />

                  {/* My Videos — requires auth */}
                  <Route path="my-videos" element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoading />}><MyVideos /></Suspense>
                    </ProtectedRoute>
                  } />

                  {/* Admin — requires auth + admin role */}
                  <Route path="admin" element={
                    <AdminRoute>
                      <Suspense fallback={<PageLoading />}><Admin /></Suspense>
                    </AdminRoute>
                  } />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </LazyMotion>
        </ScrollProvider>
      </AuthProvider>
      </ThemeProvider>
    </>
  );
}
