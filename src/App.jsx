import React, { useState, useEffect, useRef } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from 'react-simple-maps';
import { geoCentroid } from 'd3-geo';
import confetti from 'canvas-confetti';
import { STATE_DATA } from './data';
import { playCorrectSound, playIncorrectSound, playAnthem, setFocusMusicVolume, startFocusMusic, stopAnthem, stopFocusMusic } from './audio';
import { calculatePoints, generateMultipleChoice, isAnswerCorrect, sanitizePlayerName, shuffle } from './game/gameLogic';
import { DIFFICULTY_PROFILES, computeAchievements, getDueStates, getMasteryBand, getMistakeReviewStates, getProgressSummary, normalizeLearnerProfile, recordLearningAttempt, recordModeResult, selectLearningState } from './game/learningEngine';
import { areNeighbors, getNeighbors, journeyStates, shortestJourney } from './game/geography';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import Leaderboard from './components/Leaderboard';
import LearningProgress from './components/LearningProgress';
import ModeSelector from './components/ModeSelector';
import LearningHub from './components/LearningHub';
import StateDossier from './components/StateDossier';
import './index.css';

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";
const STATE_NAMES = Object.keys(STATE_DATA);

const REGION_VIEWS = {
  "West": { center: [-112, 38], zoom: 1.5 },
  "Midwest": { center: [-95, 38], zoom: 1.6 },
  "Northeast": { center: [-75, 40], zoom: 2.2 },
  "South": { center: [-88, 30], zoom: 1.6 }
};
const DEFAULT_VIEW = { center: [-96, 38], zoom: 1 };
const MOBILE_NORTHEAST_STATES = new Set([
  'Connecticut',
  'Delaware',
  'Massachusetts',
  'Maryland',
  'New Hampshire',
  'New Jersey',
  'Rhode Island',
  'Vermont'
]);
const COMPETITIVE_MODES = new Set(['CLASSIC', 'TIME_ATTACK', 'REVERSE', 'CAPITALS', 'TRIVIA', 'FLAGS', 'MIXED']);

const celebrate = (options) => {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  confetti(options);
};

const GAME_MODES = {
  CLASSIC: { id: 'CLASSIC', title: 'Classic', desc: 'Find the state on the map.' },
  TIME_ATTACK: { id: 'TIME_ATTACK', title: 'Time Attack', desc: '60 seconds. Go fast!' },
  ADAPTIVE: { id: 'ADAPTIVE', title: 'Smart Review', desc: 'Spaced repetition prioritizes what is due and weak.' },
  MISTAKES: { id: 'MISTAKES', title: 'Mistake Review', desc: 'Practice states you have missed before.' },
  NEIGHBORS: { id: 'NEIGHBORS', title: 'Neighbor Challenge', desc: 'Find a state that shares a land border.' },
  JOURNEY: { id: 'JOURNEY', title: 'USA Journey', desc: 'Travel state-to-state using only land borders.' },
  MIXED: { id: 'MIXED', title: 'Mixed Challenge', desc: 'States, capitals, flags, regions, and abbreviations.' },
  REVERSE: { id: 'REVERSE', title: 'Reverse', desc: 'Map highlights a state. Pick its name.' },
  CAPITALS: { id: 'CAPITALS', title: 'Capitals', desc: 'Find the state by its Capital.' },
  TRIVIA: { id: 'TRIVIA', title: 'Trivia', desc: 'State is highlighted. Answer a fact!' },
  FLAGS: { id: 'FLAGS', title: 'Flags Game', desc: 'Identify the state by its flag! 🚩' },
  STUDY: { id: 'STUDY', title: 'Study Guide', desc: 'Relax, click around, and learn! 📚' },
  REGIONS: { id: 'REGIONS', title: 'Region Explorer', desc: 'Click to learn about US regions! 🧭' }
};

const BADGES = [
  { id: 'classic', icon: '🗺️', label: 'Classic Explorer (Score 200+)' },
  { id: 'speedster', icon: '⏱️', label: 'Speedster (Time Attack 200+)' },
  { id: 'geographer', icon: '📍', label: 'Geographer (Reverse 200+)' },
  { id: 'president', icon: '🏛️', label: 'President (Capitals 200+)' },
  { id: 'brainiac', icon: '🧠', label: 'Brainiac (Trivia 200+)' },
  { id: 'vexillologist', icon: '🚩', label: 'Vexillologist (Flags 200+)' }
];

