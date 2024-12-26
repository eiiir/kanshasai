import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import GameMaster from './GameMaster';

const container = document.getElementById('root');
const root = createRoot(container!);
const basename = "/kanshasai";

root.render(
    <Router basename={basename} >
        <Routes>
            <Route path="/" element={<App />} />
            <Route path="/gm" element={<GameMaster />} />
        </Routes>
    </Router>
);