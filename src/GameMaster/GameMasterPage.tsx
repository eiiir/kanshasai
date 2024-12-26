import React, { useState } from 'react';
import Firebase from '../Firebase';
import { query, addDoc, FirestoreDataConverter, DocumentData, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore';
import { GameTemplate } from '../models';
import { AddGameTemplateModule } from './AddGameTemplateModule';
import { createConverter } from '../converters';

const getAllGameTemplates = async () => {
    const ref = Firebase.collectionRefOf("gameTemplates").withConverter(createConverter<GameTemplate>());
    return query(ref);
}

const GameMasterPage = () => {
    return (
        <div>
            <h1>Game Master's Page</h1>
            <h2>Add Game Template</h2>
            <AddGameTemplateModule />
        </div>
    );
}

export default GameMasterPage;