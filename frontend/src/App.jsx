import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import LandingPage from './pages/LandingPage';
import PostDetail from './pages/PostDetail';
import SearchResults from './pages/SearchResults';
import Dashboard from './pages/Dashboard';
import EditorPage from './pages/EditorPage';
import AdminPanel from './pages/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';
import Layout from './components/Layout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red' }}>
          <h1>React Render Error</h1>
          <pre>{this.state.error?.message}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AuthProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/feed" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/posts/:slug" element={<PostDetail />} />
                <Route path="/search" element={<SearchResults />} />

                {/* Author/Admin Routes */}
                <Route element={<ProtectedRoute roles={['AUTHOR', 'ADMIN']} />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/editor" element={<EditorPage />} />
                  <Route path="/editor/:id" element={<EditorPage />} />
                </Route>

                {/* Admin Routes */}
                <Route element={<ProtectedRoute roles={['ADMIN']} />}>
                  <Route path="/admin" element={<AdminPanel />} />
                </Route>
              </Routes>
            </Layout>
          </Router>
        </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
