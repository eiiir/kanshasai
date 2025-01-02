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
        <div style={{ padding: '20px', maxWidth: '600px', fontFamily: 'Arial, sans-serif', color: '#333' }}>
            <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
                    Name:
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
                    }}
                />
            </div>
            <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
                    Question IDs:
                </label>
                <p style={{ padding: '8px', background: '#f9f9f9', border: '1px solid #ddd', borderRadius: '4px' }}>
                    {questionIds.join(', ') || 'No Question IDs added yet'}
                </p>
            </div>
            <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
                    Add a Question ID:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        value={newQuestionId}
                        onChange={(e) => setNewQuestionId(e.target.value)}
                        style={{
                            flex: '1',
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
                        }}
                    />
                    <button
                        onClick={handleAddQuestionId}
                        style={{
                            padding: '8px 16px',
                            background: '#4caf50',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
                        }}
                    >
                        Add
                    </button>
                </div>
            </div>
            <button
                onClick={handleSubmit}
                style={{
                    padding: '10px 20px',
                    background: '#2196f3',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)',
                }}
            >
                Add Game Template
            </button>
        </div>
    );
}