function App() {
  const [playerName, setPlayerName] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [mode, setMode] = useState(GAME_MODES.CLASSIC.id);
  
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(60);
  
  const [targetState, setTargetState] = useState("");
  const [options, setOptions] = useState([]);
  const [triviaQuestion, setTriviaQuestion] = useState("");
  
  const [guessedStates, setGuessedStates] = useState({});
  const [gameOver, setGameOver] = useState(false);
  
  const [currentFact, setCurrentFact] = useState(null);
  
  const [floatingTexts, setFloatingTexts] = useState([]); // Array of floating text objects

  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [studyData, setStudyData] = useState(null); // Advanced Study Guide Data
  const [mapView, setMapView] = useState(DEFAULT_VIEW);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [learnerProfile, setLearnerProfile] = useState(() => normalizeLearnerProfile({}, STATE_NAMES));
  const [records, setRecords] = useState({});
  const [difficulty, setDifficulty] = useState('INTERMEDIATE');
  const [classroom, setClassroom] = useState({ enabled: false, className: '' });
  const [online, setOnline] = useState(() => navigator.onLine);
  const [sessionStats, setSessionStats] = useState({ attempts: 0, correct: 0, bestStreak: 0, mistakes: {} });
  const [dossierState, setDossierState] = useState(null);
  const [challengeVariant, setChallengeVariant] = useState('STATE');
  const [journey, setJourney] = useState({ path: [], index: 0, start: '', destination: '' });
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [focusVolume, setFocusVolume] = useState(0.34);
  const [victoryCelebration, setVictoryCelebration] = useState(false);

  const timerRef = useRef(null);
  const victoryTimeoutRef = useRef(null);
  const scoreRef = useRef(0);
  const sessionStatsRef = useRef(sessionStats);

  const mastery = Object.fromEntries(
    STATE_NAMES.map((state) => [state, learnerProfile.states[state]?.mastery || 0])
  );

  const fetchLeaderboard = async () => {
    try {
      const q = query(collection(db, "usa-map-leaderboard"), orderBy("score", "desc"), limit(5));
      const querySnapshot = await getDocs(q);
      const scores = [];
      querySnapshot.forEach((doc) => {
        scores.push({ id: doc.id, ...doc.data() });
      });
      setLeaderboard(scores);
    } catch (e) {
      console.log("Firebase not configured yet");
    }
  };

  useEffect(() => {
    // If the event fired before React loaded, it's saved here
    if (window.globalInstallPrompt) {
      setInstallPrompt(window.globalInstallPrompt);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.globalInstallPrompt = e;
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const savedHighScore = localStorage.getItem("usaMapHighScore");
    if (savedHighScore) setHighScore(parseInt(savedHighScore, 10));
    
    const savedBadges = JSON.parse(localStorage.getItem("usaMapBadges") || "[]");
    setUnlockedBadges(savedBadges);

    const savedMastery = JSON.parse(localStorage.getItem("usaMapMastery") || "{}");
    const savedLearner = JSON.parse(localStorage.getItem("usaMapLearnerProfile") || "{}");
    setLearnerProfile(normalizeLearnerProfile(savedLearner, STATE_NAMES, savedMastery));

    const savedRecords = JSON.parse(localStorage.getItem("usaMapModeRecords") || "{}");
    setRecords(savedRecords);

    const savedDifficulty = localStorage.getItem("usaMapDifficulty");
    if (DIFFICULTY_PROFILES[savedDifficulty]) setDifficulty(savedDifficulty);

    const savedClassroom = JSON.parse(localStorage.getItem("usaMapClassroom") || "null");
    if (savedClassroom) setClassroom(savedClassroom);

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const savedMusicPreference = localStorage.getItem("usaMapMusic");
    if (savedMusicPreference === "off") setMusicEnabled(false);

    const savedFocusVolume = Number(localStorage.getItem("usaMapMusicVolume"));
    if (Number.isFinite(savedFocusVolume) && savedFocusVolume >= 0 && savedFocusVolume <= 1) {
      setFocusVolume(savedFocusVolume);
      setFocusMusicVolume(savedFocusVolume);
    }

    fetchLeaderboard();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (victoryTimeoutRef.current) clearTimeout(victoryTimeoutRef.current);
      stopFocusMusic();
      stopAnthem();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    sessionStatsRef.current = sessionStats;
  }, [sessionStats]);

  useEffect(() => {
    scoreRef.current = score;
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("usaMapHighScore", score);
    }
    checkBadges(score, mode);
  }, [score, highScore, mode]);

  useEffect(() => {
    if (gameStarted && !gameOver && !currentFact && mode === 'TIME_ATTACK') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            triggerGameOver(scoreRef.current, true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameStarted, gameOver, currentFact, mode]);

  useEffect(() => {
    if (!gameStarted || mode === 'REGIONS' || mode === 'STUDY') return;

    const isMobile = window.matchMedia?.('(max-width: 768px)').matches;
    if (isMobile && MOBILE_NORTHEAST_STATES.has(targetState)) {
      setMapView(REGION_VIEWS.Northeast);
    } else {
      setMapView(DEFAULT_VIEW);
    }
  }, [gameStarted, mode, targetState]);

  const checkBadges = (currentScore, currentMode) => {
    if (currentScore >= 200) {
      let badgeId = '';
      if (currentMode === 'CLASSIC') badgeId = 'classic';
      if (currentMode === 'TIME_ATTACK') badgeId = 'speedster';
      if (currentMode === 'REVERSE') badgeId = 'geographer';
      if (currentMode === 'CAPITALS') badgeId = 'president';
      if (currentMode === 'TRIVIA') badgeId = 'brainiac';
      if (currentMode === 'FLAGS') badgeId = 'vexillologist';
      
      if (badgeId && !unlockedBadges.includes(badgeId)) {
        const newBadges = [...unlockedBadges, badgeId];
        setUnlockedBadges(newBadges);
        localStorage.setItem("usaMapBadges", JSON.stringify(newBadges));
        celebrate({ particleCount: 150, spread: 80, origin: { y: 0.3 }, colors: ['#facc15'] });
      }
    }
  };

  const startGame = () => {
    const finalName = sanitizePlayerName(playerName);
    const level = DIFFICULTY_PROFILES[difficulty];
    setPlayerName(finalName);
    setGameStarted(true);
    setScore(0);
    setStreak(0);
    setLives(level.lives);
    setTimeLeft(level.time);
    setGuessedStates({});
    setGameOver(false);
    setStudyData(null);
    setMapView(DEFAULT_VIEW);
    setCorrectAnswer(null);
    setStatusMessage("");
    setSessionStats({ attempts: 0, correct: 0, bestStreak: 0, mistakes: {} });
    sessionStatsRef.current = { attempts: 0, correct: 0, bestStreak: 0, mistakes: {} };
    setJourney({ path: [], index: 0, start: '', destination: '' });
    setVictoryCelebration(false);
    stopAnthem();
    if (musicEnabled) startFocusMusic(focusVolume);

    if (mode === 'JOURNEY') {
      const candidates = journeyStates();
      const start = candidates[Math.floor(Math.random() * candidates.length)];
      let destination = candidates[Math.floor(Math.random() * candidates.length)];
      let path = shortestJourney(start, destination);
      while ((destination === start || path.length < 4) && candidates.length > 1) {
        destination = candidates[Math.floor(Math.random() * candidates.length)];
        path = shortestJourney(start, destination);
      }
      setJourney({ path, index: 0, start, destination });
      setTargetState(start);
      setCorrectAnswer(path[1] || destination);
      setGuessedStates({ [start]: 'correct' });
      setStatusMessage('Journey started. Move through neighboring states.');
      return;
    }

    pickNewTarget({});
  };

  const saveToLeaderboard = async (finalScore) => {
    if (classroom.enabled || !COMPETITIVE_MODES.has(mode)) return;

    if (finalScore > 0 && playerName) {
      try {
        await addDoc(collection(db, "usa-map-leaderboard"), {
          name: sanitizePlayerName(playerName),
          score: finalScore,
          mode: mode,
          date: new Date().toISOString()
        });
        fetchLeaderboard();
      } catch (e) {
        console.log("Firebase error:", e);
      }
    }
  };

  const triggerGameOver = (finalScore, completed = false) => {
    if (victoryTimeoutRef.current) {
      clearTimeout(victoryTimeoutRef.current);
      victoryTimeoutRef.current = null;
    }
    stopFocusMusic();
    stopAnthem();
    setVictoryCelebration(false);
    setGameOver(true);

    const stats = sessionStatsRef.current;
    const accuracy = stats.attempts ? Math.round(stats.correct / stats.attempts * 100) : 0;
    setRecords((previous) => {
      const next = recordModeResult(previous, mode, {
        score: finalScore,
        accuracy,
        bestStreak: stats.bestStreak,
        completed,
      });
      localStorage.setItem("usaMapModeRecords", JSON.stringify(next));
      return next;
    });

    saveToLeaderboard(finalScore);
  };

  const finishVictoryCelebration = () => {
    if (victoryTimeoutRef.current) {
      clearTimeout(victoryTimeoutRef.current);
      victoryTimeoutRef.current = null;
    }
    stopAnthem();
    setVictoryCelebration(false);
    triggerGameOver(scoreRef.current, true);
  };

  const toggleMusic = () => {
    const nextEnabled = !musicEnabled;
    setMusicEnabled(nextEnabled);
    localStorage.setItem("usaMapMusic", nextEnabled ? "on" : "off");

    if (!nextEnabled) {
      stopFocusMusic();
      stopAnthem();
      return;
    }

    if (gameStarted && !gameOver && victoryCelebration) {
      playAnthem({
        onEnded: () => triggerGameOver(scoreRef.current, true),
        onError: () => {
          victoryTimeoutRef.current = window.setTimeout(
            () => triggerGameOver(scoreRef.current, true),
            5000
          );
        }
      });
      return;
    }

    if (gameStarted && !gameOver) {
      startFocusMusic(focusVolume);
    }
  };

  const handleDifficultyChange = (nextDifficulty) => {
    setDifficulty(nextDifficulty);
    localStorage.setItem("usaMapDifficulty", nextDifficulty);
  };

  const handleClassroomChange = (nextClassroom) => {
    setClassroom(nextClassroom);
    localStorage.setItem("usaMapClassroom", JSON.stringify(nextClassroom));
  };

  const handleFocusVolumeChange = (event) => {
    const nextVolume = Number(event.target.value);
    setFocusVolume(nextVolume);
    setFocusMusicVolume(nextVolume);
    localStorage.setItem("usaMapMusicVolume", String(nextVolume));

    if (musicEnabled) {
      startFocusMusic(nextVolume);
    }
  };

  const returnHome = () => {
    if (victoryTimeoutRef.current) {
      clearTimeout(victoryTimeoutRef.current);
      victoryTimeoutRef.current = null;
    }
    stopFocusMusic();
    stopAnthem();
    setVictoryCelebration(false);
    setGameStarted(false);
  };

  const pickNewTarget = (currentGuessed) => {
    if (mode === 'STUDY') {
      setTargetState("Click any state to learn! 📚");
      return;
    }

    if (mode === 'REGIONS') {
      setTargetState("Click a state to explore its Region! 🧭");
      return;
    }

    const mistakeStates = getMistakeReviewStates(learnerProfile);
    const reviewPool = mistakeStates.length ? mistakeStates : getDueStates(learnerProfile, STATE_NAMES);
    const eligibleStates = mode === 'NEIGHBORS'
      ? STATE_NAMES.filter((state) => getNeighbors(state).length > 0)
      : mode === 'MISTAKES'
        ? reviewPool
        : STATE_NAMES;
    const remaining = mode === 'ADAPTIVE'
      ? eligibleStates.filter((state) => state !== targetState)
      : eligibleStates.filter((state) => currentGuessed[state] !== "correct");

    if (mode !== 'ADAPTIVE' && remaining.length === 0) {
      if (mode === 'MISTAKES' || mode === 'NEIGHBORS') {
        setTargetState("You Win!");
        celebrate({ particleCount: 180, spread: 100, origin: { y: 0.5 } });
        window.setTimeout(() => triggerGameOver(scoreRef.current, true), 1200);
        return;
      }

      setTargetState("You Win!");
      setVictoryCelebration(true);
      stopFocusMusic();

      if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        const duration = 6 * 1000;
        const animationEnd = Date.now() + duration;
        const interval = setInterval(function() {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) {
            return clearInterval(interval);
          }
          const particleCount = 45 * (timeLeft / duration);
          celebrate({
            startVelocity: 26,
            spread: 360,
            ticks: 60,
            zIndex: 0,
            particleCount,
            origin: { x: Math.random(), y: Math.random() - 0.2 }
          });
        }, 300);
      }

      if (musicEnabled) {
        playAnthem({
          onEnded: () => triggerGameOver(scoreRef.current, true),
          onError: () => {
            victoryTimeoutRef.current = window.setTimeout(
              () => triggerGameOver(scoreRef.current, true),
              5000
            );
          }
        });
      }

      return;
    }
    const randomState = mode === 'ADAPTIVE'
      ? selectLearningState(remaining, learnerProfile)
      : remaining[Math.floor(Math.random() * remaining.length)];
    setTargetState(randomState);

    if (mode === 'MIXED') {
      const variants = ['STATE', 'CAPITAL', 'FLAG', 'ABBREVIATION', 'REGION'];
      const variant = variants[Math.floor(Math.random() * variants.length)];
      setChallengeVariant(variant);
      if (variant === 'FLAG') {
        setCorrectAnswer(randomState);
        setOptions(generateMultipleChoice(randomState, 'name', STATE_DATA));
      } else if (variant === 'REGION') {
        setCorrectAnswer(STATE_DATA[randomState].region);
        setOptions(shuffle(['West', 'Midwest', 'South', 'Northeast']));
      } else {
        setCorrectAnswer(randomState);
        setOptions([]);
      }
    } else if (mode === 'REVERSE') {
      setCorrectAnswer(randomState);
      setOptions(generateMultipleChoice(randomState, 'name', STATE_DATA));
    } else if (mode === 'FLAGS') {
      setCorrectAnswer(randomState);
      setOptions(generateMultipleChoice(randomState, 'name', STATE_DATA));
    } else if (mode === 'TRIVIA') {
      const types = ['population', 'area', 'capital'];
      const questionType = types[Math.floor(Math.random() * types.length)];
      const answer = STATE_DATA[randomState][questionType];
      setCorrectAnswer(answer);
      setTriviaQuestion(`What is the ${questionType} of this state?`);
      setOptions(generateMultipleChoice(answer, questionType, STATE_DATA));
    }
  };

  const handleGuess = (guess) => {
    if (gameOver || currentFact || !gameStarted) return;

    if (mode === 'TRIVIA' || mode === 'MIXED') {
      processAnswer(guess === correctAnswer, targetState, null);
      return;
    }

    if (mode === 'REVERSE' || mode === 'FLAGS') {
      processAnswer(isAnswerCorrect({ mode, guess, targetState, correctAnswer }), targetState, null);
      return;
    }

    processAnswer(guess === targetState, targetState, null);
  };

  const handleGuessMap = (guess, evt) => {
    if (gameOver || currentFact || !gameStarted) return;
    processAnswer(guess === targetState, targetState, evt, guess);
  };

  const handleMapClickFinal = (geo, evt) => {
    if (gameOver || currentFact || !gameStarted) return;
    const stateName = geo.properties.name;

    if (mode === 'STUDY') {
      if (STATE_NAMES.includes(stateName)) {
        setTargetState(stateName);
        setDossierState(stateName);
      }
      return;
    }

    if (mode === 'JOURNEY') {
      const nextState = journey.path[journey.index + 1];
      if (!nextState) return;
      const isCorrectStep = stateName === nextState;
      const currentState = journey.path[journey.index];
      if (!isCorrectStep) {
        playIncorrectSound();
        setStatusMessage(stateName + ' is not the next state on this route. From ' + currentState + ', look for the highlighted shortest-path neighbor.');
        setLives((previous) => {
          const nextLives = previous - 1;
          if (nextLives <= 0) triggerGameOver(scoreRef.current, false);
          return nextLives;
        });
        setSessionStats((previous) => ({
          ...previous,
          attempts: previous.attempts + 1,
          mistakes: { ...previous.mistakes, [currentState]: (previous.mistakes[currentState] || 0) + 1 },
        }));
        return;
      }

      playCorrectSound();
      const nextIndex = journey.index + 1;
      const reachedDestination = nextIndex === journey.path.length - 1;
      const newStreak = streak + 1;
      const points = Math.round(calculatePoints(newStreak) * DIFFICULTY_PROFILES[difficulty].scoreMultiplier);
      setScore((previous) => previous + points);
      setStreak(newStreak);
      setGuessedStates((previous) => ({ ...previous, [stateName]: 'correct' }));
      setSessionStats((previous) => ({
        ...previous,
        attempts: previous.attempts + 1,
        correct: previous.correct + 1,
        bestStreak: Math.max(previous.bestStreak, newStreak),
      }));
      setLearnerProfile((previous) => {
        const next = recordLearningAttempt(previous, stateName, true);
        localStorage.setItem("usaMapLearnerProfile", JSON.stringify(next));
        return next;
      });

      if (reachedDestination) {
        setJourney((previous) => ({ ...previous, index: nextIndex }));
        setTargetState('Journey Complete!');
        setStatusMessage('Journey complete: ' + journey.start + ' to ' + journey.destination + '.');
        celebrate({ particleCount: 200, spread: 110, origin: { y: 0.55 } });
        window.setTimeout(() => triggerGameOver(scoreRef.current + points, true), 1200);
      } else {
        setJourney((previous) => ({ ...previous, index: nextIndex }));
        setTargetState(stateName);
        setCorrectAnswer(journey.path[nextIndex + 1]);
        setStatusMessage('Good move. Continue toward ' + journey.destination + '.');
      }
      return;
    }

    if (mode === 'REGIONS') {
      if (STATE_NAMES.includes(stateName)) {
        const region = STATE_DATA[stateName].region;
        // Highlight all states in this region
        const newGuessed = {};
        const regionStates = [];
        Object.entries(STATE_DATA).forEach(([name, data]) => {
          if (data.region === region) {
            newGuessed[name] = 'correct';
            regionStates.push(name);
          }
        });
        setGuessedStates(newGuessed);
        if (REGION_VIEWS[region]) {
          setMapView(REGION_VIEWS[region]);
        }
        
        setStudyData({
          stateName: `${region} Region`,
          extract: `States in this region: ${regionStates.join(', ')}`,
          thumbnail: null,
          url: `https://www.google.com/search?q=US+Census+Bureau+${region}+Region+site:.gov`
        });
      }
      return;
    }

    if (mode === 'NEIGHBORS') {
      processAnswer(areNeighbors(targetState, stateName), targetState, evt, stateName);
      return;
    }

    if (mode === 'MIXED' && (challengeVariant === 'FLAG' || challengeVariant === 'REGION')) return;
    if (mode === 'REVERSE' || mode === 'FLAGS' || mode === 'TRIVIA') return;
    
    if ((mode !== 'ADAPTIVE' && mode !== 'MISTAKES' && guessedStates[stateName] === "correct") || !STATE_NAMES.includes(stateName)) return;

    handleGuessMap(stateName, evt);
  };

  const processAnswer = (isCorrect, stateName, evt, guessedState = stateName) => {
    if (STATE_DATA[stateName]) {
      setLearnerProfile((previous) => {
        const next = recordLearningAttempt(previous, stateName, isCorrect);
        localStorage.setItem("usaMapLearnerProfile", JSON.stringify(next));
        return next;
      });
    }

    setSessionStats((previous) => {
      const next = {
        ...previous,
        attempts: previous.attempts + 1,
        correct: previous.correct + (isCorrect ? 1 : 0),
        mistakes: isCorrect
          ? previous.mistakes
          : { ...previous.mistakes, [stateName]: (previous.mistakes[stateName] || 0) + 1 },
      };
      sessionStatsRef.current = next;
      return next;
    });

    if (isCorrect) {
      playCorrectSound();
      setStatusMessage(`Correct. ${stateName}.`);
      const newGuessed = { ...guessedStates, [stateName]: "correct" };
      setGuessedStates(newGuessed);
      
      const newStreak = streak + 1;
      setStreak(newStreak);
      setSessionStats((previous) => {
        const next = { ...previous, bestStreak: Math.max(previous.bestStreak, newStreak) };
        sessionStatsRef.current = next;
        return next;
      });
      
      const points = Math.round(calculatePoints(newStreak) * DIFFICULTY_PROFILES[difficulty].scoreMultiplier);
      const newScore = score + points;
      setScore(newScore);
      if (mode === 'TIME_ATTACK') setTimeLeft(prev => prev + 2);
      
      // Floating Combo Text
      if (evt && evt.clientX) {
        const id = Date.now();
        const x = evt.clientX;
        const y = evt.clientY - 20;
        setFloatingTexts(prev => [...prev, { id, text: `+${points}`, combo: newStreak >= 3 ? newStreak : null, x, y }]);
        setTimeout(() => setFloatingTexts(prev => prev.filter(f => f.id !== id)), 1500);
      }
      
      celebrate({
        particleCount: Math.min(180, 50 + (newStreak * 10)),
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#22c55e', '#ffffff', '#3b82f6', '#facc15']
      });

      setCurrentFact({
        state: stateName,
        text: STATE_DATA[stateName].fact,
        pointsEarned: points
      });

    } else {
      playIncorrectSound();
      setStatusMessage("Incorrect. Try again.");
      setStreak(0);
      setGuessedStates(prev => ({ ...prev, [guessedState]: "incorrect" }));
      
      if (mode === 'TIME_ATTACK') {
        setTimeLeft(prev => Math.max(0, prev - 5));
      } else {
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) triggerGameOver(score);
          return newLives;
        });
      }

      setTimeout(() => {
        setGuessedStates(prev => {
          const updated = { ...prev };
          if (updated[guessedState] === "incorrect") delete updated[guessedState];
          return updated;
        });
      }, 800);
    }
  };

  const closeFactAndNext = () => {
    setCurrentFact(null);

    if (mode === 'ADAPTIVE' || mode === 'MISTAKES') {
      setGuessedStates({});
      pickNewTarget({});
      return;
    }

    pickNewTarget(guessedStates);
  };

  const handleInstallClick = async () => {
    if (!installPrompt) {
      setShowInstallGuide(true);
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const progressSummary = getProgressSummary(learnerProfile);
  const masteredCount = progressSummary.mastered;
  const overallMastery = progressSummary.mastery;
  const dueStates = getDueStates(learnerProfile, STATE_NAMES);
  const mistakeReviewStates = getMistakeReviewStates(learnerProfile);
  const achievements = computeAchievements(learnerProfile, records);
  const sessionAccuracy = sessionStats.attempts ? Math.round(sessionStats.correct / sessionStats.attempts * 100) : 0;

  return (
    <div className="game-wrapper" style={{ width: '100vw', height: '100vh' }}>
      {!gameStarted ? (
        <div className="game-container" style={{ justifyContent: 'center' }}>
          <button className="icon-btn about-btn" onClick={() => setShowAbout(true)} title="About USA State Explorer" style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 100 }}>
            ℹ️
          </button>
          <button
            className="icon-btn music-toggle"
            onClick={toggleMusic}
            title={musicEnabled ? "Turn off classical focus music" : "Turn on classical focus music"}
            aria-pressed={musicEnabled}
            aria-label={musicEnabled ? "Classical focus music on" : "Classical focus music off"}
          >
            {musicEnabled ? "🎼" : "🔇"}
          </button>

          {showAbout && (
            <div className="overlay" style={{ zIndex: 2000 }}>
              <div className="glass-panel modal" role="dialog" aria-modal="true" style={{ maxWidth: '500px' }}>
                <h2 className="title" style={{ fontSize: '2rem', marginBottom: '1rem' }}>About</h2>
                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '1.1rem', lineHeight: '1.5' }}>
                  <div><strong>Author:</strong> Massinissa TINOUCHE</div>
                  <div><strong>Address:</strong> San Jose, CA USA</div>
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', borderLeft: '4px solid var(--accent-blue)' }}>
                    <strong>USA State Explorer</strong> is an interactive educational PWA designed to help students learn about the 50 US states, their flags, capitals, and geographic regions. Bach's <em>Air on the G String</em>, performed by the U.S. Air Force Strings, provides a calm focus soundtrack. Completing all 50 states unlocks a flag-map ceremony with <em>The Star-Spangled Banner</em>.
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Focus music: U.S. Air Force Strings. Victory anthem: United States Navy Band. Both recordings are public-domain U.S. federal government works.
                  </div>
                </div>
                <button className="btn-primary" onClick={() => setShowAbout(false)} style={{ marginTop: '2rem' }}>
                  Close
                </button>
              </div>
            </div>
          )}

          {showInstallGuide && (
            <div className="overlay" style={{ zIndex: 2000 }}>
              <div className="glass-panel modal" role="dialog" aria-modal="true" style={{ maxWidth: '400px', textAlign: 'left' }}>
                <h2 className="title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>How to Install</h2>
                <p style={{ marginBottom: '1rem', lineHeight: '1.5' }}>
                  Your browser doesn't support automatic installation. To install this app:
                </p>
                <ul style={{ marginBottom: '1.5rem', paddingLeft: '1.5rem', lineHeight: '1.5' }}>
                  <li><strong>iPhone / iPad (Safari):</strong> Tap the <strong>Share</strong> button at the bottom of the screen, then tap <strong>Add to Home Screen</strong>.</li>
                  <li><strong>Android (Firefox):</strong> Tap the three dots menu, then tap <strong>Install</strong>.</li>
                  <li><strong>Desktop:</strong> Look for the install icon 💻 in your URL bar!</li>
                </ul>
                <button className="btn-primary" onClick={() => setShowInstallGuide(false)}>Got it!</button>
              </div>
            </div>
          )}

        <main className="glass-panel modal">
          <div className="mascot">🦅</div>
          <h1 className="title">USA State Explorer</h1>
          
          <input 
            type="text" 
            className="player-input" 
            placeholder="Enter your name..." 
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={24}
            aria-label="Player name"
          />

          <h3 style={{ marginTop: '0.5rem' }}>Select Game Mode</h3>
          <ModeSelector modes={GAME_MODES} value={mode} onChange={setMode} />

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn-primary" onClick={startGame}>
              Let's Play! 🚀
            </button>
            
            <button className="btn-primary" style={{ background: '#10b981' }} onClick={handleInstallClick}>
              Install App 📲
            </button>
          </div>

          <LearningHub
            difficulty={difficulty}
            onDifficultyChange={handleDifficultyChange}
            summary={progressSummary}
            dueCount={dueStates.length}
            mistakeCount={mistakeReviewStates.length}
            achievements={achievements}
            records={records}
            classroom={classroom}
            onClassroomChange={handleClassroomChange}
            focusVolume={focusVolume}
            onVolumeChange={handleFocusVolumeChange}
            online={online}
          />

          <div className="badges-container">
            {BADGES.map(b => (
              <div key={b.id} className={`badge ${unlockedBadges.includes(b.id) ? 'unlocked' : ''}`} title={b.label}>
                {b.icon}
              </div>
            ))}
          </div>

          <LearningProgress percent={overallMastery} mastered={masteredCount} />

          <Leaderboard entries={leaderboard} showMode />
        </main>
      </div>
      ) : (
      <div className="game-container">
        <button className="icon-btn home-btn" onClick={returnHome} title="Back to Menu">
          🏠
        </button>
        <button
          className="icon-btn music-toggle"
          onClick={toggleMusic}
          title={musicEnabled ? "Turn off classical focus music" : "Turn on classical focus music"}
          aria-pressed={musicEnabled}
          aria-label={musicEnabled ? "Classical focus music on" : "Classical focus music off"}
        >
          {musicEnabled ? "🎼" : "🔇"}
        </button>
      <div className="header">
        <div className="title-container">
          <span className="mascot">🦅</span>
          <h1 className="title" style={{ fontSize: '2.5rem' }}>{playerName}'s Challenge!</h1>
        </div>
        
        <div className="glass-panel" style={{ padding: '0.5rem', gap: '1rem' }}>
          <div className="stat-box">
            <span className="stat-label">Score</span>
            <span className="stat-value">⭐ {score}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Streak</span>
            <span className={`stat-value ${streak >= 3 ? 'streak-text' : ''}`}>🔥 x{streak}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">{mode === 'TIME_ATTACK' ? 'Time' : 'Lives'}</span>
            <span className={`stat-value ${mode === 'TIME_ATTACK' && timeLeft <= 10 ? 'streak-text' : ''}`} style={mode==='TIME_ATTACK' && timeLeft<=10 ? {color:'#ef4444'}:{}}>
              {mode === 'TIME_ATTACK' ? `${timeLeft}s ⏳` : "❤️".repeat(Math.max(0, lives))}
            </span>
          </div>
        </div>

        {!gameOver && !currentFact && !victoryCelebration && (
          <div className="target-state-display" aria-live="polite">
            <span className="target-label">
              {mode === 'JOURNEY' ? "Travel using the next neighboring state toward:" :
               mode === 'NEIGHBORS' ? "Find any state that borders:" :
               mode === 'MISTAKES' ? "Review this state:" :
               mode === 'MIXED' && challengeVariant === 'CAPITAL' ? "Find the state whose capital is:" :
               mode === 'MIXED' && challengeVariant === 'FLAG' ? "Which state owns this flag?" :
               mode === 'MIXED' && challengeVariant === 'ABBREVIATION' ? "Find the state with abbreviation:" :
               mode === 'MIXED' && challengeVariant === 'REGION' ? "Which region contains the highlighted state?" :
               mode === 'MIXED' ? "Mixed challenge — find:" :
               mode === 'CAPITALS' ? "Find the state where the capital is:" : 
               mode === 'REVERSE' ? "What state is highlighted on the map?" :
               mode === 'FLAGS' ? "Which state does this flag belong to?" :
               mode === 'TRIVIA' ? triviaQuestion :
               mode === 'STUDY' ? "Study Guide Mode Active" :
               mode === 'ADAPTIVE' ? "Adaptive practice — find..." :
               "Can you find..."}
            </span>
            <div className="target-name" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {(mode === 'FLAGS' || (mode === 'MIXED' && challengeVariant === 'FLAG')) && targetState && STATE_DATA[targetState] && (
                <img src={`https://flagcdn.com/w160/us-${STATE_DATA[targetState].code}.png`} alt={`${targetState} flag`} style={{ width: '120px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }} />
              )}
              {targetState && STATE_DATA[targetState] && mode !== 'REVERSE' && mode !== 'TRIVIA' && mode !== 'CAPITALS' && mode !== 'FLAGS' && mode !== 'STUDY' && mode !== 'REGIONS' && (
                <img src={`https://flagcdn.com/w80/us-${STATE_DATA[targetState].code}.png`} alt={`${targetState} flag`} style={{ width: '50px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)' }} />
              )}
              {mode === 'JOURNEY' ? journey.destination :
               mode === 'CAPITALS' || (mode === 'MIXED' && challengeVariant === 'CAPITAL') ? STATE_DATA[targetState]?.capital :
               mode === 'MIXED' && challengeVariant === 'ABBREVIATION' ? STATE_DATA[targetState]?.code.toUpperCase() :
               mode === 'REVERSE' || mode === 'TRIVIA' || mode === 'FLAGS' || (mode === 'MIXED' && ['FLAG', 'REGION'].includes(challengeVariant)) ? "???" :
               targetState}
            </div>
            {(mode === 'ADAPTIVE' || mode === 'MISTAKES') && STATE_DATA[targetState] && (
              <div style={{ marginTop: '0.6rem', color: '#94a3b8', fontSize: '0.95rem' }}>
                Mastery: {Math.round((mastery[targetState] ?? 0) * 100)}% · {learnerProfile.states[targetState]?.mistakes || 0} previous mistakes
              </div>
            )}
          </div>
        )}
      </div>

      <div className="sr-only" aria-live="assertive" aria-atomic="true">{statusMessage}</div>
      <div className="map-container">
        <ComposableMap projection="geoAlbersUsa" className="main-map-svg">
          <defs>
            <pattern id="us-flag" patternUnits="userSpaceOnUse" width="1000" height="600">
              <image href="https://flagcdn.com/w1280/us.png" x="0" y="0" width="1000" height="600" preserveAspectRatio="xMidYMid slice" />
            </pattern>
          </defs>
          <ZoomableGroup className="rsm-zoomable-group" zoom={mapView.zoom} center={mapView.center}>
            <Geographies geography={geoUrl}>
              {({ geographies }) => (
                <>
                  {geographies.map((geo) => {
                    const stateName = geo.properties.name;
                    const status = guessedStates[stateName];
                    let className = "state-path";
                    
                    if (status === "correct" && mode !== 'REGIONS') className += " correct";
                    if (status === "incorrect") className += " incorrect";
                    
                    if (mode === 'REGIONS' && STATE_DATA[stateName]) {
                      const region = STATE_DATA[stateName].region;
                      if (region === 'West') className += " region-west";
                      if (region === 'Midwest') className += " region-midwest";
                      if (region === 'South') className += " region-south";
                      if (region === 'Northeast') className += " region-northeast";
                      
                      // Highlight effect when a region is actively selected
                      const isAnySelected = Object.keys(guessedStates).length > 0;
                      if (status === "correct") {
                        className += " active-region";
                      } else if (isAnySelected) {
                        className += " region-faded";
                      }
                    }
                    
                    if ((mode === 'REVERSE' || mode === 'TRIVIA' || (mode === 'MIXED' && challengeVariant === 'REGION')) && stateName === targetState && !currentFact) {
                      className += " target-highlight";
                    }

                    if ((mode === 'ADAPTIVE' || mode === 'MISTAKES' || mode === 'STUDY') && STATE_DATA[stateName]) {
                      className += ' mastery-' + getMasteryBand(learnerProfile.states[stateName]?.mastery || 0);
                    }

                    if (mode === 'JOURNEY' && journey.path.slice(0, journey.index + 1).includes(stateName)) {
                      className += ' journey-visited';
                    }
                    if (mode === 'JOURNEY' && stateName === journey.destination) {
                      className += ' journey-goal';
                    }

                    if (victoryCelebration) {
                      className = "state-path win-animation";
                    }

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        className={className}
                        onClick={(evt) => handleMapClickFinal(geo, evt)}
                        role="button"
                        tabIndex={0}
                        aria-label={`${stateName} state`}
                        onKeyDown={(evt) => {
                          if (evt.key === 'Enter' || evt.key === ' ') {
                            evt.preventDefault();
                            handleMapClickFinal(geo, evt);
                          }
                        }}
                        style={{
                          default: { outline: "none" },
                          hover: { outline: "none" },
                          pressed: { outline: "none" },
                        }}
                      />
                    );
                  })}
                  {geographies.map((geo) => {
                    const centroid = geoCentroid(geo);
                    const stateName = geo.properties.name;
                    // Only render labels for highlighted states in REGIONS mode
                    if (mode === 'REGIONS' && guessedStates[stateName] === "correct") {
                      return (
                        <Marker key={`${geo.rsmKey}-marker`} coordinates={centroid} style={{ pointerEvents: "none" }}>
                          <text y="2" fontSize={11} textAnchor="middle" fill="#fff" style={{ fontWeight: 'bold', textShadow: '1px 1px 3px #000, -1px -1px 3px #000' }}>
                            {stateName}
                          </text>
                        </Marker>
                      );
                    }
                    return null;
                  })}
                </>
              )}
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {victoryCelebration && (
          <section className="victory-ceremony" aria-live="polite">
            <div className="victory-kicker">🇺🇸 50 STATES MASTERED</div>
            <h2>The United States of America</h2>
            <p>{musicEnabled ? "The Star-Spangled Banner · U.S. Navy Band" : "Victory ceremony · music is muted"}</p>
            <button type="button" className="victory-continue" onClick={finishVictoryCelebration}>
              Continue to final score
            </button>
          </section>
        )}

        {floatingTexts.map(ft => (
          <div key={ft.id} className="floating-text" style={{ left: ft.x, top: ft.y }}>
            {ft.text}
            {ft.combo && <span className="floating-combo">Combo x{ft.combo}! 🔥</span>}
          </div>
        ))}
      </div>

      {!gameOver && !currentFact && !victoryCelebration && (
        mode === 'REVERSE' || mode === 'TRIVIA' || mode === 'FLAGS' ||
        (mode === 'MIXED' && (challengeVariant === 'FLAG' || challengeVariant === 'REGION'))
      ) && (
        <div className="options-grid">
          {options.map((opt, i) => (
            <button key={i} className="option-btn" onClick={() => handleGuess(opt)}>
              {opt}
            </button>
          ))}
        </div>
      )}

      {dossierState && (
        <StateDossier
          stateName={dossierState}
          data={STATE_DATA[dossierState]}
          stats={learnerProfile.states[dossierState]}
          onClose={() => setDossierState(null)}
        />
      )}

      {currentFact && (
        <div className="overlay">
          <div className="glass-panel modal" role="dialog" aria-modal="true">
            <h2 className="title" style={{ fontSize: '2.5rem' }}>Awesome! 🎉</h2>
            <div style={{ color: '#22c55e', fontSize: '1.2rem', fontWeight: 'bold' }}>
              {currentFact.pointsEarned > 0 ? `+${currentFact.pointsEarned} Points!` : "Fact Unlocked! 📚"}
            </div>
            <div className="fact-box">
              <div className="fact-title">
                <img src={`https://flagcdn.com/w40/us-${STATE_DATA[currentFact.state].code}.png`} alt={`${currentFact.state} flag`} style={{ borderRadius: '2px' }} />
                💡 Did you know about {currentFact.state}?
              </div>
              <div className="fact-text">{currentFact.text}</div>
            </div>
            <button className="btn-primary" onClick={closeFactAndNext}>
              Next State ➡️
            </button>
          </div>
        </div>
      )}

      {studyData && (
        <div className={mode === 'REGIONS' ? 'transparent-overlay' : 'overlay'} style={mode === 'REGIONS' ? { pointerEvents: 'none' } : { alignItems: 'flex-start', paddingTop: '5vh' }}>
          <div className="glass-panel modal" role={mode === 'REGIONS' ? 'region' : 'dialog'} aria-modal={mode === 'REGIONS' ? undefined : 'true'} style={mode === 'REGIONS' ? { position: 'absolute', bottom: '2rem', right: '2rem', width: '380px', maxWidth: '90vw', animation: 'floatUp 0.3s ease-out', pointerEvents: 'auto', padding: '1.5rem' } : { maxWidth: '700px', animation: 'floatUp 0.3s ease-out', pointerEvents: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="title" style={{ fontSize: mode === 'REGIONS' ? '1.8rem' : '2.5rem', margin: 0 }}>{studyData.stateName}</h2>
              <button onClick={() => {
                setStudyData(null);
                if (mode === 'REGIONS') {
                  setGuessedStates({});
                  setMapView(DEFAULT_VIEW);
                }
              }} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer' }}>✖</button>
            </div>
            
            {studyData.loading ? (
              <div style={{ padding: '3rem', color: '#94a3b8' }}>Fetching official Wikipedia records... 📚</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  {studyData.thumbnail && (
                    <img src={studyData.thumbnail} alt={studyData.stateName} style={{ width: '150px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.2)' }} />
                  )}
                  {STATE_DATA[studyData.stateName] && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div className="stat-label">Capital: <span className="stat-value" style={{ fontSize: '1.2rem' }}>{STATE_DATA[studyData.stateName].capital}</span></div>
                      <div className="stat-label">Population: <span className="stat-value" style={{ fontSize: '1.2rem' }}>{STATE_DATA[studyData.stateName].population}</span></div>
                      <div className="stat-label">Area: <span className="stat-value" style={{ fontSize: '1.2rem' }}>{STATE_DATA[studyData.stateName].area}</span></div>
                      <div className="stat-label">Statehood: <span className="stat-value" style={{ fontSize: '1.2rem' }}>{STATE_DATA[studyData.stateName].statehood}</span></div>
                      <div className="stat-label">Geography: <span className="stat-value" style={{ fontSize: '1.2rem' }}>{STATE_DATA[studyData.stateName].geography}</span></div>
                    </div>
                  )}
                </div>
                
                <div className="fact-box" style={{ fontSize: mode === 'REGIONS' ? '0.9rem' : '1.1rem', lineHeight: mode === 'REGIONS' ? '1.4' : '1.6', maxHeight: '30vh', overflowY: 'auto' }}>
                  {studyData.extract}
                </div>
                
                {studyData.url && (
                  <a href={studyData.url} target="_blank" rel="noreferrer" className="btn-primary" style={{ textDecoration: 'none', textAlign: 'center', background: '#3b82f6', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>🏛️</span> Research Official .gov & .edu Records
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {gameOver && (
        <div className="overlay">
          <div className="glass-panel modal" role="dialog" aria-modal="true">
            <div className="mascot">{(mode === 'TIME_ATTACK' ? timeLeft <= 0 : lives <= 0) ? "😢" : "🏆"}</div>
            <h2 className="title" style={{ fontSize: '3.5rem' }}>
              {(mode === 'TIME_ATTACK' ? timeLeft <= 0 : lives <= 0) ? "Game Over" : "You Win!"}
            </h2>
            <div className="victory-summary-grid">
              <div><span>Final score</span><strong>⭐ {score}</strong></div>
              <div><span>Accuracy</span><strong>{sessionAccuracy}%</strong></div>
              <div><span>Best streak</span><strong>{sessionStats.bestStreak}</strong></div>
              <div><span>States missed</span><strong>{Object.keys(sessionStats.mistakes).length}</strong></div>
            </div>
            {Object.keys(sessionStats.mistakes).length > 0 && (
              <div className="review-recommendation">
                Recommended next: Mistake Review for {Object.keys(sessionStats.mistakes).slice(0, 5).join(', ')}
              </div>
            )}
            
            <Leaderboard entries={leaderboard} title="🌍 Top Players" limit={3} />

            <button className="btn-primary" onClick={returnHome}>
              Back to Menu ↩️
            </button>
          </div>
        </div>
      )}
      </div>
      )}
    </div>
  );
}

export default App;
