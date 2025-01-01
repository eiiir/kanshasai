import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import GameMasterPage, { GameInstancePage } from './GameMaster/GameMasterPage';
import { QuestionsPage } from './GameMaster/QuestionsPage';
import { JoinGameModule, PlayerPage } from './PlayerPage';
import { GlobalComponent, VolumeProvider, useVolume } from './GlobalComponent';
import React, { ReactNode } from 'react';

const AppWrapper = ({ children }: { children: ReactNode }) => {
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
    <VolumeProvider>
        <GlobalComponent />
        <Router>
            <Routes>
                <Route index element={null} />
                <Route path="/gm" element={<GameMasterPage />} />
                <Route path="/gm/questions" element={<QuestionsPage />} />
                <Route path="/gm/game/:gameId" element={<GameInstancePage />} />
                <Route path="/game/:gameId" element={<JoinGameModule />} />
                <Route path="/game/:gameId/:playerId" element={<PlayerPage />} />
                <Route path="/test" element={<App />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    </VolumeProvider>
);