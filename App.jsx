import React, { useState, useEffect, useCallback, useRef } from 'react';


// --- IMPORTANT: CONFIGURE YOUR GOOGLE SHEET URL HERE ---
// 1. Create a Google Sheet (e.g., "TAP It! Bingo Challenges")
// 2. Put your Bingo challenge phrases in Column A, one phrase per row.
// 3. Go to File > Share > Publish to web.
// 4. For "Link," choose "Comma-separated values (.csv)" from the dropdown for the sheet containing your challenges.
// 5. Copy the URL provided and paste it below, replacing this placeholder.
const GOOGLE_SHEET_URL = "YOUR_GOOGLE_SHEET_CSV_URL_HERE"; // <<< REPLACE THIS


// Function to shuffle an array (Fisher-Yates algorithm)
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};


// Function to generate a new bingo card for a 4x4 grid (16 cells total, including Free Space)
const generateBingoCard = (words) => {
    // Need 15 unique words for a 4x4 grid with one free space (16 cells total)
    if (words.length < 15) {
        console.error("Not enough unique challenge words for a 4x4 grid. Please add at least 15 words to your Google Sheet.");
        // Fallback to placeholders if not enough words
        return Array(15).fill("ADD MORE CHALLENGES").concat("FREE SPACE");
    }
    const shuffledWords = shuffleArray([...words]);
    const card = [];
    for (let i = 0; i < 15; i++) { // Select 15 words
        card.push(shuffledWords[i]);
    }
    // Insert FREE SPACE in the center for a 4x4 grid (index 7 for a 0-indexed array)
    card.splice(7, 0, "FREE SPACE");
    return card;
};


// Winning patterns for Bingo (4x4 grid)
const winningPatterns = [
    // Rows
    [0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15],
    // Columns
    [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15],
    // Diagonals
    [0, 5, 10, 15], [3, 6, 9, 12]
];


// Confetti Effect Component
const ConfettiOverlay = ({ show }) => {
    if (!show) return null;


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500 opacity-70 animate-pulse-fade"></div>
            <div className="relative text-white text-7xl font-extrabold animate-scale-in">🎉 BINGO! 🎉</div>
            {/* Simple confetti particles (CSS animation) */}
            {[...Array(50)].map((_, i) => (
                <div
                    key={i}
                    className="confetti-particle absolute"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
                        animationDuration: `${Math.random() * 2 + 1}s`,
                        animationDelay: `${Math.random() * 0.5}s`,
                        transform: `rotate(${Math.random() * 360}deg)`,
                    }}
                ></div>
            ))}
            <style>
                {`
                @keyframes pulse-fade {
                    0% { opacity: 0.7; transform: scale(1); }
                    50% { opacity: 0.9; transform: scale(1.05); }
                    100% { opacity: 0.7; transform: scale(1); }
                }
                @keyframes scale-in {
                    0% { transform: scale(0.5); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes confetti-fall {
                    0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
                .confetti-particle {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    animation: confetti-fall linear infinite;
                    pointer-events: none;
                }
                `}
            </style>
        </div>
    );
};




// Proof Modal Component
const ProofModal = ({ show, onClose, onConfirm, challengeText, initialProof = '' }) => {
    const [proofText, setProofText] = useState(initialProof);
    const inputRef = useRef(null);


    useEffect(() => {
        if (show) {
            // Set initial proof if provided
            setProofText(initialProof);
            // Focus input when modal opens
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            // Clear text when modal closes if not confirming
            if (!onConfirm) setProofText('');
        }
    }, [show, initialProof, onConfirm]);


    if (!show) return null;


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 font-sans">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md text-center">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800">Complete Challenge</h2>
                <p className="mb-6 text-gray-700">{challengeText}</p>
                <textarea
                    ref={inputRef}
                    className="w-full p-3 mb-6 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#ff5f33] resize-none"
                    rows="4"
                    placeholder="Share what you did (e.g., link to the screenshot you captured, session ID you found the bug)"
                    value={proofText}
                    onChange={(e) => setProofText(e.target.value)}
                ></textarea>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-300 text-gray-800 font-bold rounded-xl
                                 hover:bg-gray-400 transition-colors duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(proofText)} // Pass proofText to onConfirm
                        className="px-6 py-3 bg-[#ff5f33] text-white font-bold rounded-xl
                                 hover:bg-[#e04a2c] transition-colors duration-200"
                    >
                        Confirm & Mark
                    </button>
                </div>
            </div>
        </div>
    );
};




