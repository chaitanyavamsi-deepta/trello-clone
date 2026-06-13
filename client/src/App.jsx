import { Routes, Route, Navigate } from 'react-router-dom';
import BoardsHome from './pages/BoardsHome';
import BoardPage from './pages/BoardPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<BoardsHome />} />
      <Route path="/b/:boardId" element={<BoardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
