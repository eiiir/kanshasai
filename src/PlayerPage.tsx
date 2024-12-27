
import React, { FormEventHandler, useEffect, useState } from 'react';
import Firebase from './Firebase';
import { query, addDoc, FirestoreDataConverter, DocumentData, QueryDocumentSnapshot, SnapshotOptions, getDocs, deleteDoc, runTransaction } from 'firebase/firestore';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { GameTemplate } from './models';
import { createConverter } from './converters';
import { GameInstance, getGameInstanceById } from './GameMaster/GameMasterPage';

export const PlayerPage = () => {
    const { gameId, encodedPlayerName } = useParams();
    return <PlayerPageContent gameId={gameId!} encodedPlayerName={encodedPlayerName!} />;
}

export type PlayerPageContentProps = {
    gameId: string,
    encodedPlayerName: string,
}

export const PlayerPageContent = ({ gameId, encodedPlayerName }: PlayerPageContentProps) => {
    const playerName = decodeURIComponent(encodedPlayerName);
    const [gameInstance, setGameInstance] = useState<GameInstance | null>(null);
    const [error, setError] = useState('');
    useEffect(() => {
        getGameInstanceById(gameId!).then((doc) => {
            if(doc.exists()) {
                setGameInstance(doc.data());
            } else {
                setError("Game not found by the given ID.");
            }
        });
        Firebase.listenToUpdate(Firebase.docRefOf("games", gameId!), (data) => {
            setGameInstance(data);
        });
    }, [gameId]);
    return (
        <div>
            <h1>Player's Page</h1>
            <p>Game ID: {gameId}</p>
            <p>Player Name: {playerName}</p>
            { gameInstance ? 
                <div>
                    <h2>Game Details</h2>
                    <p>Current State:</p>
                    <pre>{JSON.stringify(gameInstance.state, null, 2)}</pre>
                </div>
                : null }
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}


const addPlayer = async (gameId: string, name: string) => {
    const ref = Firebase.docRefOf("games", gameId).withConverter(createConverter<GameInstance>());
    const updatedDoc = await runTransaction(Firebase.db, async (transaction) => {
        const gameDoc = await transaction.get(ref);
        if (!gameDoc.exists()) {
            throw new Error("Game does not exist!");
        }
        console.log("Game data: ", gameDoc.data());
        const players = gameDoc.data().players
        if (!players.includes(name)) {
            transaction.update(ref, { players: [ ...players, name ] });
        } else {
            console.log(`Player name ${name} already exists in the game.`);
        }
    });
    console.log("Transaction result: ", updatedDoc);
}

export const JoinGameModule = () => {
    const { gameId } = useParams();
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        const trimmedName = name.trim();

        if (trimmedName.length == 0) {
            setError('Name must not be empty.');
            return;
        }

        setError('');

        addPlayer(gameId!, trimmedName).then(() => {
            navigate(`/game/${gameId}/${encodeURIComponent(trimmedName)}`);
        }).catch((error) => {
            setError(error.message);
        });
    };

    return (
        <div>
            <h1>Welcome!</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    Your name: 
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </label>
                <button type="submit">Submit</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};


