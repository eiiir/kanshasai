import React, { useCallback, useEffect, useState } from 'react';
import Firebase from '../Firebase';
import { query, addDoc, FirestoreDataConverter, DocumentData, QueryDocumentSnapshot, SnapshotOptions, getDocs, deleteDoc, getDoc, setDoc, updateDoc, where, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { GameInstance, GameState, GameTemplate, Question, GameStateWithoutDynamicFields, Answer, AnswerOption } from '../models';
import { AddGameTemplateModule } from './AddGameTemplateModule';
import { createConverter } from '../converters';
import { PlayerPageContent } from '../PlayerPage';

const getAllGameTemplates = async () => {
    const ref = Firebase.collectionRefOf("gameTemplates").withConverter(createConverter<GameTemplate>());
    return getDocs(query(ref));
}

const GameMasterPage = () => {
    return (
        <div>
            <h1>Game Master's Page</h1>
            <h2>Questions</h2>
            <Link to="/gm/questions">Go to Questions page</Link>
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
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', color: '#333' }}>
            {loading ? (
                <p style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>Loading...</p>
            ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                    {gameTemplates.map((gameTemplate) => (
                        <div
                            key={gameTemplate.ID ?? ''}
                            style={{
                                border: '1px solid #ccc',
                                borderRadius: '8px',
                                padding: '16px',
                                background: '#f9f9f9',
                                boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)',
                            }}
                        >
                            <h3 style={{ margin: '0 0 8px' }}>Name: {gameTemplate.name}</h3>
                            <p style={{ margin: '0 0 4px' }}>
                                <strong>ID:</strong> {gameTemplate.ID}
                            </p>
                            <p style={{ margin: '0 0 8px' }}>
                                <strong>Question IDs:</strong> {gameTemplate.questionIds.join(', ')}
                            </p>
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

const getGameInstancesByTemplateId = async (templateId: string) => {
    const ref = Firebase.collectionRefOf("games").withConverter(createConverter<GameInstance>());
    return getDocs(query(ref, where("gameTemplateID", "==", templateId)));
}

export const getAllAnswersByGameId = async (gameId: string) => {
    const ref = Firebase.collectionRefOf("answers").withConverter(createConverter<Answer>());
    const q = query(ref, where("gameId", "==", gameId));
    return getDocs(q);
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
        <div style={{ padding: '16px', fontFamily: 'Arial, sans-serif', color: '#333' }}>
            <div style={{ marginBottom: '16px', }} >
                <button
                    onClick={() => {
                        const gameInstance: GameInstance = {
                            gameTemplateID: template.ID!,
                            players: { GameMaster: 'GameMaster' },
                            questionIDs: template.questionIds,
                            createdAt: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', hour12: false }),
                            state: { phase: 'created', startedAt: serverTimestamp() },
                            pastStates: [],
                        };

                        addDoc(Firebase.collectionRefOf('games'), gameInstance).then(() => {
                            setLoadRequestedAt(new Date().getTime());
                        });
                    }}
                    style={{
                        padding: '8px 16px',
                        background: '#4caf50',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                >
                    Create a new game
                </button>
            </div>
            <div
                style={{
                    cursor: 'pointer',
                    padding: '12px',
                    background: '#e3f2fd',
                    borderRadius: '8px',
                    border: '1px solid #64b5f6',
                    marginBottom: '16px',
                    textAlign: 'center',
                }}
                onClick={() => setLoadRequestedAt(new Date().getTime())}
            >
                <h4>Game Instances (click to load)</h4>
            </div>
            {gameInstances.length === 0 ? null : (
                <div style={{ display: 'grid', gap: '12px' }}>
                    {gameInstances.map((gameInstance) => (
                        <div
                            key={gameInstance.ID}
                            style={{
                                border: '1px solid #ccc',
                                borderRadius: '8px',
                                padding: '12px',
                                background: '#fff',
                                boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)',
                            }}
                        >
                            <h5 style={{ margin: '0 0 8px' }}>ID: {gameInstance.ID}</h5>
                            <p style={{ margin: '0 0 4px' }}>
                                <strong>Template ID:</strong> {gameInstance.gameTemplateID}
                            </p>
                            <p style={{ margin: '0 0 4px' }}>
                                <strong>Players:</strong> {Object.values(gameInstance.players).join(', ')}
                            </p>
                            <p style={{ margin: '0 0 4px' }}>
                                <strong>Questions:</strong> {gameInstance.questionIDs.join(', ')}
                            </p>
                            <p style={{ margin: '0 0 12px' }}>
                                <strong>Created At:</strong> {gameInstance.createdAt}
                            </p>
                            <button
                                onClick={() => {
                                    deleteDoc(Firebase.docRefOf('games', gameInstance.ID!)).then(() => {
                                        getAllAnswersByGameId(gameInstance.ID!).then((querySnapshot) => {
                                            querySnapshot.docs.forEach((doc) => {
                                                deleteDoc(doc.ref);
                                            });
                                            setLoadRequestedAt(new Date().getTime());
                                        });
                                    });
                                }}
                                style={{
                                    padding: '8px 16px',
                                    background: '#f44336',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }}
                            >
                                Delete
                            </button>
                            <div style={{ marginTop: '8px' }}>
                                <Link
                                    to={`/gm/game/${gameInstance.ID}`}
                                    style={{
                                        textDecoration: 'none',
                                        color: '#2196f3',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    Go to game page
                                </Link>
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

export const getGameInstanceById = async (gameId: string) => {
    const ref = Firebase.docRefOf("games", gameId).withConverter(createConverter<GameInstance>());
    return getDoc(ref);
}

export const getQuestionsByIds = async (questionIds: string[]) => {
    const questions: Question[] = [];
    for (const questionId of questionIds) {
        const ref = Firebase.docRefOf("questions", questionId).withConverter(createConverter<Question>());
        const doc = await getDoc(ref);
        if (doc.exists()) {
            questions.push( { ID: doc.id, ...doc.data(), });
        }
    }
    return questions;
}

export const getAllStatesForGame = async (game: GameInstance): Promise<GameStateWithoutDynamicFields[]> => {
    const states: GameStateWithoutDynamicFields[] = [];
    states.push({ phase: 'created' });
    states.push({ phase: 'started' });
    const questions = await getQuestionsByIds(game.questionIDs);
    questions.forEach((question, i) => {
        const questionNumber = i + 1;
        states.push({ phase: 'readQuestion', questionNumber, questionText: question.questionText });
        states.push({ 
            phase: 'countDown',
            timeLimitSeconds: question.timeLimitSeconds,
            questionId: question.ID!,
            questionNumber,
            questionText: question.questionText,
            options: question.options,
            isLastQuestion: questionNumber === questions.length,
            ...(question.questionImageUrl && { questionImageUrl: question.questionImageUrl }),
        });
        states.push({ 
            phase: 'answerCheck',
            questionId: question.ID!,
            questionNumber,
            questionText: question.questionText,
            options: question.options,
         });
        states.push({ 
            phase: 'revealAnswer',
            questionId: question.ID!,
            questionNumber,
            questionText: question.questionText,
            options: question.options,
            correctOption: question.correctOption,
            ...(question.questionSupplimentImageUrl && { questionSupplimentImageUrl: question.questionSupplimentImageUrl }),
            ...(question.optionSuppliments && { optionSuppliments: question.optionSuppliments }),
        });
    });
    states.push({ phase: 'lastQuestionDone' });
    states.push({ phase: 'showResults' });
    // states.push({ phase: 'ended'});
    return states;
};

export const updateState = async (gameId: string, game: GameInstance, newState: GameState) => {
    const docRef = Firebase.docRefOf("games", gameId);
    await updateDoc(docRef, { state: newState, pastStates: [...game.pastStates, game.state] });
};

export const getAnswers = async (gameId: string, questionId: string) => {
    const collectionRef = Firebase.collectionRefOf("answers").withConverter(createConverter<Answer>())
    const q = query(collectionRef, where('gameId', '==', gameId), where('questionId', '==', questionId))
    return getDocs(q)
}

export const GameInstancePage = ({}: GameInstancePageProps) => {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const [gameInstance, setGameInstance] = useState<GameInstance | null>(null);
    const [statesWithoutDynamicFields, setStatesWithoutDynamicFields] = useState<GameStateWithoutDynamicFields[]>([]);
    const [stateIndex, setStateIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        getGameInstanceById(gameId!).then((doc) => {
            if(doc.exists()) {
                setGameInstance({ ...doc.data(), ID: doc.id });
                getAllStatesForGame(doc.data()).then((states) => {
                    setStatesWithoutDynamicFields(states);
                    const currentState = doc.data().state;
                    const currentStateIndex = states.findIndex((state) => {
                        if ("questionNumber" in currentState) {
                            return state.phase === currentState.phase && state.questionNumber === currentState.questionNumber;
                        } else {
                            return state.phase === currentState.phase;
                        }
                    });
                    setStateIndex(currentStateIndex);
                });
            } else {
                console.log(`No such document of ID: ${gameId}`);
                setGameInstance(null);
            }
        });
        setLoading(false);
        Firebase.listenToUpdate(Firebase.docRefOf("games", gameId!), (data) => {
            setGameInstance({...data, ID: data.id});
        });
    }, [gameId]);

    const moveToNextState = useCallback(async (stateIndex: number, statesWithoutDynamicFields: GameStateWithoutDynamicFields[]) => {
        if (stateIndex >= statesWithoutDynamicFields.length - 1) {
            return;
        }
        const nextState = statesWithoutDynamicFields[stateIndex + 1];
        const stateToSet: any = { ...nextState, startedAt: serverTimestamp() };
        if (nextState.phase === 'answerCheck' || nextState.phase === 'revealAnswer') {
            const querySnapshot = await getAnswers(gameId!, nextState.questionId);
            const answerCounts = querySnapshot.docs
                .map((doc) => doc.data())
                .reduce(
                    (acc, answer) => {
                        acc[answer.option] = acc[answer.option] + 1;
                        return acc;
                    }, { a: 0, b: 0, c: 0, d: 0 });
            stateToSet['answerCounts'] = answerCounts;
        }
        if (nextState.phase === 'showResults') {
            const allAnswers = await getAllAnswersByGameId(gameId!)
            const countDownStartedTimestampMap = gameInstance!.pastStates
                .filter((state) => state.phase === 'countDown')
                .map((state) => ({ questionId: state.questionId, startedAt: state.startedAt as Timestamp, timeLimitSeconds: state.timeLimitSeconds }))
                .reduce((acc, { questionId, startedAt, timeLimitSeconds }) => {
                    acc[questionId] = { startedAt, timeLimitSeconds };
                    return acc;
                }, {} as { [questionId: string]: { startedAt: Timestamp, timeLimitSeconds: number } });
            const correctAnswersMap = gameInstance!.pastStates
                .filter((state) => state.phase === 'revealAnswer')
                .map((state) => ({ questionId: state.questionId, correctOption: state.correctOption }))
                .reduce((acc, { questionId, correctOption }) => {
                    acc[questionId] = { correctOption, startedAt: countDownStartedTimestampMap[questionId].startedAt, timeLimitSeconds: countDownStartedTimestampMap[questionId].timeLimitSeconds };
                    return acc;
                }, {} as { [questionId: string]: { correctOption: AnswerOption, startedAt: Timestamp, timeLimitSeconds: number } });
            const playerIdToPointsAndAccumulatedTime = allAnswers.docs.map((doc) => doc.data())
                .reduce((acc, { playerId, option, questionId, updatedAt }) => {
                        const { correctOption, startedAt, timeLimitSeconds } = correctAnswersMap[questionId];
                        const isCorrect = option === correctOption;
                        acc[playerId] = acc[playerId] ?? { points: 0, accumulatedTimeLeft: 0 }
                        acc[playerId].points = (acc[playerId]?.points ?? 0) + ( isCorrect ? 1 : 0)
                        const timeLeftMillis = timeLimitSeconds * 1000 - ((updatedAt as Timestamp).toMillis() - startedAt.toMillis())
                        if (timeLeftMillis < 0) {
                            console.log("Found an answer after the time limit", playerId, questionId, timeLeftMillis);
                        }
                        acc[playerId].accumulatedTimeLeft = (acc[playerId]?.accumulatedTimeLeft ?? 0)
                            // Allowing negative time to account for slow internet, up to 1 second
                             + (isCorrect && timeLeftMillis >= -1000 ? Math.max(timeLeftMillis, 0) : 0)
                        return acc;
                    }, {} as { [playerId: string]: { points: number, accumulatedTimeLeft: number } }
                );
            const rankings = Object.entries(gameInstance!.players).map(([playerId, playerName]) => {
                const correctAnswers = playerIdToPointsAndAccumulatedTime[playerId]?.points ?? 0
                const accumulatedTimeLeftSeconds = playerIdToPointsAndAccumulatedTime[playerId]?.accumulatedTimeLeft ?? 0.0
                return {
                    player: playerName,
                    correctAnswers,
                    averageTimeLeftSeconds: correctAnswers == 0 ? 0 : accumulatedTimeLeftSeconds / correctAnswers / 1000,
                };
            })
            .filter((p) => p.player != "GameMaster")
            .sort((a, b) => {
                if (a.correctAnswers === b.correctAnswers) {
                    return b.averageTimeLeftSeconds - a.averageTimeLeftSeconds
                } else {
                    return b.correctAnswers - a.correctAnswers
                }
            })
            stateToSet['rankings'] = rankings;
        }
        updateState(gameId!, gameInstance!, stateToSet as GameState).then(() => {
            setStateIndex(stateIndex + 1);
        });
    }, [setStateIndex, gameId, gameInstance]);

    const getNextStateButtonLabel = useCallback(() => {
        if (stateIndex >= statesWithoutDynamicFields.length - 1) {
            return "(Ended)";
        }
        const nextState = statesWithoutDynamicFields[stateIndex + 1];
        switch (nextState.phase) {
            case "started": return "「全員、スタンダップ！」"
            case "readQuestion": return "「問題！」"
            case "countDown": return "「レディ、ゴー！」"
            case "answerCheck": return "「アンサーチェック！」"
            case "revealAnswer": return "「正解はこちら！」"
            case "lastQuestionDone": return "(結果発表前フェイズへ)"
            case "showResults": return "「それでは結果発表です！」"
            case "ended": return "(終了)"
            default: return "To Next state"
        }

    }, [stateIndex, statesWithoutDynamicFields]);

    return (
        <div>
            <div style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
                <h1 style={{display: "inline"}}>Game Instance Page</h1>
                <span style={{ margin: "10px" }}>Game ID: {gameId}</span>
                <button style={{margin: "10px"}} onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/#/game/${gameId}`);
                }}>
                    <span role="img" aria-label="clipboard">📋</span>Copy Join Link
                </button>
            </div>
            {loading ?
                    <p>Loading...</p>
                : gameInstance == null ?
                    <p>Game not found by ID = ${gameId}</p>
                :
                    <div>
                        <p>GM Control</p>
                        <div style={{ border: '1px solid red', padding: '10px', margin: '10px' }}>
                            <GMControlContent state={gameInstance.state} />
                            <button onClick={() => moveToNextState(stateIndex, statesWithoutDynamicFields)}>{getNextStateButtonLabel()}</button>
                        </div>
                        <p>Player's view</p>
                        <div style={{ border: '1px solid black', padding: '10px', margin: '10px' }}>
                            <PlayerPageContent gameId={gameId!} playerId="GameMaster" />
                        </div>
                        <p>Game Template ID: ${gameInstance!.gameTemplateID}</p>
                        <p>Questions: {gameInstance!.questionIDs.join(', ')}</p>
                        <p>Created At: {gameInstance!.createdAt}</p>
                        <p>Players:</p>
                        <ul>
                            {Object.entries(gameInstance!.players).map(([playerID, playerName]) => (
                                <li key={playerID}>
                                    {playerName} (<Link to={`/game/${gameId}/${playerID}`}>Player Page</Link>)
                                </li>
                            ))}
                        </ul>
                    </div>
            }
            <p/>
            <div>
                <Link to="/gm">Back to GM Page</Link>
            </div>
        </div>
    );
}

export const GMControlContent = ({state}: {state: GameState}) => {
    switch (state.phase) {
        case "readQuestion": {
            return <p>{state.questionText}</p>
        }
        default: return null
    }

}

export default GameMasterPage;