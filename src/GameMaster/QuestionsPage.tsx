import React, { useCallback, useEffect, useState } from 'react';
import Firebase from '../Firebase';
import { query, startAt, addDoc, FirestoreDataConverter, DocumentData, QueryDocumentSnapshot, SnapshotOptions, getDocs, deleteDoc, getDoc, setDoc, updateDoc, where, orderBy, startAfter, Query } from 'firebase/firestore';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { GameState, GameTemplate, Question, GameStateWithoutDynamicFields, Answer, AnswerOption } from '../models';
import { AddGameTemplateModule } from './AddGameTemplateModule';
import { createConverter } from '../converters';
import { PlayerPageContent } from '../PlayerPage';
import QuestionEditor from './QuestionEditor';

export const QuestionsPage = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [lastCreatedAt, setLastCreatedAt] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchQuestions = useCallback(async () => {
        setLoading(true);
        const collectionsRef = Firebase.collectionRefOf('questions').withConverter(createConverter<Question>());
        const q = query(collectionsRef, orderBy("createdAt", "desc"))
        const snapshot = await getDocs(q);
        const questionsList = snapshot.docs.map(doc => ({ ID: doc.id, ...doc.data() } as Question));
        setQuestions(questionsList);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchQuestions();
    }, []);

    const saveQuestion = async (question: Question) => {
        const { ID, ...questionData } = question;
        if (question.ID) {
            const docRef = Firebase.docRefOf('questions', question.ID!).withConverter(createConverter<Question>())
            const getResult = await getDoc(docRef)
            if (getResult.exists()) {
                await setDoc(docRef, { ...questionData, lastUpdatedAt: Date.now() });
            } else {
                const now = Date.now()
                await setDoc(docRef, { ...questionData, lastUpdatedAt: now, createdAt: now })
            }
        } else {
            const collectionRef = Firebase.collectionRefOf('questions').withConverter(createConverter<Question>())
            const now = Date.now()
            await addDoc(collectionRef, { ...questionData, lastUpdatedAt: now, createdAt: now })
        }
        fetchQuestions();
    };

    return (
        <div>
            <Link to="/gm">Back to GM page</Link>
            <h1>Edit Questions</h1>
            <div>
                <QuestionEditor onSave={saveQuestion} />
            </div>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <div>
                    <h2>Edit Questions</h2>
                    {questions.map((question, index) => (
                        <div key={question.ID}>
                            <QuestionEditor question={question} onSave={saveQuestion} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
