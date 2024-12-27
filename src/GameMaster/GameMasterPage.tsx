import React, { useEffect, useState } from 'react';
import Firebase from '../Firebase';
import { query, addDoc, FirestoreDataConverter, DocumentData, QueryDocumentSnapshot, SnapshotOptions, getDocs, deleteDoc, getDoc } from 'firebase/firestore';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { GameTemplate } from '../models';
import { AddGameTemplateModule } from './AddGameTemplateModule';
import { createConverter } from '../converters';

const getAllGameTemplates = async () => {
    const ref = Firebase.collectionRefOf("gameTemplates").withConverter(createConverter<GameTemplate>());
    return getDocs(query(ref));
}

const GameMasterPage = () => {
    return (
        <div>
            <h1>Game Master's Page</h1>
            <h2>Add Game Template</h2>
            <AddGameTemplateModule />
            <h2>All Game Templates</h2>
            <GameTemplatesModule />
        </div>
    );
}

const GameTemplatesModule = () => {
    const [gameTemplates, setGameTemplates] = useState<GameTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAllGameTemplates().then((querySnapshot) => {
            const gameTemplates: GameTemplate[] = [];
            querySnapshot.forEach((doc) => {
                const gameTemplate: GameTemplate = {
                    ID: doc.id,
                    ...doc.data(),
                }
                gameTemplates.push(gameTemplate);
            });
            setGameTemplates(gameTemplates);
            setLoading(false);
        });
    }, []);

    return (
        <div>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <div>
                    {gameTemplates.map((gameTemplate) => (
                        <div key={gameTemplate.ID ?? ''}>
                            <h3>Name: {gameTemplate.name}</h3>
                            <p>ID: {gameTemplate.ID}</p>
                            <p>QuestionIDs: {gameTemplate.questionIds.join(', ')}</p>
                            <div>
                                <GameInstancesListModule template={gameTemplate} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export type GameInstance = {
    ID?: string;
    gameTemplateID: string;
    players: string[];
    questionIDs: string[];
    createdAt: string;
}

const getGameInstancesByTemplateId = async (templateId: string) => {
    const ref = Firebase.collectionRefOf("games").withConverter(createConverter<GameInstance>());
    return getDocs(query(ref));
}

type GameInstancesModuleProps = {
    template: GameTemplate;
}

const GameInstancesListModule = ({ template }: GameInstancesModuleProps) => {
    const [ loadRequestedAt, setLoadRequestedAt ] = useState(0);
    const [ gameInstances, setGameInstances ] = useState<GameInstance[]>([]);
    useEffect(() => {
        if (loadRequestedAt > 0) {
            getGameInstancesByTemplateId(template.ID!).then((querySnapshot) => {
                const gameInstances: GameInstance[] = [];
                querySnapshot.forEach((doc) => {
                    const gameInstance: GameInstance = {
                        ID: doc.id,
                        ...doc.data(),
                    };
                    gameInstances.push(gameInstance);
                });
                setGameInstances(gameInstances);
            });
        }
    }, [loadRequestedAt]);


    return (
        <div>
            <div>
                <h4>Create A New Game</h4>
                <button onClick={() => {
                    const gameInstance: GameInstance = {
                        gameTemplateID: template.ID!,
                        players: [],
                        questionIDs: template.questionIds,
                        createdAt: new Date().toISOString(),
                    }

                    addDoc(Firebase.collectionRefOf("games"), gameInstance).then(() => {
                        setLoadRequestedAt(new Date().getTime());
                    });
                }}>Create</button>
            </div>
            <div style={{ cursor: 'pointer' }} onClick={() => setLoadRequestedAt(new Date().getTime())}>
                <h4>Game Instances (click to load)</h4>
            </div>
            {gameInstances.length == 0 ? (
                null
            ) : (
                <div>
                    {gameInstances.map((gameInstance) => (
                        <div key={gameInstance.ID}>
                            <h5>ID: {gameInstance.ID}</h5>
                            <p>Template ID: {gameInstance.gameTemplateID}</p>
                            <p>Players: {gameInstance.players.join(', ')}</p>
                            <p>Questions: {gameInstance.questionIDs.join(', ')}</p>
                            <p>Created At: {gameInstance.createdAt}</p>
                            <button onClick={() => {
                                deleteDoc(Firebase.docRefOf("games", gameInstance.ID!)).then(() => {
                                    setLoadRequestedAt(new Date().getTime());
                                });
                            }}>Delete</button>
                            <div>
                                <Link to={`/gm/game/${gameInstance.ID}`}>Go to game page</Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

type GameInstancePageProps = {
    //TODO
}

const getGameInstanceById = async (gameId: string) => {
    const ref = Firebase.docRefOf("games", gameId).withConverter(createConverter<GameInstance>());
    return getDoc(ref);
}

export const GameInstancePage = ({}: GameInstancePageProps) => {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const [gameInstance, setGameInstance] = useState<GameInstance | null>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        getGameInstanceById(gameId!).then((doc) => {
            if(doc.exists()) {
                setGameInstance(doc.data());
            } else {
                console.log(`No such document of ID: ${gameId}`);
            }
        });
        setLoading(false);
    }, [gameId]);

    return (
        <div>
            <h1>Game Instance Page</h1>
            <p>Game ID: {gameId}</p>
            {loading ?
                    <p>Loading...</p>
                : gameInstance == null ?
                    <p>Game not found by ID = ${gameId}</p>
                :
                    <div>
                        <p>Game Template ID: ${gameInstance!.gameTemplateID}</p>
                        <p>Questions: {gameInstance!.questionIDs.join(', ')}</p>
                        <p>Created At: {gameInstance!.createdAt}</p>
                        <p>Players:</p>
                        <ul>
                            {gameInstance!.players.map((player) => (
                                <li key={player}>
                                    {player} (<Link to={`/game/${gameId}/${encodeURIComponent(player)}`}>Player Page</Link>)
                                </li>
                            ))}
                        </ul>
                        <div>
                            <button onClick={() => { navigate(`/game/${gameId}`); }}>Join game</button> 
                        </div>
                        <div>
                            <button onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/game/${gameId}`);
                            }}>
                                <span role="img" aria-label="clipboard">📋</span> Copy Join Link
                            </button>
                        </div>
                    </div>
            }
            <p/>
            <div>
                <Link to="/gm">Back to GM Page</Link>
            </div>
        </div>
    );
}

export default GameMasterPage;