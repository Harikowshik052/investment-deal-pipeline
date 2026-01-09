import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import DealDetail from './pages/DealDetail'
import UserManagement from './pages/UserManagement'
import Layout from './components/Layout'

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/boards" replace />} />
          <Route path="boards" element={<Dashboard />} />
          <Route path="board/:boardId" element={<Dashboard />} />
          <Route path="board/:boardId/deal/:id" element={<DealDetail />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="board/:boardId/users" element={<UserManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
