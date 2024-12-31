import React, { useState, useEffect } from "react";
import { Ranking } from "./models";
import Fireworks from "./Fireworks";

const styles = {
    container: {
        width: "80%",
        margin: "20px auto",
        border: "2px solid #ccc",
        borderRadius: "10px",
        padding: "20px",
        backgroundColor: "#f4f4f9",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        overflow: "hidden",
    },
    title: {
        textAlign: "center" as const,
        fontSize: "1.8rem",
        marginBottom: "20px",
        fontWeight: "bold",
    },
    rankingList: {
        listStyleType: "none" as const,
        padding: 0,
        margin: 0,
    },
    rankingItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 20px",
        margin: "5px 0",
        backgroundColor: "#ffffff",
        border: "1px solid #ccc",
        borderRadius: "5px",
        fontSize: "1.2rem",
        transform: "translateX(-100%)",
        opacity: 0,
        animation: "slideInFromLeft 0.5s forwards",
    },
    headerItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 20px",
        margin: "5px 0",
        backgroundColor: "#e0e0e0",
        borderBottom: "2px solid #ccc",
        fontSize: "1rem",
        fontWeight: "bold",
    },
};

const AnimatedRanking = ({ rankings } : { rankings: Ranking[] }) => {
    const [displayedRankings, setDisplayedRankings] = useState<Ranking[]>([]);
    const [currentIndex, setCurrentIndex] = useState(rankings.length - 1);
    const lastPadding = 500;
    const lastInsertDelay = 1500;
    const totalDelay = 11000; // Music length
    const defaultDelayPerItem = rankings.length <= 1 ? totalDelay : Math.floor((totalDelay - lastInsertDelay - lastPadding) / (rankings.length - 1))

    useEffect(() => {
        // Add one player at a time to the displayed ranking
        if (currentIndex >= 0) {
            const delay = currentIndex === 0 ? lastInsertDelay : defaultDelayPerItem
            const timer = setTimeout(() => {
                setDisplayedRankings((prev) => [rankings[currentIndex], ...prev]);
                setCurrentIndex((prev) => prev - 1);
            }, delay);

            return () => clearTimeout(timer);
        }
    }, [currentIndex, rankings]);

    return (
        <div style={styles.container}>
            <div style={styles.title}>結果発表</div>
            <ul style={styles.rankingList}>
                <li style={styles.headerItem}>
                    <span style={{ textAlign: "left", flex: 0.5 }}>順位</span>
                    <span style={{ flex: 0.5 }}></span>
                    <span style={{ textAlign: "left", flex: 2 }}>プレイヤー</span>
                    <span style={{ textAlign: "right", flex: 1 }}>正答数</span>
                    <span style={{ textAlign: "right", flex: 1 }}>
                        正答時の<br />平均残り時間
                    </span>
                </li>
                {displayedRankings.map((ranking, index) => (
                    <li key={ranking.player} style={{
                        ...styles.rankingItem,
                        ...(currentIndex + index + 2 === 1 ? { backgroundColor: "palegreen" } : {}),
                    }}>
                        <span style={{ textAlign: "left", flex: 0.5 }}>{currentIndex + index + 2}</span>
                        <span style={{ textAlign: "center", flex: 0.5 }}>{currentIndex + index + 2 === 1 ? "👑" : ""}</span>
                        <span style={{ textAlign: "left", flex: 2}}>{ranking.player}</span>
                        <span style={{ textAlign: "right", flex: 1}}>{ranking.correctAnswers}</span>
                        <span style={{ textAlign: "right", flex: 1}}>{ranking.averageTimeLeftSeconds.toFixed(3)}</span>
                    </li>
                ))}
            </ul>
            <style>
                {`
                    @keyframes slideInFromLeft {
                        0% {
                            transform: translateX(-100%);
                            opacity: 0;
                        }
                        100% {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                `}
            </style>
        </div>
    );
};

export default AnimatedRanking;
