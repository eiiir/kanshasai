
import React, { FormEventHandler, useEffect, useState } from 'react';
import Firebase from './Firebase';
import { query, addDoc, FirestoreDataConverter, DocumentData, QueryDocumentSnapshot, SnapshotOptions, getDocs, deleteDoc, runTransaction } from 'firebase/firestore';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { GameTemplate, GameState, ReadQuestionPhase, CountDownPhase, AnswerCheckPhase, RevealAnswerPhase, LastQuestionDonePhase, ShowResultsPhase } from './models';
import { createConverter } from './converters';
import { GameInstance, getGameInstanceById } from './GameMaster/GameMasterPage';
import { useVolume } from './GlobalComponent';

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
                    <GameStateComponent state={gameInstance.state} />
                    <h2>Game Details</h2>
                    <p>Current State:</p>
                    <pre>{JSON.stringify(gameInstance.state, null, 2)}</pre>
                </div>
                : null }
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}

export const GameStateComponent = ({ state }: { state: GameState }) => {
    switch (state.phase) {
        case 'created':
            return <p>Waiting for the Game Master to start the game...</p>;
        case 'started':
            return <StartedGameStateComponent />;
        case 'readQuestion':
            return <ReadQuestionGameStateComponent state={state} />;
        case 'countDown':
            return <CountDownGameStateComponent state={state} />;
        case 'answerCheck':
            return <AnswerCheckGameStateComponent state={state} />;
        case 'revealAnswer':
            return <RevealAnswerGameStateComponent state={state} />;
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

export const CountDownGameStateComponent = ({ state }: {state: CountDownPhase}) => {
    const { isLastQuestion, timeLimitSeconds, questionNumber, questionText, questionImageUrl, options, startedAt }
        = state;
    const { getAudio } = useVolume();
    const timePassed = (Date.now() - startedAt) / 1000;
    const initialTimeLeft = Math.max(Math.floor(timeLimitSeconds - timePassed), 0);
    const [timeLeft, setTimeLeft] = useState(timeLimitSeconds);

    useEffect(() => {
        const src = `/audio/count_down_${timeLimitSeconds}s.mp3`;
        const audio = getAudio(src);
        const currentTimeToSet = (timeLimitSeconds - initialTimeLeft) * audio.duration;
        audio.currentTime = currentTimeToSet;
        audio.play();
    }, []);


    useEffect(() => {
        if (timeLeft === 0) {
            if (isLastQuestion) {
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

    return (
        <QuestionComponent
            questionNumber={questionNumber}
            questionText={questionText}
            questionImageUrl={questionImageUrl}
            options={options}
            timeLeft={timeLeft}
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
    correctOption?: 'a' | 'b' | 'c' | 'd',
}

export const QuestionComponent = ({ questionSupplimentImageUrl, correctOption, answerCounts, timeLeft, questionNumber, optionSuppliments, questionText, questionImageUrl, options }: QuestionComponentProps) => {
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
                <li style={correctOption == 'a' ? {color: 'red'} : {}}>{options.a} {answerCounts?.a} {optionSuppliments?.a ? `(${optionSuppliments!.a})` : ''}"</li>
                <li style={correctOption == 'b' ? {color: 'red'} : {}}>{options.b} {answerCounts?.b} {optionSuppliments?.b ? `(${optionSuppliments!.b})` : ''}"</li>
                <li style={correctOption == 'c' ? {color: 'red'} : {}}>{options.c} {answerCounts?.c} {optionSuppliments?.c ? `(${optionSuppliments!.c})` : ''}"</li>
                <li style={correctOption == 'd' ? {color: 'red'} : {}}>{options.d} {answerCounts?.d} {optionSuppliments?.d ? `(${optionSuppliments!.d})` : ''}"</li>
            </ul>
            <h2>Time Left: {timeLeft} seconds</h2>
        </div>
    );
}

export const AnswerCheckGameStateComponent = ({ state }: {state: AnswerCheckPhase}) => {
    const { questionNumber, questionText, questionImageUrl, options, startedAt }
        = state;
    const { getAudio } = useVolume();
    useEffect(() => {
        const audio = getAudio('/audio/answer_check.mp3');
        audio.play();
    }, []);

    return (
        <QuestionComponent
            questionNumber={questionNumber}
            questionText={questionText}
            questionImageUrl={questionImageUrl}
            options={options}
            timeLeft={0}
            answerCounts={state.answerCounts}
        />
    )
}

export const RevealAnswerGameStateComponent = ({ state }: {state: RevealAnswerPhase}) => {
    const { questionNumber, correctOption, answerCounts, questionSupplimentImageUrl, options, optionSuppliments, startedAt }
        = state;
    const { getAudio } = useVolume();
    useEffect(() => {
        const audio = getAudio('/audio/reveal_answer.mp3');
        audio.play();
    }, []);

    return (
        <QuestionComponent
            questionNumber={questionNumber}
            questionText={state.questionText}
            questionImageUrl={state.questionImageUrl}
            options={options}
            timeLeft={0}
            answerCounts={answerCounts}
            correctOption={correctOption}
            optionSuppliments={optionSuppliments}
            optionSupplimentImageUrl={questionSupplimentImageUrl}
            questionSupplimentImageUrl={state.questionSupplimentImageUrl}
        />
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


