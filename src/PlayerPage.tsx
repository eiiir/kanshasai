
import React, { FormEventHandler, useEffect, useState, useCallback, useMemo } from 'react';
import Firebase from './Firebase';
import { query, addDoc, FirestoreDataConverter, DocumentData, QueryDocumentSnapshot, SnapshotOptions, getDocs, deleteDoc, runTransaction, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { GameTemplate, GameState, ReadQuestionPhase, CountDownPhase, AnswerCheckPhase, RevealAnswerPhase, LastQuestionDonePhase, ShowResultsPhase, AnswerOption, Answer, Ranking } from './models';
import { createConverter } from './converters';
import { GameInstance, getGameInstanceById } from './GameMaster/GameMasterPage';
import { useVolume } from './GlobalComponent';
import AnimatedRanking from './AnimatedRanking';
import Fireworks from './Fireworks';

export const PlayerPage = () => {
    const { gameId, playerId } = useParams();
    return <PlayerPageContent gameId={gameId!} playerId={playerId!} />;
}

export type PlayerPageContentProps = {
    gameId: string,
    playerId: string,
}

export const PlayerPageContent = ({ gameId, playerId }: PlayerPageContentProps) => {
    const [gameInstance, setGameInstance] = useState<GameInstance | null>(null);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [playerName, setPlayerName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        getGameInstanceById(gameId!).then((doc) => {
            if(doc.exists()) {
                setGameInstance(doc.data());
                const maybePlayerName = doc.data().players[playerId];
                if (!maybePlayerName) {
                    setError("Player not found by the given ID.");
                } else {
                    setPlayerName(maybePlayerName);
                }
            } else {
                setError("Game not found by the given ID.");
            }
        });
        Firebase.listenToUpdate(Firebase.docRefOf("games", gameId!), (data) => {
            setGameInstance(data);
        });
    }, [gameId]);
    const onInteract = useCallback(() => {
        setHasInteracted(true);
    }, [setHasInteracted]);
    return (
        <div onClick={onInteract}>
            { !hasInteracted ? <InteractRequiredOverlayComponent />
                : (<>
                    { gameInstance ? 
                        <div>
                            <GameStateComponent state={gameInstance.state} gameId={gameId} playerId={playerId} />
                        </div>
                        : null }
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                </>
                )
            }
        </div>
    );
}

export const InteractRequiredOverlayComponent = () => {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <p>画面をクリックして開始</p>
        </div>
    );
}

export const GameStateComponent = ({ state, gameId, playerId }: { state: GameState, gameId: string, playerId: string }) => {
    switch (state.phase) {
        case 'created':
            return <p>ゲーム開始までしばらくお待ちください…</p>;
        case 'started':
            return <StartedGameStateComponent />;
        case 'readQuestion':
            return <ReadQuestionGameStateComponent state={state} />;
        case 'countDown':
        case 'answerCheck':
        case 'revealAnswer':
            return <QuestionGameStatesComponent state={state} gameId={gameId} playerId={playerId} />
        case 'lastQuestionDone':
            return <LastQuestionDoneGameStateComponent state={state} />;
        case 'showResults':
            return <ShowResultsGameStateComponent state={state} />;
        case 'ended':
            return <p>お疲れ様でした</p>;
    }
}

export const StartedGameStateComponent = () => {
    const { getAudio } = useVolume();

    useEffect(() => {
        const audio = getAudio('/audio/standup.mp3');
        audio.play();
    }, []);
    return <p>ゲームが始まります</p>;
}

export const ReadQuestionGameStateComponent = ({ state }: {state: ReadQuestionPhase}) => {
    const { questionNumber } = state;
    const { getAudio } = useVolume();

    useEffect(() => {
        const audio = getAudio('/audio/question_intro.mp3');
        audio.play();
    }, []);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <h1>問題 {questionNumber}</h1>
        </div>
    );
}

export const submitAnswer = async (gameId: string, questionId: string, playerId: string, option: AnswerOption, timeLeftMillis: number ) => {
    const docRef = Firebase.docRefOf("answers", `${gameId}_${questionId}_${playerId}`);
    await setDoc(docRef, { gameId, playerId, questionId, option, timeLeftMillis });
}

