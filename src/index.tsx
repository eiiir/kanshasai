import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import GameMasterPage, { GameInstancePage } from './GameMaster/GameMasterPage';
import { JoinGameModule, PlayerPage } from './PlayerPage';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
    <Router>
        <Routes>
            <Route index element={<App />} />
            <Route path="/gm" element={<GameMasterPage />} />
            <Route path="/gm/game/:gameId" element={<GameInstancePage />} />
            <Route path="/game/:gameId" element={<JoinGameModule />} />
            <Route path="/game/:gameId/:encodedPlayerName" element={<PlayerPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </Router>
);