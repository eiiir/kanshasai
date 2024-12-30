
import React, { FormEventHandler, useEffect, useState, useCallback } from 'react';
import Firebase from './Firebase';
import { query, addDoc, FirestoreDataConverter, DocumentData, QueryDocumentSnapshot, SnapshotOptions, getDocs, deleteDoc, runTransaction, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { GameTemplate, GameState, ReadQuestionPhase, CountDownPhase, AnswerCheckPhase, RevealAnswerPhase, LastQuestionDonePhase, ShowResultsPhase, AnswerOption, Answer } from './models';
import { createConverter } from './converters';
import { GameInstance, getGameInstanceById } from './GameMaster/GameMasterPage';
import { useVolume } from './GlobalComponent';

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
                    <h1>Player's Page</h1>
                    <p>Game ID: {gameId}</p>
                    <p>Player Name: {playerName}</p>
                    { gameInstance ? 
                        <div>
                            <GameStateComponent state={gameInstance.state} gameId={gameId} playerId={playerId} />
                            <h2>Game Details</h2>
                            <p>Current State:</p>
                            <pre>{JSON.stringify(gameInstance.state, null, 2)}</pre>
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
            <p>Click anywhere to start the game.</p>
        </div>
    );
}

export const GameStateComponent = ({ state, gameId, playerId }: { state: GameState, gameId: string, playerId: string }) => {
    switch (state.phase) {
        case 'created':
            return <p>Waiting for the Game Master to start the game...</p>;
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
            return <p>The game has ended.</p>;
    }
}

export const StartedGameStateComponent = () => {
    const { getAudio } = useVolume();

    useEffect(() => {
        const audio = getAudio('/audio/standup.mp3');
        audio.play();
    }, []);
    return <p>The game is starting!</p>;
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
            <h1>Question #{questionNumber}</h1>
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
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <h1>Question #{questionNumber}</h1>
            {questionImageUrl &&
                <img src={questionImageUrl} alt="Question" />
            }
            {questionSupplimentImageUrl &&
                <img src={questionSupplimentImageUrl} alt="QuestionSuppliment" />
            }
            <p>{questionText}</p>
            <ul>
                <li 
                    style={correctOption == 'a' ? {color: 'red'} : {}} 
                    onClick={onOptionClick ? () => onOptionClick({ option: 'a' }) : undefined}
                >
                    {optionChosen === 'a' ? '✔️' : ''} {options.a} {answerCounts?.a} {optionSuppliments?.a ? `(${optionSuppliments!.a})` : ''}
                </li>
                <li 
                    style={correctOption == 'b' ? {color: 'red'} : {}} 
                    onClick={onOptionClick ? () => onOptionClick({ option: 'b' }) : undefined}
                >
                    {optionChosen === 'b' ? '✔️' : ''} {options.b} {answerCounts?.b} {optionSuppliments?.b ? `(${optionSuppliments!.b})` : ''}
                </li>
                <li 
                    style={correctOption == 'c' ? {color: 'red'} : {}} 
                    onClick={onOptionClick ? () => onOptionClick({ option: 'c' }) : undefined}
                >
                    {optionChosen === 'c' ? '✔️' : ''} {options.c} {answerCounts?.c} {optionSuppliments?.c ? `(${optionSuppliments!.c})` : ''}
                </li>
                <li 
                    style={correctOption == 'd' ? {color: 'red'} : {}} 
                    onClick={onOptionClick ? () => onOptionClick({ option: 'd' }) : undefined}
                >
                    {optionChosen === 'd' ? '✔️' : ''} {options.d} {answerCounts?.d} {optionSuppliments?.d ? `(${optionSuppliments!.d})` : ''}
                </li>
            </ul>
            <h2>Time Left: {timeLeft} seconds</h2>
        </div>
    );
}

export const LastQuestionDoneGameStateComponent = ({ state }: {state: LastQuestionDonePhase}) => {
    return (
        <h1>Last question is done. The player ranking will be announced soon.</h1>
    );
}

export const ShowResultsGameStateComponent = ({ state }: {state: ShowResultsPhase}) => {
    const { getAudio } = useVolume();
    useEffect(() => {
        const audio = getAudio('/audio/show_ranking.mp3');
        audio.play();
        audio.onended = () => {
            const victoryAudio = getAudio('/audio/victory.mp3');
            victoryAudio.play();
        };
    }, []);

    return (
        <div>
            <h1>Game Results</h1>
            <ol>
                {state.rankings.map((ranking, i) => (
                    <li key={i}>{ranking.player} - {ranking.correctAnswers} correct answers in {ranking.accumulatedTimeSeconds} seconds</li>
                ))}
            </ol>
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


