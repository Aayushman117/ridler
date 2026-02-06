import { useEffect, useRef, useState } from "react";
import { riddles } from "../data/riddles";

/* blinking keyframes */
const styleTag = document.createElement("style");
styleTag.innerHTML = `
@keyframes termBlink {
  0% { opacity: 1; }
  50% { opacity: 0; }
  100% { opacity: 1; }
}`;
document.head.appendChild(styleTag);

export default function TerminalRiddle() {

    const [displayText, setDisplayText] = useState("");
    const [userInput, setUserInput] = useState("");

    const [stage, setStage] = useState("intro");
    const [index, setIndex] = useState(0);

    const [lines, setLines] = useState([]);
    const [failCount, setFailCount] = useState(0);

    const [blackout, setBlackout] = useState(false);
    const [exitMode, setExitMode] = useState(false);

    const [riddleStage, setRiddleStage] = useState(1);
    const [usedTaunts, setUsedTaunts] = useState([]);

    const startedRef = useRef(false);
    const cancelRef = useRef(false);

    // MOBILE INPUT REF
    const hiddenInputRef = useRef(null);

    const addLine = (t) => setLines(p => [...p, t]);

    /* ───── TAUNTS NO REPEAT ───── */
    const taunts = [
        "THINK A LITTLE HARDER.",
        "WHEN YOU GUESS WRONG, I GUESS YOU’D BETTER TRY AGAIN.",
        "POWER HAS CORRUPTED YOU, AND YOUR ANSWERS.",
        "I FEEL LIKE YOU’RE NOT EVEN TRYING.",
        "QUESTION EVERYTHING – INCLUDING YOUR ANSWER."
    ];

    const getRandomTaunt = () => {
        let available = taunts.filter(t => !usedTaunts.includes(t));

        if (available.length === 0) {
            setUsedTaunts([]);
            available = [...taunts];
        }

        const pick = available[Math.floor(Math.random() * available.length)];
        setUsedTaunts(prev => [...prev, pick]);

        return pick;
    };

    /* ───── EXIT SCREEN ───── */
    const runExitScreen = async () => {

        setExitMode(true);
        setLines([]);
        setDisplayText("");

        const shutdownScript = [
            "systemctl stop sshd",
            "systemctl status sshd",
            "● sshd.service - OpenSSH Daemon",
            "Loaded: loaded (/lib/systemd/system/sshd.service; enabled; vendor preset: enabled)",
            "Active: inactive (dead)",
            "rm /var/log/sshd.log",
            "echo -n > ~/.bash_history",
            "exit"
        ];

        for (let line of shutdownScript) {
            await new Promise(r => setTimeout(r, 220));

            setLines(prev => [
                ...prev,
                { text: line, system: true }
            ]);
        }

        await new Promise(r => setTimeout(r, 4000));
        setBlackout(true);
    };

    /* ───── WORD BY WORD TYPER ───── */
    const typeWords = async (text) => {

        cancelRef.current = false;
        setStage("typing");

        const words = text.split(" ");
        let built = "";

        for (let i = 0; i < words.length; i++) {
            if (cancelRef.current) return;

            built += words[i] + " ";
            setDisplayText(built.trim());

            await new Promise(r => setTimeout(r, 120));
        }

        addLine(">> " + built.trim());
        setDisplayText("");
    };

    /* ───── INTRO ───── */
    const runIntro = async () => {
        await typeWords(
            "THERE YOU ARE. LET’S PLAY A GAME, JUST ME AND YOU. YOU READY?"
        );

        await typeWords("PROCEED? [Y/N]");
        setStage("confirm");
    };

    /* ───── START RIDDLE ───── */
    const startRiddle = async () => {

        if (riddleStage === 1) {
            setIndex(0);
        }

        await typeWords(
            riddles[index].question.toUpperCase()
        );

        setStage("answer");
    };

    const endScreen = async () => {
        addLine(">> MAYBE YOU ARE NOT THE ONE AFTER ALL.");
        await new Promise(r => setTimeout(r, 700));
        runExitScreen();
    };

    /* ───── AUTO FOCUS ON MOBILE ───── */
    useEffect(() => {
        setTimeout(() => {
            hiddenInputRef.current?.focus();
        }, 300);
    }, [stage]);

    /* ───── KEYBOARD ───── */
    useEffect(() => {

        if (!startedRef.current) {
            startedRef.current = true;
            runIntro();
        }

        const handleKey = (e) => {

            if (blackout) return;

            if (stage === "confirm") {

                if (e.key.toLowerCase() === "y") {
                    addLine(">> Y");

                    typeWords("ARE YOU SURE YOU HAVE WHAT IT TAKES? LET’S BEGIN.")
                        .then(() => {
                            setIndex(0);
                            startRiddle();
                        });
                }

                if (e.key.toLowerCase() === "n") {
                    addLine(">> N");
                    endScreen();
                }
                return;
            }

            if (stage === "answer") {

                if (e.key === "Enter") checkAnswer();
                else if (e.key === "Backspace") setUserInput(p => p.slice(0, -1));
                else if (e.key.length === 1) setUserInput(p => p + e.key);
            }

            if (stage === "failDialog") {

                if (e.key.toLowerCase() === "y") {
                    addLine(">> Y");

                    setIndex(1);
                    setFailCount(0);
                    setRiddleStage(2);
                    setUserInput("");

                    typeWords("VERY WELL. LET US TRY ANOTHER ONE.")
                        .then(() =>
                            typeWords(riddles[1].question.toUpperCase())
                        );

                    setStage("answer");
                }

                if (e.key.toLowerCase() === "n") {
                    addLine(">> N");
                    endScreen();
                }
            }
        };

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);

    }, [stage, userInput, blackout, index, riddleStage]);

    /* ───── CHECK ANSWER ───── */
    const checkAnswer = async () => {

        const clean = (s) =>
            s.toLowerCase().replace(/[^a-z ]/g, "").trim();

        const correct = clean(riddles[index].answer);
        const alternatives = (riddles[index].alt || []).map(clean);
        const user = clean(userInput);

        const isCorrect =
            user === correct ||
            alternatives.includes(user);

        addLine(">> " + userInput);

        if (isCorrect) {

            await typeWords("INTERESTING... YOU MAY BE SMARTER THAN YOU LOOK.");

            const next = index + 1;

            if (next < riddles.length) {
                setIndex(next);
                setUserInput("");

                await typeWords(
                    riddles[next].question.toUpperCase()
                );

                setStage("answer");
            }

            return;
        }

        const newFail = failCount + 1;
        setFailCount(newFail);

        const msg = getRandomTaunt();
        await typeWords(msg);

        setUserInput("");
        setStage("answer");

        if (riddleStage === 1 && newFail >= 5) {

            await typeWords(
                "YOU JUST CAN’T GET THIS ONE, CAN YOU? WANT TO TRY SOMETHING EASIER?"
            );

            await typeWords("TRY A DIFFERENT RIDDLE? [Y/N]");
            setStage("failDialog");
        }

        if (riddleStage === 2 && newFail >= 3) {

            await typeWords("I GAVE YOU ANOTHER CHANCE. YOU WASTED IT.");
            await new Promise(r => setTimeout(r, 700));

            endScreen();
        }
    };

    const cursorStyle = {
        animation: (stage === "typing" || exitMode)
            ? "none"
            : "termBlink 1s step-end infinite",
        marginLeft: "2px"
    };

    if (blackout) {
        return <div className="bg-black min-h-screen w-full"></div>;
    }

    /* ───── UI (MOBILE SIZE VIA CSS ONLY) ───── */
    return (
        <div
            className="term-green"
            style={{ minHeight: "100vh", paddingTop: "20px" }}
            onClick={() => hiddenInputRef.current?.focus()}
        >

            <div className="whitespace-pre-wrap">
                {lines.map((l, i) => {

                    if (typeof l === "object" && l.system) {
                        return (
                            <div
                                key={i}
                                className="mobile-exit-margin"
                                style={{ marginLeft: "40px", wordBreak: "break-word" }}
                            >
                                {l.text}
                            </div>
                        );
                    }

                    return (
                        <div
                            key={i}
                            className="mobile-margin"
                            style={{ marginLeft: "28px", wordBreak: "break-word" }}
                        >
                            {l}
                        </div>
                    );

                })}
            </div>

            {displayText && (
                <div
                    className="mobile-margin"
                    style={{ marginLeft: "28px", wordBreak: "break-word" }}
                >
                    {">> " + displayText}
                    <span style={cursorStyle}>{"<?>"}</span>
                </div>
            )}

            {!exitMode && (stage === "answer" || stage === "confirm" || stage === "failDialog") && (
                <div
                    className="mt-1 mobile-margin"
                    style={{ marginLeft: "28px", position: "relative" }}
                >

                    {">> " + userInput}
                    <span style={cursorStyle}>{"<?>"}</span>

                    <input
                        ref={hiddenInputRef}
                        type="text"
                        value={userInput}
                        onChange={e => setUserInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Enter") checkAnswer();
                        }}
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck="false"
                        style={{
                            position: "absolute",
                            opacity: 0,
                            left: 0,
                            top: 0,
                            width: "1px",
                            height: "1px"
                        }}
                    />
                </div>
            )}

        </div>
    );
}
