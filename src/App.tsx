import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { AdminRoute } from './components/AdminRoute';
import { LoadingState } from './components/LoadingState';
import { ProtectedRoute } from './components/ProtectedRoute';

const AdminPage = lazy(() =>
  import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })),
);
const AdminFilesPage = lazy(() =>
  import('./pages/AdminFilesPage').then((module) => ({
    default: module.AdminFilesPage,
  })),
);
const AdminReportsPage = lazy(() =>
  import('./pages/AdminReportsPage').then((module) => ({
    default: module.AdminReportsPage,
  })),
);
const AdminUsersPage = lazy(() =>
  import('./pages/AdminUsersPage').then((module) => ({
    default: module.AdminUsersPage,
  })),
);
const AuthPage = lazy(() =>
  import('./pages/AuthPage').then((module) => ({ default: module.AuthPage })),
);
const ContactPage = lazy(() =>
  import('./pages/ContactPage').then((module) => ({
    default: module.ContactPage,
  })),
);
const CreatePostPage = lazy(() =>
  import('./pages/CreatePostPage').then((module) => ({
    default: module.CreatePostPage,
  })),
);
const FilesPage = lazy(() =>
  import('./pages/FilesPage').then((module) => ({ default: module.FilesPage })),
);
const FoodToolPage = lazy(() =>
  import('./pages/FoodToolPage').then((module) => ({
    default: module.FoodToolPage,
  })),
);
const ForumDemoPage = lazy(() =>
  import('./pages/ForumDemoPage').then((module) => ({
    default: module.ForumDemoPage,
  })),
);
const HomePage = lazy(() =>
  import('./pages/HomePage').then((module) => ({ default: module.HomePage })),
);
const LegalPage = lazy(() =>
  import('./pages/LegalPage').then((module) => ({ default: module.LegalPage })),
);
const PostDetailPage = lazy(() =>
  import('./pages/PostDetailPage').then((module) => ({
    default: module.PostDetailPage,
  })),
);
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((module) => ({
    default: module.ProfilePage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import('./pages/ResetPasswordPage').then((module) => ({
    default: module.ResetPasswordPage,
  })),
);
const ToolsPage = lazy(() =>
  import('./pages/ToolsPage').then((module) => ({ default: module.ToolsPage })),
);

function PageSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingState label="Loading page..." />}>
      {children}
    </Suspense>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          index
          element={
            <PageSuspense>
              <HomePage />
            </PageSuspense>
          }
        />
        <Route
          path="/forum-demo"
          element={
            <PageSuspense>
              <ForumDemoPage />
            </PageSuspense>
          }
        />
        <Route
          path="/files"
          element={
            <PageSuspense>
              <FilesPage />
            </PageSuspense>
          }
        />
        <Route
          path="/post/:id"
          element={
            <PageSuspense>
              <PostDetailPage />
            </PageSuspense>
          }
        />
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <PageSuspense>
                <CreatePostPage />
              </PageSuspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tools/food"
          element={
            <PageSuspense>
              <FoodToolPage />
            </PageSuspense>
          }
        />
        <Route
          path="/tools"
          element={
            <PageSuspense>
              <ToolsPage />
            </PageSuspense>
          }
        />
        <Route
          path="/contact"
          element={
            <PageSuspense>
              <ContactPage />
            </PageSuspense>
          }
        />
        <Route
          path="/login"
          element={
            <PageSuspense>
              <AuthPage />
            </PageSuspense>
          }
        />
        <Route
          path="/terms"
          element={
            <PageSuspense>
              <LegalPage />
            </PageSuspense>
          }
        />
        <Route
          path="/privacy"
          element={
            <PageSuspense>
              <LegalPage />
            </PageSuspense>
          }
        />
        <Route
          path="/community-rules"
          element={
            <PageSuspense>
              <LegalPage />
            </PageSuspense>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PageSuspense>
              <ResetPasswordPage />
            </PageSuspense>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <PageSuspense>
                <ProfilePage />
              </PageSuspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <PageSuspense>
                <AdminPage />
              </PageSuspense>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <AdminRoute>
              <PageSuspense>
                <AdminReportsPage />
              </PageSuspense>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <PageSuspense>
                <AdminUsersPage />
              </PageSuspense>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/files"
          element={
            <AdminRoute>
              <PageSuspense>
                <AdminFilesPage />
              </PageSuspense>
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
