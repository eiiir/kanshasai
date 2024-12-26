import React, { useState } from 'react';
import { GameTemplate } from '../models';
import Firebase from '../Firebase';
import { createConverter } from '../converters';
import { addDoc } from 'firebase/firestore';

const addGameTemplate = async (gameTemplate: GameTemplate) => {
    const ref = Firebase.collectionRefOf("gameTemplates").withConverter(createConverter<GameTemplate>())
    return addDoc(ref, gameTemplate);
}

export const AddGameTemplateModule = () => {
    const [name, setName] = useState('');
    const [questionIds, setQuestionIds] = useState<string[]>([]);
    const [newQuestionId, setNewQuestionId] = useState('');

    const handleAddQuestionId = () => {
        if (newQuestionId.trim() !== '') {
            setQuestionIds([...questionIds, newQuestionId.trim()]);
            setNewQuestionId('');
        }
    };

    const handleSubmit = async () => {
        const gameTemplate: GameTemplate = {
            name,
            questionIds,
        };
        await addGameTemplate(gameTemplate);
        setName('');
        setQuestionIds([]);
    };

    return (
        <div>
            <div>
                <label>
                    Name:
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </label>
            </div>
            <div>
                <label>
                    Question IDs: {questionIds.join(', ')}
                </label>
            </div>
            <div>
                <label>
                    Add a Question ID:
                    <input
                        type="text"
                        value={newQuestionId}
                        onChange={(e) => setNewQuestionId(e.target.value)}
                    />
                    <button onClick={handleAddQuestionId}>Add Question ID</button>
                </label>
            </div>
            <button onClick={handleSubmit}>Add Game Template</button>
        </div>
    );
}