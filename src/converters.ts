import { DocumentData, QueryDocumentSnapshot, SnapshotOptions, FirestoreDataConverter } from "firebase/firestore";

export const createConverter = <T extends DocumentData>(): FirestoreDataConverter<T> => ({
    toFirestore(data: T): DocumentData {
        return { ...data };
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options: SnapshotOptions
    ): T {
        return snapshot.data(options) as T;
    }
});
