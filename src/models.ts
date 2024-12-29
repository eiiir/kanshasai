
export type GameTemplate = {
    ID?: string,
    name: string,
    questionIds: string[],
}

export type Question = {
    ID?: string,
    questionText: string,
    questionImageUrl?: string,
    correctOption: 'a' | 'b' | 'c' | 'd',
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
    questionNumber: number,
    questionText: string,
    questionImageUrl?: string,
    options: {
        a: string,
        b: string,
        c: string,
        d: string,
    },
    correctOption: 'a' | 'b' | 'c' | 'd',
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

export type ShowResultsPhase = {
    phase: 'showResults',
    startedAt: number,
    rankings: { player: string, correctAnswers: number, accumulatedTimeSeconds: number }[],
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