import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import GameMaster from './GameMaster';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
    <Router>
        <Routes>
            <Route index element={<App />} />
            <Route path="/gm" element={<GameMaster />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </Router>
);