export const QuestionGameStatesComponent = ({ state, gameId, playerId }: {state: CountDownPhase | AnswerCheckPhase | RevealAnswerPhase, gameId: string, playerId: string }) => {
    const fallback = {
        isLastQuestion: false,
        timeLimitSeconds: 10,
        answerCounts: undefined,
        correctOption: undefined,
        optionSuppliments: undefined,
        optionSupplimentImageUrl: undefined,
        questionSupplimentImageUrl: undefined,
    };
    const { isLastQuestion, timeLimitSeconds, questionId, questionNumber, questionText, questionImageUrl, options, startedAt, answerCounts, correctOption, 
        optionSuppliments, optionSupplimentImageUrl, questionSupplimentImageUrl,
      }
        = { ...fallback, ...state };
    const getTimeLeft = () => {
        const timePassed = (Date.now() - startedAt) / 1000;
        return Math.max(timeLimitSeconds - timePassed, 0);
    }
    const { getAudio } = useVolume();
    const [timeLeft, setTimeLeft] = useState(state.phase === 'countDown' ? Math.floor(getTimeLeft()) : 0);
    const [answer, setAnswer] = useState<Answer | null>(null);

    useEffect(() => {
        const unsubscribe = Firebase.listenToUpdate(Firebase.docRefOf("answers", `${gameId}_${questionId}_${playerId}`).withConverter(createConverter<Answer>()), (data) => {
            if (data) {
                setAnswer(data);
            }
        });
        return () => unsubscribe();
    }, [gameId, state.questionId, playerId]);

    useEffect(() => {
        if (timeLeft === 0) {
            if (isLastQuestion && state.phase === 'countDown') {
                const audio = getAudio('/audio/last_question_done.mp3');
                audio.play();
            }
            return;
        };
        const timerId = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timerId);
    }, [timeLeft]);
    useEffect(() => {
        switch (state.phase) {
            case 'countDown': {
                const src = `/audio/count_down_${timeLimitSeconds}s.mp3`;
                const audio = getAudio(src);
                const currentTimeToSet = (timeLimitSeconds - Math.floor(getTimeLeft()));
                audio.currentTime = currentTimeToSet;
                audio.play();
                return;
            }
            case 'answerCheck': {
                const audio = getAudio('/audio/answer_check.mp3');
                audio.play();
                return;
            }
            case 'revealAnswer': {
                const audio = getAudio('/audio/reveal_answer.mp3');
                audio.play();
                return;
            }
        }
    }, [state.phase])

    const onOptionClick = useCallback(({ option }: { option: AnswerOption}) => {
        submitAnswer(gameId, questionId, playerId, option, getTimeLeft() * 1000);
    }, [gameId, questionId, playerId])

    return (
        <QuestionComponent
            questionNumber={questionNumber}
            questionText={questionText}
            questionImageUrl={questionImageUrl}
            options={options}
            timeLeft={timeLeft}
            answerCounts={answerCounts}
            correctOption={correctOption}
            optionSuppliments={optionSuppliments}
            optionSupplimentImageUrl={optionSupplimentImageUrl}
            questionSupplimentImageUrl={questionSupplimentImageUrl}
            optionChosen={answer?.option}
            onOptionClick={state.phase === 'countDown' && timeLeft > 0 ? onOptionClick : undefined}
        />
    )
}

export type QuestionComponentProps = {
    questionNumber: number,
    questionText: string,
    questionImageUrl?: string,
    options: {
        a: string,
        b: string,
        c: string,
        d: string
    },
    timeLeft: number,
    optionSuppliments?: {
        a?: string,
        b?: string,
        c?: string,
        d?: string,
    },
    optionSupplimentImageUrl?: string,
    questionSupplimentImageUrl?: string,
    answerCounts?: {
        a: number,
        b: number,
        c: number,
        d: number,
    },
    correctOption?: AnswerOption,
    onOptionClick?: ({ option }: { option: AnswerOption }) => void,
    optionChosen?: AnswerOption,
}


