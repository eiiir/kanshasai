import React, { useState } from "react";
import { AnswerOption, Question } from "../models";

type Props = {
    question?: Question;
    onSave: (updatedQuestion: Question) => void;
};

const emptyQuestion = {
    ID: undefined,
    questionText: "",
    questionImageUrl: "",
    correctOption: "a" as const,
    timeLimitSeconds: 10 as const,
    options: {
        a: "",
        b: "",
        c: "",
        d: "",
    },
    questionSupplimentImageUrl: undefined,
    optionSuppliments: {
        a: "",
        b: "",
        c: "",
        d: "",
    },
    createdAt: undefined,
    lastUpdatedAt: undefined,
};

// Recursive function to remove empty strings and empty objects
const normalizeEmptyStrings = (obj: any): any => {
    if (typeof obj === "string") {
        return obj.trim() === "" ? undefined : obj;
    } else if (typeof obj === "object" && obj !== null) {
        const normalizedObject = Object.keys(obj).reduce((acc, key) => {
            const normalizedValue = normalizeEmptyStrings(obj[key]);
            if (normalizedValue !== undefined) {
                acc[key] = normalizedValue;
            }
            return acc;
        }, {} as any);

        // Return undefined if the resulting object is empty
        return Object.keys(normalizedObject).length > 0 ? normalizedObject : undefined;
    }
    return obj;
};

const QuestionEditor: React.FC<Props> = ({ question, onSave }) => {
    const [formData, setFormData] = useState<Question>({ ...emptyQuestion, ...(question || {}), });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.questionText || formData.questionText.trim() === "") {
            newErrors.questionText = "Question text is required.";
        }

        if (!formData.correctOption || !["a", "b", "c", "d"].includes(formData.correctOption)) {
            newErrors.correctOption = "Correct option must be one of 'a', 'b', 'c', or 'd'.";
        }

        if (!formData.options.a || !formData.options.b || !formData.options.c || !formData.options.d) {
            newErrors.options = "All answer options (a, b, c, d) are required.";
        }

        if (!formData.timeLimitSeconds || ![10, 15].includes(formData.timeLimitSeconds)) {
            newErrors.timeLimitSeconds = "Time limit must be either 10 or 15 seconds.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value: rawValue } = e.target;
        let value;
        if (name == "timeLimitSeconds") {
            value = parseInt(rawValue)
        } else {
            value = rawValue
        }
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleNestedChange = (
        key: "options" | "optionSuppliments",
        optionKey: keyof Question["options"],
        value: string
    ) => {
        setFormData((prev) => ({
            ...prev,
            [key]: {
                ...prev[key],
                [optionKey]: value,
            },
        }));
    };

    const handleSave = () => {
        if (validate()) {
            const normalizedData = normalizeEmptyStrings({...formData}) as Question
            onSave(normalizedData);
            setFormData({ ...emptyQuestion,  ...(question || {}), })
        }
    };

    return (
        <div style={styles.container}>
            <h2>{formData.ID ? "Edit Question" : "Add Question"}</h2>
            <div style={styles.field}>
                <label>Question ID</label>
                <textarea
                    name="ID"
                    value={formData.ID}
                    onChange={handleChange}
                    style={styles.input}
                    disabled={question?.ID !== undefined}
                />
                {errors.ID && <p style={styles.error}>{errors.ID}</p>}
            </div>
            <div style={styles.field}>
                <label>Question Text *</label>
                <textarea
                    name="questionText"
                    value={formData.questionText}
                    onChange={handleChange}
                    style={styles.input}
                />
                {errors.questionText && <p style={styles.error}>{errors.questionText}</p>}
            </div>

            <div style={styles.field}>
                <label>Question Image URL (optional)</label>
                <input
                    type="url"
                    name="questionImageUrl"
                    value={formData.questionImageUrl || ""}
                    onChange={handleChange}
                    style={styles.input}
                />
            </div>

            <div style={styles.field}>
                <label>Options *</label>
                {["a", "b", "c", "d"].map((key) => (
                    <div key={key} style={styles.optionField}>
                        <span>Option {key.toUpperCase()}</span>
                        <input
                            type="text"
                            value={formData.options[key as keyof Question["options"]] || ""}
                            onChange={(e) =>
                                handleNestedChange("options", key as keyof Question["options"], e.target.value)
                            }
                            style={styles.input}
                        />
                    </div>
                ))}
                {errors.options && <p style={styles.error}>{errors.options}</p>}
            </div>

            <div style={styles.field}>
                <label>Correct Option *</label>
                <select
                    name="correctOption"
                    value={formData.correctOption}
                    onChange={handleChange}
                    style={styles.input}
                >
                    <option value="">-- Select --</option>
                    {["a", "b", "c", "d"].map((option) => (
                        <option key={option} value={option}>
                            {option.toUpperCase()}
                        </option>
                    ))}
                </select>
                {errors.correctOption && <p style={styles.error}>{errors.correctOption}</p>}
            </div>
            
            <div style={styles.field}>
                <label>QuestionSuppliment Image URL (optional)</label>
                <input
                    type="url"
                    name="questionSupplimentImageUrl"
                    value={formData.questionSupplimentImageUrl || ""}
                    onChange={handleChange}
                    style={styles.input}
                />
            </div>

            <div style={styles.field}>
                <label>Option Suppliments (optional)</label>
                {["a", "b", "c", "d"].map((key) => (
                    <div key={key} style={styles.optionField}>
                        <span>Suppliment {key.toUpperCase()}</span>
                        <input
                            type="text"
                            value={formData.optionSuppliments?.[key as keyof Question["optionSuppliments"]] || ""}
                            onChange={(e) =>
                                handleNestedChange(
                                    "optionSuppliments",
                                    key as keyof Question["optionSuppliments"],
                                    e.target.value
                                )
                            }
                            style={styles.input}
                        />
                    </div>
                ))}
            </div>

            <div style={styles.field}>
                <label>Time Limit (seconds) *</label>
                <select
                    name="timeLimitSeconds"
                    value={formData.timeLimitSeconds}
                    onChange={handleChange}
                    style={styles.input}
                >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                </select>
                {errors.timeLimitSeconds && <p style={styles.error}>{errors.timeLimitSeconds}</p>}
            </div>

            <button onClick={handleSave} style={styles.button}>
                Save Question
            </button>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: "600px",
        margin: "0 auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
    },
    field: {
        marginBottom: "15px",
    },
    input: {
        width: "100%",
        padding: "8px",
        fontSize: "1rem",
        borderRadius: "4px",
        border: "1px solid #ccc",
    },
    optionField: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "8px",
    },
    button: {
        padding: "10px 15px",
        fontSize: "1rem",
        color: "#fff",
        backgroundColor: "#007bff",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    },
    error: {
        color: "red",
        fontSize: "0.9rem",
    },
};

export default QuestionEditor;