// Main App Component
export default function App() {
    // User data states
    const [userName, setUserName] = useState('');


    // Game data states
    const [card, setCard] = useState([]);
    const [markedCells, setMarkedCells] = useState({}); // Now stores {index: proofText}
    const [bingoAchieved, setBingoAchieved] = useState(false);
    const [challengeWords, setChallengeWords] = useState([]); // Loaded from Google Sheet
    const [loadingChallenges, setLoadingChallenges] = useState(true);
    const [challengeError, setChallengeError] = useState(null);


    // UI states
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');
    const [showInstructions, setShowInstructions] = useState(false);


    // Proof Modal states
    const [showProofModal, setShowProofModal] = useState(false);
    const [currentModalCellIndex, setCurrentModalCellIndex] = useState(null);
    const [currentModalChallengeText, setCurrentModalChallengeText] = useState('');


    // Function to display messages
    const showMessage = useCallback((msg, type = 'info') => {
        setMessage(msg);
        setMessageType(type);
    }, []);


    // Function to hide messages
    const hideMessage = useCallback(() => {
        setMessage('');
    }, []);


    // Function to check for Bingo
    const checkBingo = useCallback((currentMarkedCellsMap) => {
        let foundBingo = false;
        // Check only for squares that have a proof (i.e., are truly marked)
        const activeMarkedIndices = new Set(Object.keys(currentMarkedCellsMap).map(Number));


        for (const pattern of winningPatterns) {
            const isBingo = pattern.every(index => activeMarkedIndices.has(index));
            if (isBingo) {
                foundBingo = true;
                break;
            }
        }
        setBingoAchieved(foundBingo);
        return foundBingo;
    }, []);


    // Effect for fetching challenge words from Google Sheet
    useEffect(() => {
        const fetchChallenges = async () => {
            try {
                setLoadingChallenges(true);
                setChallengeError(null);
                const response = await fetch(GOOGLE_SHEET_URL);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const text = await response.text();
                // Assuming CSV, one challenge per line in the first column
                const parsedWords = text.split('\n')
                                        .map(line => line.trim())
                                        .filter(line => line.length > 0 && !line.startsWith('#')); // Filter empty lines and comments


                if (parsedWords.length === 0) {
                    throw new Error("No challenges found in the Google Sheet. Please add content to Column A.");
                }
                setChallengeWords(parsedWords);
            } catch (error) {
                console.error("Failed to fetch challenge words:", error);
                setChallengeError(`Failed to load challenges. Please check the Google Sheet URL and ensure it's published to web as CSV. Error: ${error.message}`);
                // Fallback to a default if error occurs and no challenges loaded
                setChallengeWords(Array(16).fill("Error Loading Challenge")); // Provide default placeholders for 4x4
            } finally {
                setLoadingChallenges(false);
            }
        };
        if (GOOGLE_SHEET_URL && GOOGLE_SHEET_URL !== "YOUR_GOOGLE_SHEET_CSV_URL_HERE") {
             fetchChallenges();
        } else {
            setChallengeError("Please update GOOGLE_SHEET_URL in the code with your sheet's public CSV link.");
            setLoadingChallenges(false);
            setChallengeWords(Array(16).fill("CONFIGURE SHEET URL")); // Indicate setup needed for 4x4
        }
    }, []);


    // Effect for initial load: User Name, Card, and Marked Cells
    useEffect(() => {
        if (loadingChallenges || challengeError) return; // Wait until challenges are loaded or error displayed


        // Load user name
        const savedUserName = localStorage.getItem('bingoUserName');
        if (savedUserName) {
            setUserName(savedUserName);
        }


        // Load card and marked cells
        const savedCard = localStorage.getItem('bingoCard');
        const savedMarkedCells = localStorage.getItem('markedCells');


        let initialCard;
        let initialMarkedCells = {}; // Map of index to proof


        if (savedCard) {
            initialCard = JSON.parse(savedCard);
            if (savedMarkedCells) {
                initialMarkedCells = JSON.parse(savedMarkedCells);
            }
        } else {
            initialCard = generateBingoCard(challengeWords);
        }


        // Auto-mark "FREE SPACE" (index 7 for 4x4)
        const freeSpaceIndex = initialCard.indexOf("FREE SPACE");
        if (freeSpaceIndex !== -1 && !initialMarkedCells[freeSpaceIndex]) {
            initialMarkedCells[freeSpaceIndex] = "Auto-marked Free Space";
        }


        setCard(initialCard);
        setMarkedCells(initialMarkedCells);
        checkBingo(initialMarkedCells);
    }, [loadingChallenges, challengeError, challengeWords, checkBingo]);


    // Effect to save user name, marked cells, and card to local storage whenever they change
    useEffect(() => {
        localStorage.setItem('bingoUserName', userName); // Save user name
        if (card.length > 0 && challengeWords.length > 0) { // Ensure challenges are loaded before saving card
            localStorage.setItem('bingoCard', JSON.stringify(card));
            localStorage.setItem('markedCells', JSON.stringify(markedCells));
            checkBingo(markedCells); // Re-check bingo when cells change
        }
    }, [userName, markedCells, card, challengeWords, checkBingo]); // Dependencies


    // Handle user name input change
    const handleNameChange = useCallback((e) => {
        setUserName(e.target.value);
    }, []);


    // Handler for clicking a bingo cell (opens modal)
    const handleCellClick = useCallback((index) => {
        if (bingoAchieved) {
            // Optional: prevent further interaction if bingo is already achieved
            // showMessage("You've already achieved BINGO! 🎉", "info");
            return;
        }


        const isFreeSpace = card[index] === "FREE SPACE";


        if (isFreeSpace) {
            return; // Free space is automatically marked and cannot be unmarked manually
        }


        if (markedCells[index]) {
            // If already marked, show modal to view/edit proof or unmark
            setCurrentModalCellIndex(index);
            setCurrentModalChallengeText(card[index]);
            setShowProofModal(true); // Open modal to show proof
        } else {
            // If not marked, show proof modal to add new proof
            setCurrentModalCellIndex(index);
            setCurrentModalChallengeText(card[index]);
            setShowProofModal(true);
            hideMessage(); // Clear any existing messages
        }
    }, [bingoAchieved, card, markedCells, hideMessage]);


    // Handle confirmation from the proof modal
    const handleProofConfirm = useCallback((proofText) => {
        if (currentModalCellIndex !== null) {
            // Update the markedCells map with the index and proof
            setMarkedCells(prevMarkedCells => {
                const newMarkedCells = { ...prevMarkedCells };
                if (proofText.trim() !== '') { // Only mark if proof is provided
                    newMarkedCells[currentModalCellIndex] = proofText.trim();
                } else {
                    delete newMarkedCells[currentModalCellIndex]; // If proof cleared, unmark
                }
                return newMarkedCells;
            });
        }
        setShowProofModal(false);
        setCurrentModalCellIndex(null);
        setCurrentModalChallengeText('');
    }, [currentModalCellIndex]);


    // Handle cancellation from the proof modal
    const handleProofCancel = useCallback(() => {
        setShowProofModal(false);
        setCurrentModalCellIndex(null);
        setCurrentModalChallengeText('');
    }, []);


    // Handle Reset Card button
    const handleResetCard = useCallback(() => {
        if (window.confirm("Are you sure you want to reset your card? This will clear all your progress.")) {
            localStorage.removeItem('bingoCard');
            localStorage.removeItem('markedCells');
            localStorage.removeItem('bingoUserName'); // Optionally clear user name too
            setUserName('');
            setCard(generateBingoCard(challengeWords)); // Regenerate card
            setMarkedCells({}); // Clear marked cells
            setBingoAchieved(false);
            showMessage("Card reset successfully! A new challenge card has been generated.", "info");
        }
    }, [challengeWords, showMessage]);




    // Calculate marked squares count
    const markedSquaresCount = Object.keys(markedCells).length;


    // Determine cell border for visual proof cue
    const getCellBorderClass = useCallback((index) => {
        const isMarked = markedCells[index];
        const isFreeSpace = card[index] === "FREE SPACE";
        if (isFreeSpace) return ''; // Free space doesn't need proof prompt
        if (isMarked) return 'border-2 border-green-500'; // Marked with proof
        return 'border-2 border-transparent hover:border-gray-400'; // Unmarked, hint for proof
    }, [markedCells, card]);




    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-5 bg-[#ff5f33] font-sans">
            {/* Main container */}
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl flex flex-col gap-6 text-center">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
                    TAP In Bingo! {userName && <span className="block text-xl sm:text-2xl text-gray-600 mt-1">for {userName}</span>}
                </h1>


                {/* User Name Input */}
                <input
                    type="text"
                    placeholder="Enter your Name or Employee ID"
                    value={userName}
                    onChange={handleNameChange}
                    className="p-3 border-2 border-gray-300 rounded-lg text-center focus:outline-none focus:border-[#ff5f33] font-medium"
                />


                {/* Instructions Section */}
                <div className="text-left text-gray-700 bg-gray-50 p-4 rounded-lg shadow-sm">
                    <button
                        onClick={() => setShowInstructions(!showInstructions)}
                        className="w-full text-left font-bold text-lg text-gray-800 focus:outline-none flex justify-between items-center"
                    >
                        How to Play {showInstructions ? '▲' : '▼'}
                    </button>
                    {showInstructions && (
                        <div className="mt-3 text-sm leading-relaxed border-t pt-3 border-gray-200">
                            <p className="mb-2"><strong>How to Play:</strong></p>
                            <ol className="list-decimal list-inside ml-4">
                                <li className="mb-1"><strong>Complete the Task:</strong> First, perform the dogfooding activity shown on any unmarked square.</li>
                                <li className="mb-1"><strong>Mark Your Square:</strong> Click the square. In the pop-up, enter your proof (e.g., screenshot link, bug ID, or brief description).</li>
                                <li className="mb-1"><strong>Confirm:</strong> Click 'Confirm & Mark' to save your proof and mark the square.</li>
                                <li className="mb-1"><strong>To View/Edit/Undo Proof:</strong> Click a marked square to view/edit your proof. Clear the text and click 'Confirm & Mark' to unmark it.</li>
                            </ol>
                            <p className="mt-4 mb-2"><strong>How to Claim Bingo:</strong></p>
                            <ol className="list-decimal list-inside ml-4">
                                <li className="mb-1">When you complete a full row, column, or diagonal, you'll see a "BINGO!" celebration.</li>
                                <li className="mb-1">Screenshot your completed card (showing your name!) and Slack it to `#apac-commops-tap` to claim.</li>
                            </ol>
                            <p className="mt-4"><strong>Progress Saves:</strong> Your card progress automatically saves in your browser.</p>
                        </div>
                    )}
                </div>


                {/* Loading/Error Message for Challenges */}
                {loadingChallenges && (
                    <div className="text-center text-blue-600 font-semibold p-4 bg-blue-50 rounded-lg">
                        Loading challenges... Please wait.
                    </div>
                )}
                {challengeError && (
                    <div className="text-center text-red-700 font-semibold p-4 bg-red-100 border border-red-400 rounded-lg">
                        Error: {challengeError}
                    </div>
                )}


                {/* Marked Square Counter */}
                <div className="text-lg font-semibold text-gray-700">
                    Squares Completed: {markedSquaresCount}/{card.length}
                </div>


                {/* BINGO! Message (Now uses ConfettiOverlay) */}
                {bingoAchieved && <ConfettiOverlay show={bingoAchieved} />}
                <div id="bingoMessage" className={`text-5xl sm:text-6xl font-extrabold text-[#ff5f33] ${bingoAchieved ? 'block animate-bounce' : 'hidden'}`}>🎉 BINGO! 🎉</div>


                {/* Bingo Grid */}
                {!loadingChallenges && !challengeError && card.length > 0 ? (
                    <div className="grid grid-cols-4 gap-3 sm:gap-4 mt-5"> {/* Changed to grid-cols-4 */}
                        {card.map((word, index) => (
                            <div
                                key={index}
                                className={`
                                    flex items-center justify-center p-3 text-center
                                    min-h-[120px] sm:min-h-[140px] md:min-h-[160px] /* Consistent height for cells */
                                    rounded-xl cursor-pointer select-none transition-all duration-200 ease-in-out
                                    font-medium text-sm sm:text-base leading-normal break-words
                                    ${markedCells[index]
                                        ? (word === "FREE SPACE"
                                            ? 'bg-[#eeeeee] text-[#334155]' // Neutral bg for free space
                                            : 'bg-[#ffff66] text-black' // Marked color (yellow with black text)
                                          )
                                        : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] hover:shadow-md' // Unmarked, hover effect
                                    }
                                    ${bingoAchieved && winningPatterns.some(pattern => pattern.includes(index) && Object.keys(markedCells).map(Number).includes(index))
                                        ? 'bg-[#ff5f33] text-white animate-pulse' // Win highlight (orange with white text)
                                        : ''
                                    }
                                    ${getCellBorderClass(index)} /* Proof border */
                                `}
                                onClick={() => handleCellClick(index)}
                            >
                                {/* Conditional rendering for Free Space emoji or text */}
                                {word === "FREE SPACE" ? (
                                    <span className="text-4xl">
                                        🚀
                                    </span>
                                ) : (
                                    word
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    // Display fallback message if challenges are not loaded
                    <div className="text-center p-8 text-gray-500">
                        {loadingChallenges ? "Loading Bingo challenges..." : (challengeError || "No Bingo card available.")}
                    </div>
                )}


                {/* Reset Button */}
                <button
                    onClick={handleResetCard}
                    className="px-6 py-3 mt-4 bg-red-500 text-white font-bold rounded-xl
                               hover:bg-red-600 transition-colors duration-200 shadow-md"
                >
                    Reset Card
                </button>
            </div>


            {/* Proof Modal */}
            {showProofModal && (
                <ProofModal
                    show={showProofModal}
                    onClose={handleProofCancel}
                    onConfirm={handleProofConfirm}
                    challengeText={currentModalChallengeText}
                    initialProof={markedCells[currentModalCellIndex] || ''} // Pass existing proof for editing
                />
            )}
        </div>
    );
}