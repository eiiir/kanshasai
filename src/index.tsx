import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import GameMasterPage, { GameInstancePage } from './GameMaster/GameMasterPage';
import { JoinGameModule, PlayerPage } from './PlayerPage';
import { GlobalComponent, VolumeProvider, useVolume } from './GlobalComponent';
import React, { ReactNode } from 'react';

const AppWrapper = ({ children }: { children: ReactNode }) => {
    const { setImplicitlyMuted } = useVolume();
    return <div onClick={() => setImplicitlyMuted(false)}>{children}</div>;
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
    <VolumeProvider>
        <AppWrapper>
            <GlobalComponent />
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
        </AppWrapper>
    </VolumeProvider>
);