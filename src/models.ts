
export type GameTemplate = {
    ID?: string,
    name: string,
    questionIds: string[],
}
export type AnswerOption = 'a' | 'b' | 'c' | 'd';

export type Question = {
    ID?: string,
    questionText: string,
    questionImageUrl?: string,
    correctOption: AnswerOption,
    timeLimitSeconds: 10 | 15,
    options: {
        a: string,
        b: string,
        c: string,
        d: string,
    },
    questionSupplimentImageUrl?: string,
    optionSuppliments?: {
        a?: string,
        b?: string,
        c?: string,
        d?: string,
    },
    createdAt?: number;
    lastUpdatedAt?: number;
}

export type CreatedPhase = {
    phase: 'created',
    startedAt: number,
}

export type StartedPhase = {
    phase: 'started',
    startedAt: number,
}

export type ReadQuestionPhase = {
    phase: 'readQuestion',
    startedAt: number,
    questionNumber: number,
    questionText: string,
}

export type CountDownPhase = {
    phase: 'countDown',
    startedAt: number,
    timeLimitSeconds: number,
    questionId: string,
    questionNumber: number,
    questionText: string,
    questionImageUrl?: string,
    options: {
        a: string,
        b: string,
        c: string,
        d: string,
    },
    isLastQuestion: boolean,
}

export type AnswerCheckPhase = {
    phase: 'answerCheck',
    startedAt: number,
    questionId: string,
    questionNumber: number,
    questionText: string,
    questionImageUrl?: string,
    options: {
        a: string,
        b: string,
        c: string,
        d: string,
    },
    answerCounts: {
        a: number,
        b: number,
        c: number,
        d: number,
    }
}

export type RevealAnswerPhase = {
    phase: 'revealAnswer',
    startedAt: number,
    questionId: string,
    questionNumber: number,
    questionText: string,
    questionImageUrl?: string,
    options: {
        a: string,
        b: string,
        c: string,
        d: string,
    },
    correctOption: AnswerOption,
    answerCounts: {
        a: number,
        b: number,
        c: number,
        d: number,
    },
    questionSupplimentImageUrl?: string,
    optionSuppliments?: {
        a?: string,
        b?: string,
        c?: string,
        d?: string,
    },
}

export type LastQuestionDonePhase = {
    phase: 'lastQuestionDone',
    startedAt: number,
}

export type Ranking = {
    player: string,
    correctAnswers: number,
    averageTimeLeftSeconds: number,
}

export type ShowResultsPhase = {
    phase: 'showResults',
    startedAt: number,
    rankings: Ranking[],
}

export type EndedPhase = {
    phase: 'ended',
    startedAt: number,
}

export type GameState = 
    | CreatedPhase 
    | StartedPhase 
    | ReadQuestionPhase 
    | CountDownPhase 
    | AnswerCheckPhase 
    | RevealAnswerPhase 
    | LastQuestionDonePhase 
    | ShowResultsPhase 
    | EndedPhase;

export type GameStateWithoutDynamicFields = 
    | Omit<CreatedPhase, 'startedAt'>
    | Omit<StartedPhase, 'startedAt'>
    | Omit<ReadQuestionPhase, 'startedAt'>
    | Omit<CountDownPhase, 'startedAt'>
    | Omit<AnswerCheckPhase, 'startedAt' | 'answerCounts'>
    | Omit<RevealAnswerPhase, 'startedAt' | 'answerCounts'>
    | Omit<LastQuestionDonePhase, 'startedAt'>
    | Omit<ShowResultsPhase, 'startedAt' | 'rankings'>
    | Omit<EndedPhase, 'startedAt'>;

export type Answer = {
    gameId: string,
    playerId: string,
    questionId: string,
    option: AnswerOption,
    timeLeftMillis: number,
}