export const QuestionComponent = ({ questionSupplimentImageUrl, correctOption, answerCounts, timeLeft, questionNumber, optionSuppliments, questionText, questionImageUrl, options, onOptionClick, optionChosen }: QuestionComponentProps) => {

    const styles = useMemo(() => ({
        container: {
            display: "flex",
            flexDirection: "column" as const,
            width: "90%",
            height: "90vh",
            margin: "0 auto",
            border: "2px solid #ccc",
            borderRadius: "10px",
            overflow: "hidden",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            backgroundColor: "#f4f4f9",
        },
        topSection: {
            display: "flex",
            flex: 1,
            flexDirection: "column" as const,
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
            textAlign: "center" as const,
            backgroundColor: "#ffffff",
            borderBottom: "2px solid #ddd",
            position: "relative" as const,
        },
        question: {
            fontSize: "1.5rem",
            marginBottom: "20px",
        },
        image: {
            maxWidth: "100%",
            maxHeight: "200px",
            borderRadius: "5px",
        },
        bottomSection: {
            display: "flex",
            flexDirection: "column" as const,
            flex: 1,
            justifyContent: "space-around",
            backgroundColor: "#f9f9f9",
        },
        option: {
            padding: "15px",
            fontSize: "1.2rem",
            border: "1px solid #ccc",
            backgroundColor: "#ffffff",
            transition: "background-color 0.3s",
            display: "flex",
            alignItems: "center",
            flexDirection: "row" as const,
            borderRadius: "5px",
        },
        alphabet: {
            textAlign: "center" as const,
            fontWeight: "bold" as const,
            fontSize: "2rem",
            color: "darkcyan",
            flex: "0 0 50px",
        },
        optionSuppliment: {
            paddingLeft: "0.5rem",
            color: "red",
        },
        answerCount: {
            textAling: "center" as const,
            fontWeigth: "bold" as const,
            fontSize: "2rem",
            color: "gray",
            flex: "0 0 50px",
            marginLeft: "auto",
        },
        timer: {
            position: "absolute" as const,
            bottom: "20px",
            right: "20px",
            fontSize: "3rem",
            color: "#555",
            fontWeight: "bold",
            height: "50px",
            width: "100px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
        },
    }), []);
    const onOptionHover = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        if (timeLeft > 0)
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#ddd";
    }, [timeLeft > 0])
    const onOptionHoverOut = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        if (timeLeft > 0)
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#fff";
    }, [timeLeft > 0])

    return (
        <div style={styles.container}>
            <div style={styles.topSection}>
                <div style={styles.question}>
                    <p>{questionText}</p>
                </div>
                <div>
                    {questionSupplimentImageUrl || questionImageUrl ?  <img src={questionSupplimentImageUrl||questionImageUrl} style={styles.image} /> : null}
                </div>
                { answerCounts ? null : 
                    <div style={{
                        ...styles.timer,
                        ...(timeLeft <= 3 ? { color: "red" } : {}),
                    }}>{timeLeft}</div>
                }
            </div>

            <div style={styles.bottomSection}>
                {Object.entries(options).sort(([a, _a], [b, _b]) => a.localeCompare(b)).map(([alphabet, option]) => (
                    <button
                        key={alphabet}
                        style={{
                            ...styles.option,
                            boxShadow: optionChosen === alphabet ? "inset 0 0 15px orange" : undefined,
                            cursor: timeLeft > 0 && onOptionClick ? 'pointer' : 'default',
                            ...(alphabet === correctOption ? {backgroundColor: "palegreen"} : {}), 
                        }}
                        onClick={onOptionClick ? () => onOptionClick({ option: alphabet as AnswerOption }) : undefined }
                        onMouseOver={onOptionHover}
                        onMouseOut={onOptionHoverOut}
                    >
                        <div style={styles.alphabet}>{alphabet.toUpperCase()}</div>
                        <div>
                            {option}
                            <span style={styles.optionSuppliment}>
                                {optionSuppliments && optionSuppliments[alphabet as AnswerOption] ? `(${optionSuppliments[alphabet as AnswerOption]})` : null}
                            </span> </div>
                        <div style={styles.answerCount}>{ answerCounts ? answerCounts[alphabet as AnswerOption] : null}</div>
                    </button>
                ))}

            </div>
        </div>
    );
}

