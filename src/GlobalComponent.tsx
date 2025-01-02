import React, { FormEventHandler, useEffect, useState, createContext, useContext, useCallback, use } from 'react';
import Firebase from './Firebase';
import { query, addDoc, FirestoreDataConverter, DocumentData, QueryDocumentSnapshot, SnapshotOptions, getDocs, deleteDoc, runTransaction } from 'firebase/firestore';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { GameInstance, GameTemplate, GameState } from './models';
import { createConverter } from './converters';
import { getGameInstanceById } from './GameMaster/GameMasterPage';

const VolumeContext = createContext({
    volume: 1,
    muted: false,
    setVolume: (volume: number) => {},
    setMuted: (muted: boolean) => {},
    getAudio: (src: string) => { return new Audio(src); },
});

export const VolumeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const allAudios = [
        '/audio/answer_check.mp3',
        '/audio/count_down_10s.mp3',
        '/audio/count_down_15s.mp3',
        '/audio/last_question_done.mp3',
        '/audio/question_intro.mp3',
        '/audio/reveal_answer.mp3',
        '/audio/show_ranking.mp3',
        '/audio/standup.mp3',
        '/audio/victory.mp3',
        '/audio/volume_check.mp3',
    ];
    const [volume, rawSetVolume] = useState(1);
    const [muted, rawSetMuted] = useState(false);
    const [audios, _] = useState<{ [src: string]: HTMLAudioElement }>(
        allAudios.reduce((acc, src) => ({ ...acc, [src]: new Audio(src) }), {})
    );
    useEffect(() => {
        const savedVolume = localStorage.getItem('volume');
        const savedMuted = localStorage.getItem('muted');
        if (savedVolume) {
            rawSetVolume(Number(savedVolume));
        }
        if (savedMuted) {
            rawSetMuted(savedMuted === 'true');
        }

        //Preload all audios
        Object.values(audios).forEach(audio => {
            audio.preload = 'auto';
            audio.load();
        });
    }, []);

    const getAudio = (src: string): HTMLAudioElement => {
        const audio = audios[src];
        audio.volume = volume;
        audio.muted = muted;
        return audio;
    }

    const setMuted = (muted: boolean) => {
        rawSetMuted(muted);
        Object.values(audios).forEach(audio => {
            audio.muted = muted;
        });
    }

    const setVolume = (volume: number) => {
        rawSetVolume(volume);
        Object.values(audios).forEach(audio => {
            audio.volume = volume;
        });
    }

    useEffect(() => {
        localStorage.setItem('volume', volume.toString());
    }, [volume]);

    useEffect(() => {
        localStorage.setItem('muted', muted.toString());
    }, [muted]);

    return (
        <VolumeContext.Provider value={{ volume, setVolume, muted, setMuted, getAudio }}>
            {children}
        </VolumeContext.Provider>
    );
};
export const useVolume = () => useContext(VolumeContext);

export const GlobalComponent = () => {
    const { volume, setVolume, getAudio, muted, setMuted } = useVolume();

    const handleVolumeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setVolume(Number(event.target.value));
    }, [setVolume]);


    const playVolumeCheck = useCallback(() => {
        const audio = getAudio('/audio/volume_check.mp3');
        audio.play();
    }, [getAudio]);

    return (
        <div>
            <label htmlFor="volume">
                <span role="img" aria-label={muted ? "muted" : "speaker"} onClick={() => setMuted(!muted)}>
                    {muted ? '🔇' : '🔊'}
                </span>
            </label>
            <input
                type="range"
                id="volume"
                name="volume"
                min="0"
                max="1"
                step="0.01"
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                onMouseUp={playVolumeCheck}
                onTouchEnd={playVolumeCheck}
            />
        </div>
    );
}