export const LastQuestionDoneGameStateComponent = ({ state }: {state: LastQuestionDonePhase}) => {
    return (
        <h1>ゲーム終了です。まもなく最終結果が発表されます...</h1>
    );
}

const dummyRankings = ([
    { player: 'Player1', correctAnswers: 5, averageTimeLeftSeconds: 2.5 },
    { player: 'Player2', correctAnswers: 8, averageTimeLeftSeconds: 1.2 },
    { player: 'Player3', correctAnswers: 7, averageTimeLeftSeconds: 3.1 },
    { player: 'Player4', correctAnswers: 6, averageTimeLeftSeconds: 2.8 },
    { player: 'Player5', correctAnswers: 9, averageTimeLeftSeconds: 1.0 },
    { player: 'Player6', correctAnswers: 4, averageTimeLeftSeconds: 2.9 },
    { player: 'Player7', correctAnswers: 3, averageTimeLeftSeconds: 3.5 },
    { player: 'Player8', correctAnswers: 2, averageTimeLeftSeconds: 0.4 },
    { player: 'Player9', correctAnswers: 1, averageTimeLeftSeconds: 4.5 },
    { player: 'Player10', correctAnswers: 10, averageTimeLeftSeconds: 0.8 },
    { player: 'Player11', correctAnswers: 5, averageTimeLeftSeconds: 0.5 },
    { player: 'Player12', correctAnswers: 8, averageTimeLeftSeconds: 1.5 },
    { player: 'Player13', correctAnswers: 7, averageTimeLeftSeconds: 3.0 },
    { player: 'Player14', correctAnswers: 6, averageTimeLeftSeconds: 2.6 },
    { player: 'Player15', correctAnswers: 9, averageTimeLeftSeconds: 1.1 },
    { player: 'Player16', correctAnswers: 4, averageTimeLeftSeconds: 3.2 },
    { player: 'Player17', correctAnswers: 3, averageTimeLeftSeconds: 3.8 },
    { player: 'Player18', correctAnswers: 2, averageTimeLeftSeconds: 4.2 },
    { player: 'Player19', correctAnswers: 1, averageTimeLeftSeconds: 4.7 },
    { player: 'Player20', correctAnswers: 10, averageTimeLeftSeconds: 0.9 },
] as Ranking[]).sort((a, b) => b.correctAnswers - a.correctAnswers || b.averageTimeLeftSeconds - a.averageTimeLeftSeconds);

export const ShowResultsGameStateComponent = ({ state }: {state: ShowResultsPhase}) => {
    const [showFireworks, setShowFireworks] = useState(false);
    const { getAudio } = useVolume();
    useEffect(() => {
        const audio = getAudio('/audio/show_ranking.mp3');
        audio.play();
        audio.onended = () => {
            const victoryAudio = getAudio('/audio/victory.mp3');
            victoryAudio.play();
            setShowFireworks(true);
        };
    }, []);

    return (
        <div>
            {/* <AnimatedRanking rankings={state.rankings} /> */}
            <AnimatedRanking rankings={dummyRankings} />
            { showFireworks ? <Fireworks/> : null}
        </div>
    );
}


const addPlayer = async (gameId: string, name: string): Promise<string> => {
    const ref = Firebase.docRefOf("games", gameId).withConverter(createConverter<GameInstance>());
    return await runTransaction(Firebase.db, async (transaction) => {
        const gameDoc = await transaction.get(ref);
        if (!gameDoc.exists()) {
            throw new Error(`GameID ${gameId} does not exist!`);
        }
        const players = gameDoc.data().players
        if (!Object.values(players).includes(name)) {
            const playerID = Math.random().toString(36).substring(2, 15);
            transaction.update(ref, { players: { ...players, [playerID]: name } });
            return playerID;
        } else {
            throw new Error(`Player name ${name} already exists in the game.`);
        }
    });
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

        addPlayer(gameId!, trimmedName).then((playerId) => {
            navigate(`/game/${gameId}/${playerId}`);
        }).catch((error) => {
            setError(error.message);
        });
    };

    return (
        <div>
            <h1>プレイヤー登録</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    プレイヤー名: 
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </label>
                <button type="submit">参加</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};


