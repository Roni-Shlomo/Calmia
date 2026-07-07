import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  Image,
  LayoutChangeEvent,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_URL } from '../constants/api';
import { colors } from '../constants/colors';

type ScreenMode = 'menu' | 'tapToRelax' | 'matchTheMood' | 'calmBreak';
type GameStatus = 'idle' | 'playing' | 'paused' | 'finished';
type BubbleType = 'normal' | 'bonus' | 'heart' | 'required';
type MemoryCard = {
  id: string;
  art: string;
  label: string;
};

type Bubble = {
  id: number;
  type: BubbleType;
  x: number;
  y: number;
  size: number;
};

type BreakoutBrick = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  active: boolean;
};

type BreakoutDrop = {
  id: number;
  type: 'heart' | 'bonus';
  points: number;
  x: number;
  y: number;
};

type BreakoutBall = {
  x: number;
  y: number;
  dx: number;
  dy: number;
};

const MAX_LIVES = 5;
const BREAKOUT_LIVES = 5;
const BREAKOUT_MAX_LIVES = 5;
const BREAKOUT_PADDLE_WIDTH = 26;
const BREAKOUT_BALL_SIZE = 18;
const BREAKOUT_SPEED_GAIN = 1.006;
const BREAKOUT_TICK_SPEED_GAIN = 1.00012;
const BREAKOUT_MAX_SPEED = 1.72;
const BREAKOUT_BASE_SPEED = 0.72;
const BREAKOUT_DROP_SPEED = 0.72;
const SPEED_STEP = 0.1;
const MAX_SPEED_LEVEL = 6;
const MISSED_BUBBLE_Y = -16;
const HEART_SYMBOL = '\u2665';
const MEMORY_PAIRS = [
  { art: 'leaf', label: 'Calm' },
  { art: 'moon', label: 'Rest' },
  { art: 'sun', label: 'Hope' },
  { art: 'heart', label: 'Kindness' },
  { art: 'cloud', label: 'Release' },
  { art: 'spark', label: 'Peace' },
];
const MEMORY_CARD_BACK_IMAGE = require('../assets/images/calmia-stones.png');

const createMemoryCards = (): MemoryCard[] =>
  [...MEMORY_PAIRS, ...MEMORY_PAIRS]
    .map((card, index) => ({
      ...card,
      id: `${card.label}-${index}`,
    }))
    .sort(() => Math.random() - 0.5);

const createBreakoutBricks = (): BreakoutBrick[] => {
  const brickColors = [
    colors.softGreen,
    colors.softOrange,
    colors.softYellow,
    colors.softPurple,
    colors.softGray,
  ];

  return Array.from({ length: 20 }, (_, index) => {
    const row = Math.floor(index / 5);
    const column = index % 5;

    return {
      id: index,
      x: 5 + column * 18,
      y: 13 + row * 8.5,
      width: 18,
      height: 8.5,
      color: brickColors[(row + column) % brickColors.length],
      active: true,
    };
  });
};

const createBreakoutBall = (speed = BREAKOUT_BASE_SPEED): BreakoutBall => {
  const direction = Math.random() > 0.5 ? 1 : -1;
  const targetSpeed = Math.max(BREAKOUT_BASE_SPEED, Math.min(BREAKOUT_MAX_SPEED, speed));
  const dx = direction * targetSpeed * 0.58;
  const dy = -Math.sqrt(Math.max(0.2, targetSpeed * targetSpeed - dx * dx));

  return {
    x: 50,
    y: 72,
    dx,
    dy,
  };
};

const getBreakoutSpeed = (dx: number, dy: number) => Math.sqrt(dx * dx + dy * dy);

const clampBreakoutBallSpeed = (dx: number, dy: number) => {
  const speed = getBreakoutSpeed(dx, dy);

  if (speed <= BREAKOUT_MAX_SPEED) {
    return { dx, dy };
  }

  const scale = BREAKOUT_MAX_SPEED / speed;
  return { dx: dx * scale, dy: dy * scale };
};

const speedUpBreakoutBall = (dx: number, dy: number) => {
  const nextDx = dx * BREAKOUT_SPEED_GAIN;
  const nextDy = dy * BREAKOUT_SPEED_GAIN;
  return clampBreakoutBallSpeed(nextDx, nextDy);
};

const createBubble = (id: number): Bubble => {
  const random = Math.random();
  const type: BubbleType =
    random > 0.9 ? 'heart' : random > 0.76 ? 'required' : random > 0.58 ? 'bonus' : 'normal';

  return {
    id,
    type,
    x: 8 + Math.random() * 74,
    y: 104,
    size: type === 'bonus' ? 82 : type === 'heart' ? 76 : type === 'required' ? 72 : 64,
  };
};

export default function GamesScreen() {
  const router = useRouter();
  const popPlayer = useAudioPlayer(require('../assets/sounds/bubble-pop.wav'));
  const cardFlipPlayer = useAudioPlayer(require('../assets/sounds/card-flip.wav'));
  const matchFoundPlayer = useAudioPlayer(require('../assets/sounds/match-found.wav'));
  const breakoutMusicPlayer = useAudioPlayer(require('../assets/sounds/calm-break-loop.wav'));

  const [screenMode, setScreenMode] = useState<ScreenMode>('menu');
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [speedLevel, setSpeedLevel] = useState(0);
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>(() => createMemoryCards());
  const [selectedMemoryCards, setSelectedMemoryCards] = useState<string[]>([]);
  const [matchedMemoryCards, setMatchedMemoryCards] = useState<string[]>([]);
  const [memoryStarted, setMemoryStarted] = useState(false);
  const [breakoutStatus, setBreakoutStatus] = useState<GameStatus>('idle');
  const [breakoutScore, setBreakoutScore] = useState(0);
  const [breakoutLives, setBreakoutLives] = useState(BREAKOUT_LIVES);
  const [breakoutBricks, setBreakoutBricks] = useState<BreakoutBrick[]>(() =>
    createBreakoutBricks()
  );
  const [breakoutDrops, setBreakoutDrops] = useState<BreakoutDrop[]>([]);
  const [breakoutBall, setBreakoutBall] = useState<BreakoutBall>(() => createBreakoutBall());
  const [breakoutPaddleX, setBreakoutPaddleX] = useState(50);
  const [breakoutBoardWidth, setBreakoutBoardWidth] = useState(1);
  const [bestScores, setBestScores] = useState<Record<string, number>>({});
  const nextBreakoutDropId = useRef(1);
  const nextBubbleId = useRef(1);
  const savedTapResultRef = useRef(false);
  const savedBreakoutResultRef = useRef(false);

  const loadGameResults = useCallback(async () => {
    try {
      const storedUser = await AsyncStorage.getItem('currentUser');

      if (!storedUser) {
        return;
      }

      const user = JSON.parse(storedUser);
      const response = await fetch(`${API_URL}/game-results/${user.id}`);
      const data = await response.json();

      if (response.ok) {
        setBestScores(data.bestScores || {});
      }
    } catch (error) {
      console.log('Failed to load game results:', error);
    }
  }, []);

  const saveGameResult = useCallback(async (
    gameKey: string,
    gameName: string,
    gameScore: number,
    won?: boolean
  ) => {
    try {
      const storedUser = await AsyncStorage.getItem('currentUser');

      if (!storedUser) return;

      const user = JSON.parse(storedUser);
      const response = await fetch(`${API_URL}/game-results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          gameKey,
          gameName,
          score: gameScore,
          won,
        }),
      });

      if (response.ok) {
        loadGameResults();
      }
    } catch (error) {
      console.log('Failed to save game result:', error);
    }
  }, [loadGameResults]);

  useEffect(() => {
    loadGameResults();
  }, [loadGameResults]);

  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const speedTimer = setInterval(() => {
      setSpeedLevel((current) => Math.min(current + 1, MAX_SPEED_LEVEL));
    }, 5000);

    return () => clearInterval(speedTimer);
  }, [gameStatus]);

  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const bubbleTimer = setInterval(() => {
      setBubbles((current) => {
        const nextBubble = createBubble(nextBubbleId.current);
        nextBubbleId.current += 1;
        return [...current, nextBubble];
      });
    }, 720);

    return () => clearInterval(bubbleTimer);
  }, [gameStatus]);

  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const floatTimer = setInterval(() => {
      setBubbles((current) => {
        const speedMultiplier = 1 + speedLevel * SPEED_STEP;
        const movedBubbles = current.map((bubble) => ({
          ...bubble,
          y:
            bubble.y -
            (bubble.type === 'bonus' || bubble.type === 'required' ? 1.18 : 1.02) *
              speedMultiplier,
        }));
        const visibleBubbles = movedBubbles.filter((bubble) => bubble.y > MISSED_BUBBLE_Y);
        const missedRequiredCount = movedBubbles.filter(
          (bubble) => bubble.y <= MISSED_BUBBLE_Y && bubble.type === 'required'
        ).length;

        if (missedRequiredCount > 0) {
          setLives((currentLives) => {
            const nextLives = Math.max(0, currentLives - missedRequiredCount);

            if (nextLives === 0) {
              setGameStatus('finished');
            }

            return nextLives;
          });
        }

        return visibleBubbles;
      });
    }, 90);

    return () => clearInterval(floatTimer);
  }, [gameStatus, speedLevel]);

  useEffect(() => {
    breakoutMusicPlayer.loop = true;
    breakoutMusicPlayer.volume = 0.34;

    if (screenMode === 'calmBreak' && breakoutStatus === 'playing') {
      breakoutMusicPlayer.play();
      return;
    }

    breakoutMusicPlayer.pause();
  }, [breakoutMusicPlayer, breakoutStatus, screenMode]);

  useEffect(() => {
    if (breakoutStatus !== 'playing') return;

    const breakoutTimer = setInterval(() => {
      setBreakoutDrops((currentDrops) => {
        const paddleTop = 87;
        const paddleHalfWidth = BREAKOUT_PADDLE_WIDTH / 2;
        let collectedHearts = 0;
        let collectedBonusPoints = 0;

        const nextDrops = currentDrops
          .map((drop) => ({ ...drop, y: drop.y + BREAKOUT_DROP_SPEED }))
          .filter((drop) => {
            const isCollected =
              drop.y >= paddleTop - 3 &&
              drop.y <= paddleTop + 5 &&
              drop.x >= breakoutPaddleX - paddleHalfWidth &&
              drop.x <= breakoutPaddleX + paddleHalfWidth;

            if (isCollected) {
              if (drop.type === 'heart') {
                collectedHearts += 1;
              } else {
                collectedBonusPoints += drop.points;
              }
              return false;
            }

            return drop.y < 104;
          });

        if (collectedHearts > 0) {
          setBreakoutLives((current) =>
            Math.min(BREAKOUT_MAX_LIVES, current + collectedHearts)
          );
        }

        if (collectedBonusPoints > 0) {
          setBreakoutScore((current) => current + collectedBonusPoints);
        }

        if (collectedHearts > 0 || collectedBonusPoints > 0) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        return nextDrops;
      });

      setBreakoutBall((currentBall) => {
        let nextBall = {
          ...currentBall,
          x: currentBall.x + currentBall.dx,
          y: currentBall.y + currentBall.dy,
        };
        const fasterTickBall = clampBreakoutBallSpeed(
          nextBall.dx * BREAKOUT_TICK_SPEED_GAIN,
          nextBall.dy * BREAKOUT_TICK_SPEED_GAIN
        );
        let nextDx = fasterTickBall.dx;
        let nextDy = fasterTickBall.dy;

        if (nextBall.x <= 2 || nextBall.x >= 98) {
          nextDx = -nextDx;
          nextBall.x = Math.max(2, Math.min(98, nextBall.x));
        }

        if (nextBall.y <= 3) {
          nextDy = Math.abs(nextDy);
          nextBall.y = 3;
        }

        const paddleTop = 87;
        const paddleHalfWidth = BREAKOUT_PADDLE_WIDTH / 2;
        const hitPaddle =
          nextBall.dy > 0 &&
          nextBall.y >= paddleTop &&
          nextBall.y <= paddleTop + 4 &&
          nextBall.x >= breakoutPaddleX - paddleHalfWidth &&
          nextBall.x <= breakoutPaddleX + paddleHalfWidth;

        if (hitPaddle) {
          const paddleOffset = (nextBall.x - breakoutPaddleX) / paddleHalfWidth;
          const currentSpeed = Math.max(BREAKOUT_BASE_SPEED, getBreakoutSpeed(nextDx, nextDy));
          nextDx = paddleOffset * currentSpeed * 0.82;
          nextDy = -Math.sqrt(Math.max(0.22, currentSpeed * currentSpeed - nextDx * nextDx));
          const fasterBall = speedUpBreakoutBall(nextDx, nextDy);
          nextDx = fasterBall.dx;
          nextDy = fasterBall.dy;
          nextBall.y = paddleTop - 1;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        const hitBrick = breakoutBricks.find(
          (brick) =>
            brick.active &&
            nextBall.x >= brick.x &&
            nextBall.x <= brick.x + brick.width &&
            nextBall.y >= brick.y &&
            nextBall.y <= brick.y + brick.height
        );

        if (hitBrick) {
          nextDy = -nextDy;
          const fasterBall = speedUpBreakoutBall(nextDx, nextDy);
          nextDx = fasterBall.dx;
          nextDy = fasterBall.dy;
          setBreakoutScore((current) => current + 1);
          const dropRoll = Math.random();
          if (dropRoll < 0.68) {
            const bonusRoll = Math.random();
            const bonusPoints = bonusRoll > 0.78 ? 5 : bonusRoll > 0.42 ? 3 : 2;

            setBreakoutDrops((current) => [
              ...current,
              {
                id: nextBreakoutDropId.current,
                type: dropRoll < 0.14 ? 'heart' : 'bonus',
                points: dropRoll < 0.14 ? 1 : bonusPoints,
                x: hitBrick.x + hitBrick.width / 2,
                y: hitBrick.y + hitBrick.height,
              },
            ]);
            nextBreakoutDropId.current += 1;
          }
          setBreakoutBricks((current) =>
            current.map((brick) =>
              brick.id === hitBrick.id ? { ...brick, active: false } : brick
            )
          );
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          popPlayer.seekTo(0);
          popPlayer.play();
        }

        if (nextBall.y > 104) {
          setBreakoutLives((currentLives) => {
            const nextLives = Math.max(0, currentLives - 1);

            if (nextLives === 0) {
              setBreakoutStatus('finished');
            }

            return nextLives;
          });

          const resetSpeed = Math.max(
            BREAKOUT_BASE_SPEED,
            Math.min(BREAKOUT_MAX_SPEED, getBreakoutSpeed(nextDx, nextDy) * 0.96)
          );

          return createBreakoutBall(resetSpeed);
        }

        return { ...nextBall, dx: nextDx, dy: nextDy };
      });
    }, 24);

    return () => clearInterval(breakoutTimer);
  }, [breakoutStatus, breakoutBricks, breakoutPaddleX, popPlayer]);

  useEffect(() => {
    if (breakoutStatus === 'idle' || breakoutStatus === 'finished') return;

    const hasActiveBricks = breakoutBricks.some((brick) => brick.active);

    if (!hasActiveBricks) {
      setBreakoutStatus('finished');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [breakoutBricks, breakoutStatus]);

  useEffect(() => {
    if (gameStatus !== 'finished' || savedTapResultRef.current) return;

    savedTapResultRef.current = true;
    saveGameResult('tap_to_relax', 'Tap to Relax', score, false);
  }, [gameStatus, saveGameResult, score]);

  useEffect(() => {
    if (breakoutStatus !== 'finished' || savedBreakoutResultRef.current) return;

    const isComplete = breakoutBricks.every((brick) => !brick.active);
    savedBreakoutResultRef.current = true;
    saveGameResult('calm_break', 'Calm Break', breakoutScore, isComplete);
  }, [breakoutBricks, breakoutScore, breakoutStatus, saveGameResult]);

  const openTapToRelax = () => {
    Haptics.selectionAsync();
    setScreenMode('tapToRelax');
  };

  const openMatchTheMood = () => {
    Haptics.selectionAsync();
    setScreenMode('matchTheMood');
    resetMemoryGame();
  };

  const openCalmBreak = () => {
    Haptics.selectionAsync();
    setScreenMode('calmBreak');
    resetBreakoutGame();
  };

  const startGame = () => {
    Haptics.selectionAsync();
    savedTapResultRef.current = false;
    setScore(0);
    setLives(MAX_LIVES);
    setSpeedLevel(0);
    setBubbles([createBubble(0)]);
    nextBubbleId.current = 1;
    setGameStatus('playing');
  };

  const togglePause = () => {
    Haptics.selectionAsync();
    setGameStatus((current) => (current === 'playing' ? 'paused' : 'playing'));
  };

  const returnToMenu = () => {
    setScreenMode('menu');
    setGameStatus('idle');
    setScore(0);
    setLives(MAX_LIVES);
    setSpeedLevel(0);
    setBubbles([]);
    setBreakoutStatus('idle');
  };

  const handleBack = () => {
    if (screenMode !== 'menu') {
      returnToMenu();
      return;
    }

    router.back();
  };

  const popBubble = (bubble: Bubble) => {
    if (gameStatus !== 'playing') return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    popPlayer.seekTo(0);
    popPlayer.play();
    setBubbles((current) => current.filter((item) => item.id !== bubble.id));

    if (bubble.type === 'heart') {
      setLives((current) => Math.min(MAX_LIVES, current + 1));
      return;
    }

    setScore((current) => current + (bubble.type === 'bonus' ? 3 : 1));
  };

  const getBubbleLabel = (type: BubbleType) => {
    if (type === 'heart') return `+${HEART_SYMBOL}`;
    if (type === 'bonus') return '+3';
    if (type === 'required') return '!';
    return '';
  };

  const getBubbleStyle = (type: BubbleType) => {
    if (type === 'heart') return styles.heartBubble;
    if (type === 'required') return styles.requiredBubble;
    if (type === 'bonus') return styles.bonusBubble;
    return styles.normalBubble;
  };

  const renderHighScore = (gameKey: string) => (
    <View style={styles.highScoreCard}>
      <Text style={styles.highScoreLabel}>Your high score</Text>
      <Text style={styles.highScoreValue}>{bestScores[gameKey] ?? 0}</Text>
    </View>
  );

  const resetMemoryGame = (startImmediately = false) => {
    setMemoryCards(createMemoryCards());
    setSelectedMemoryCards([]);
    setMatchedMemoryCards([]);
    setMemoryStarted(startImmediately);
  };

  const resetBreakoutGame = (startImmediately = false) => {
    savedBreakoutResultRef.current = false;
    setBreakoutScore(0);
    setBreakoutLives(BREAKOUT_LIVES);
    setBreakoutBricks(createBreakoutBricks());
    setBreakoutDrops([]);
    setBreakoutBall(createBreakoutBall());
    setBreakoutPaddleX(50);
    nextBreakoutDropId.current = 1;
    setBreakoutStatus(startImmediately ? 'playing' : 'idle');
  };

  const startBreakoutGame = () => {
    Haptics.selectionAsync();
    resetBreakoutGame(true);
    breakoutMusicPlayer.loop = true;
    breakoutMusicPlayer.volume = 0.34;
    breakoutMusicPlayer.seekTo(0);
    breakoutMusicPlayer.play();
  };

  const toggleBreakoutPause = () => {
    Haptics.selectionAsync();
    setBreakoutStatus((current) => (current === 'playing' ? 'paused' : 'playing'));
  };

  const handleBreakoutBoardLayout = (event: LayoutChangeEvent) => {
    setBreakoutBoardWidth(Math.max(1, event.nativeEvent.layout.width));
  };

  const moveBreakoutPaddle = (event: GestureResponderEvent) => {
    const xPercent = (event.nativeEvent.locationX / breakoutBoardWidth) * 100;
    const halfWidth = BREAKOUT_PADDLE_WIDTH / 2;
    setBreakoutPaddleX(Math.max(halfWidth, Math.min(100 - halfWidth, xPercent)));
  };

  const startMemoryGame = () => {
    Haptics.selectionAsync();
    resetMemoryGame(true);
  };

  const handleMemoryCardPress = (card: MemoryCard) => {
    const isSelected = selectedMemoryCards.includes(card.id);
    const isMatched = matchedMemoryCards.includes(card.id);

    if (isSelected || isMatched || selectedMemoryCards.length === 2) return;

    Haptics.selectionAsync();
    cardFlipPlayer.seekTo(0);
    cardFlipPlayer.play();

    const nextSelectedCards = [...selectedMemoryCards, card.id];
    setSelectedMemoryCards(nextSelectedCards);

    if (nextSelectedCards.length !== 2) return;

    const [firstId, secondId] = nextSelectedCards;
    const firstCard = memoryCards.find((item) => item.id === firstId);
    const secondCard = memoryCards.find((item) => item.id === secondId);

    if (firstCard?.label === secondCard?.label) {
      setMatchedMemoryCards((current) => [...current, firstId, secondId]);
      setSelectedMemoryCards([]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      matchFoundPlayer.seekTo(0);
      matchFoundPlayer.play();
      return;
    }

    setTimeout(() => setSelectedMemoryCards([]), 800);
  };

  const renderMenu = () => (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.menuHero}>
        <View style={styles.heroCopy}>
          <Text style={styles.menuEyebrow}>Mindful activities</Text>
          <Text style={styles.menuTitle}>Mini Games</Text>
          <Text style={styles.menuText}>Small playful moments to reset, focus, and breathe.</Text>
        </View>

        <View style={styles.heroIllustration}>
          <View style={styles.heroBlob} />
          <View style={styles.heroHead} />
          <View style={styles.heroBody} />
          <View style={styles.heroLeafOne} />
          <View style={styles.heroLeafTwo} />
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.86}
        style={[styles.gameSelectCard, styles.bubbleSelectCard]}
        onPress={openTapToRelax}
      >
        <View style={styles.gameCardCopy}>
          <Text style={styles.gameEyebrow}>Bubble game</Text>
          <Text style={styles.gameSelectTitle}>Tap to Relax</Text>
          <Text style={styles.gameSelectText}>Pop calming bubbles and protect your hearts.</Text>
        </View>

        <View style={styles.bubbleIllustration}>
          <View style={[styles.menuBubble, styles.menuBubbleLarge]}>
            <View style={styles.menuBubbleShine} />
          </View>
          <View style={[styles.menuBubble, styles.menuBubbleSmall]} />
          <View style={[styles.menuBubble, styles.menuBubbleBonus]}>
            <Text style={styles.menuBubbleText}>+3</Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.86}
        style={[styles.gameSelectCard, styles.moodSelectCard]}
        onPress={openMatchTheMood}
      >
        <View style={styles.gameCardCopy}>
          <Text style={styles.gameEyebrow}>Mood game</Text>
          <Text style={styles.gameSelectTitle}>Match the Mood</Text>
          <Text style={styles.gameSelectText}>A gentle matching activity for emotions and focus.</Text>
        </View>

        <View style={styles.moodIllustration}>
          <View style={[styles.moodCardShape, styles.moodCardBack]} />
          <View style={[styles.moodCardShape, styles.moodCardFront]}>
            <View style={styles.moodFace}>
              <Text style={styles.moodFaceText}>:)</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.86}
        style={[styles.gameSelectCard, styles.breakoutSelectCard]}
        onPress={openCalmBreak}
      >
        <View style={styles.gameCardCopy}>
          <Text style={styles.gameEyebrow}>Focus game</Text>
          <Text style={styles.gameSelectTitle}>Calm Break</Text>
          <Text style={styles.gameSelectText}>Guide the ball and release soft blocks of tension.</Text>
        </View>

        <View style={styles.breakoutIllustration}>
          <View style={styles.breakoutIllustrationBall} />
          <View style={[styles.breakoutIllustrationBrick, styles.breakoutIllustrationBrickOne]} />
          <View style={[styles.breakoutIllustrationBrick, styles.breakoutIllustrationBrickTwo]} />
          <View style={[styles.breakoutIllustrationBrick, styles.breakoutIllustrationBrickThree]} />
          <View style={styles.breakoutIllustrationPaddle} />
        </View>
      </TouchableOpacity>

    </ScrollView>
  );

  const renderMemoryArt = (art: string) => {
    const artStyle =
      art === 'leaf'
        ? styles.memoryIconCalm
        : art === 'moon'
          ? styles.memoryIconRest
          : art === 'sun'
            ? styles.memoryIconHope
            : art === 'heart'
              ? styles.memoryIconKind
              : art === 'cloud'
                ? styles.memoryIconRelease
                : styles.memoryIconLight;

    if (art === 'leaf') {
      return (
        <View style={styles.memoryIconFrame}>
          <View style={[styles.memoryIconCircle, artStyle]}>
            <View style={[styles.memoryMiniLeaf, styles.memoryMiniLeafLeft]} />
            <View style={[styles.memoryMiniLeaf, styles.memoryMiniLeafRight]} />
          </View>
        </View>
      );
    }

    if (art === 'moon') {
      return (
        <View style={styles.memoryIconFrame}>
          <View style={[styles.memoryIconCircle, artStyle]}>
            <View style={styles.memoryMiniMoon} />
            <View style={styles.memoryMiniMoonCutout} />
          </View>
        </View>
      );
    }

    if (art === 'sun') {
      return (
        <View style={styles.memoryIconFrame}>
          <View style={[styles.memoryIconCircle, artStyle]}>
            <View style={styles.memoryHopeHorizon} />
            <View style={styles.memoryHopeSunrise} />
          </View>
        </View>
      );
    }

    if (art === 'heart') {
      return (
        <View style={styles.memoryIconFrame}>
          <View style={[styles.memoryIconCircle, artStyle]}>
            <Text style={styles.memoryIconText}>{HEART_SYMBOL}</Text>
          </View>
        </View>
      );
    }

    if (art === 'cloud') {
      return (
        <View style={styles.memoryIconFrame}>
          <View style={[styles.memoryIconCircle, artStyle]}>
            <View style={styles.memoryMiniCloudBase} />
            <View style={[styles.memoryMiniCloudPuff, styles.memoryMiniCloudLeft]} />
            <View style={[styles.memoryMiniCloudPuff, styles.memoryMiniCloudRight]} />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.memoryIconFrame}>
        <View style={[styles.memoryIconCircle, artStyle]}>
          <View style={[styles.memoryPeaceLeaf, styles.memoryPeaceLeafLeft]} />
          <View style={[styles.memoryPeaceLeaf, styles.memoryPeaceLeafRight]} />
          <View style={styles.memoryPeaceStem} />
        </View>
      </View>
    );
  };

  const renderMatchTheMood = () => {
    const matchedPairs = matchedMemoryCards.length / 2;
    const isComplete = matchedMemoryCards.length === memoryCards.length;

    return (
      <View style={styles.gameContent}>
        <Text style={styles.title}>Match the Mood</Text>

        {!memoryStarted ? (
          <>
            <View style={styles.memoryIntroCard}>
              <Text style={styles.centerTitle}>How to play</Text>
              <Text style={styles.centerText}>
                Flip two cards at a time and find matching calm symbols. There is no timer, so take
                your time and play at an easy pace.
              </Text>
            </View>

            <TouchableOpacity style={styles.startButton} onPress={startMemoryGame}>
              <Text style={styles.startButtonText}>Start</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.memoryHeader}>
              <Text style={styles.memoryStat}>Pairs: {matchedPairs} / {MEMORY_PAIRS.length}</Text>
            </View>

            <View style={styles.memoryBoard}>
              {memoryCards.map((card) => {
                const isOpen =
                  selectedMemoryCards.includes(card.id) || matchedMemoryCards.includes(card.id);

                return (
                  <TouchableOpacity
                    key={card.id}
                    activeOpacity={0.86}
                    style={[styles.memoryCard, isOpen && styles.memoryCardOpen]}
                    onPress={() => handleMemoryCardPress(card)}
                  >
                    {isOpen ? (
                      <>
                        {renderMemoryArt(card.art)}
                        <Text style={styles.memoryLabel}>{card.label}</Text>
                      </>
                    ) : (
                      <View style={styles.memoryBackImageWrap}>
                        <Image
                          source={MEMORY_CARD_BACK_IMAGE}
                          style={styles.memoryBackImage}
                          resizeMode="contain"
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {isComplete && (
              <View style={styles.memoryResult}>
                <Text style={styles.memoryResultTitle}>Nice focus</Text>
                <Text style={styles.memoryResultText}>You matched all the cards.</Text>
              </View>
            )}

            <TouchableOpacity style={styles.startButton} onPress={() => resetMemoryGame(true)}>
              <Text style={styles.startButtonText}>{isComplete ? 'Play Again' : 'Restart'}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  const renderTapToRelax = () => (
    <View style={styles.gameContent}>
      <Text style={styles.title}>Tap to Relax</Text>

      <View style={styles.gameBoard}>
        <View style={styles.scoreInBoard}>
          <Text style={styles.scoreText}>Score: {score}</Text>
        </View>

        <View style={styles.heartsInBoard}>
          <Text style={styles.heartValue}>{HEART_SYMBOL.repeat(lives)}</Text>
        </View>

        {gameStatus === 'idle' && (
          <View style={styles.centerMessage}>
            <Text style={styles.centerTitle}>How to play</Text>
            <Text style={styles.centerText}>
              Tap the bubbles before they float away. Regular bubbles add points, +3 bubbles give a
              bonus, heart bubbles restore a heart, and bubbles marked ! must be caught to protect
              your hearts.
            </Text>
          </View>
        )}

        {gameStatus === 'finished' && (
          <View style={styles.centerMessage}>
            <Text style={styles.centerTitle}>Your score: {score}</Text>
            <Text style={styles.centerText}>Nice focus. You kept going gently.</Text>
          </View>
        )}

        {gameStatus === 'paused' && (
          <View style={styles.pauseBadge}>
            <Text style={styles.pauseBadgeText}>Paused</Text>
          </View>
        )}

        {(gameStatus === 'playing' || gameStatus === 'paused') &&
          bubbles.map((bubble) => (
            <TouchableOpacity
              key={bubble.id}
              activeOpacity={0.8}
              style={[
                styles.bubble,
                getBubbleStyle(bubble.type),
                {
                  left: `${bubble.x}%`,
                  top: `${bubble.y}%`,
                  width: bubble.size,
                  height: bubble.size,
                  borderRadius: bubble.size / 2,
                },
              ]}
              onPress={() => popBubble(bubble)}
            >
              <View style={styles.bubbleHighlight} />
              <View style={styles.bubbleShine} />
              <Text style={styles.bubbleText}>{getBubbleLabel(bubble.type)}</Text>
            </TouchableOpacity>
          ))}
      </View>

      {renderHighScore('tap_to_relax')}

      {gameStatus === 'playing' || gameStatus === 'paused' ? (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={togglePause}>
            <Text style={styles.secondaryButtonText}>
              {gameStatus === 'playing' ? 'Pause' : 'Resume'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.startButton} onPress={startGame}>
            <Text style={styles.startButtonText}>Restart</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.startButton} onPress={startGame}>
          <Text style={styles.startButtonText}>{gameStatus === 'finished' ? 'Play Again' : 'Start'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderCalmBreak = () => {
    const isComplete = breakoutBricks.every((brick) => !brick.active);
    const displayedBreakoutStatus =
      isComplete && breakoutStatus !== 'idle' ? 'finished' : breakoutStatus;
    const endTitle = isComplete ? 'You win!' : 'Nice try';
    const endText = isComplete
      ? 'You released all the blocks.'
      : `Your score: ${breakoutScore}`;

    return (
      <View style={styles.gameContent}>
        <Text style={styles.title}>Calm Break</Text>

        <View
          style={styles.breakoutBoard}
          onLayout={handleBreakoutBoardLayout}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={moveBreakoutPaddle}
          onResponderMove={moveBreakoutPaddle}
        >
          <View style={styles.scoreInBoard}>
            <Text style={styles.scoreText}>Score: {breakoutScore}</Text>
          </View>

          <View style={styles.heartsInBoard}>
            <Text style={styles.breakoutHeartValue}>{HEART_SYMBOL.repeat(breakoutLives)}</Text>
          </View>

          {breakoutStatus !== 'idle' &&
            breakoutBricks.map(
              (brick) =>
                brick.active && (
                  <View
                    key={brick.id}
                    style={[
                      styles.breakoutBrick,
                      {
                        left: `${brick.x}%`,
                        top: `${brick.y}%`,
                        width: `${brick.width}%`,
                        height: `${brick.height}%`,
                        backgroundColor: brick.color,
                      },
                    ]}
                  />
                )
            )}

          {(displayedBreakoutStatus === 'playing' || displayedBreakoutStatus === 'paused') &&
            breakoutDrops.map((drop) => (
              <View
                key={drop.id}
                style={[
                  styles.breakoutDrop,
                  drop.type === 'bonus' && styles.breakoutBonusDrop,
                  drop.type === 'bonus' && drop.points === 2 && styles.breakoutBonusTwoDrop,
                  drop.type === 'bonus' && drop.points === 3 && styles.breakoutBonusThreeDrop,
                  drop.type === 'bonus' && drop.points === 5 && styles.breakoutBonusFiveDrop,
                  {
                    left: `${drop.x}%`,
                    top: `${drop.y}%`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.breakoutDropText,
                    drop.type === 'bonus' && styles.breakoutBonusDropText,
                    drop.type === 'bonus' && drop.points === 5 && styles.breakoutBonusFiveDropText,
                  ]}
                >
                  {drop.type === 'heart' ? HEART_SYMBOL : `+${drop.points}`}
                </Text>
              </View>
            ))}

          {(displayedBreakoutStatus === 'playing' || displayedBreakoutStatus === 'paused') && (
            <>
              <View
                style={[
                  styles.breakoutBall,
                  {
                    left: `${breakoutBall.x}%`,
                    top: `${breakoutBall.y}%`,
                    width: BREAKOUT_BALL_SIZE,
                    height: BREAKOUT_BALL_SIZE,
                    borderRadius: BREAKOUT_BALL_SIZE / 2,
                  },
                ]}
              />
              <View
                style={[
                  styles.breakoutPaddle,
                  {
                    left: `${breakoutPaddleX - BREAKOUT_PADDLE_WIDTH / 2}%`,
                    width: `${BREAKOUT_PADDLE_WIDTH}%`,
                  },
                ]}
              />
            </>
          )}

          {breakoutStatus === 'idle' && (
            <View style={styles.centerMessage}>
              <Text style={styles.centerTitle}>How to play</Text>
              <Text style={styles.centerText}>
                Move the soft paddle to keep the ball in play. Each gentle hit clears a block and
                adds to your score. Catch falling hearts and point bonuses with the paddle.
              </Text>
            </View>
          )}

          {displayedBreakoutStatus === 'paused' && (
            <View style={styles.pauseBadge}>
              <Text style={styles.pauseBadgeText}>Paused</Text>
            </View>
          )}

          {displayedBreakoutStatus === 'finished' && (
            <View style={styles.centerMessage}>
              <Text style={styles.centerTitle}>{endTitle}</Text>
              <Text style={styles.centerText}>{endText}</Text>
            </View>
          )}
        </View>

        {renderHighScore('calm_break')}

        {displayedBreakoutStatus === 'playing' || displayedBreakoutStatus === 'paused' ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={toggleBreakoutPause}>
              <Text style={styles.secondaryButtonText}>
                {displayedBreakoutStatus === 'playing' ? 'Pause' : 'Resume'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.startButton} onPress={() => resetBreakoutGame(true)}>
              <Text style={styles.startButtonText}>Restart</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.startButton} onPress={startBreakoutGame}>
            <Text style={styles.startButtonText}>
              {displayedBreakoutStatus === 'finished' ? 'Play Again' : 'Start'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.navButton} onPress={handleBack}>
          <Text style={styles.navButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => router.push('/home')}>
          <Text style={styles.navButtonText}>Home</Text>
        </TouchableOpacity>
      </View>

      {screenMode === 'menu' && renderMenu()}
      {screenMode === 'tapToRelax' && renderTapToRelax()}
      {screenMode === 'matchTheMood' && renderMatchTheMood()}
      {screenMode === 'calmBreak' && renderCalmBreak()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 16,
  },
  navButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    paddingTop: 20,
    paddingBottom: 36,
  },
  menuHero: {
    paddingHorizontal: 8,
    paddingVertical: 22,
    minHeight: 158,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heroCopy: {
    flex: 1,
    paddingRight: 18,
  },
  menuEyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  menuTitle: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 10,
  },
  menuText: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 23,
    maxWidth: 420,
  },
  heroIllustration: {
    width: 150,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBlob: {
    position: 'absolute',
    width: 128,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.softGreen,
    transform: [{ rotate: '-8deg' }],
  },
  heroHead: {
    position: 'absolute',
    top: 28,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.softOrange,
  },
  heroBody: {
    position: 'absolute',
    top: 61,
    width: 82,
    height: 50,
    borderTopLeftRadius: 42,
    borderTopRightRadius: 42,
    backgroundColor: colors.primary,
  },
  heroLeafOne: {
    position: 'absolute',
    top: 36,
    right: 8,
    width: 34,
    height: 18,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    transform: [{ rotate: '-28deg' }],
  },
  heroLeafTwo: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    width: 30,
    height: 16,
    borderRadius: 16,
    backgroundColor: colors.accent,
    transform: [{ rotate: '24deg' }],
  },
  gameContent: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    color: colors.subtext,
    marginBottom: 24,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: colors.subtext,
  },
  gameSelectCard: {
    borderRadius: 28,
    minHeight: 150,
    padding: 22,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  bubbleSelectCard: {
    backgroundColor: colors.card,
  },
  moodSelectCard: {
    backgroundColor: '#FFF8E4',
  },
  breakoutSelectCard: {
    backgroundColor: '#E9E2D2',
  },
  gameCardCopy: {
    flex: 1,
    paddingRight: 16,
  },
  gameEyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  gameSelectTitle: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '800',
    marginBottom: 9,
  },
  gameSelectText: {
    color: colors.subtext,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 420,
  },
  bubbleIllustration: {
    width: 160,
    height: 112,
  },
  menuBubble: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.86)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBubbleLarge: {
    right: 28,
    top: 12,
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(220, 231, 200, 0.82)',
  },
  menuBubbleSmall: {
    right: 2,
    top: 0,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(217, 208, 245, 0.72)',
  },
  menuBubbleBonus: {
    right: 0,
    bottom: 4,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(246, 227, 163, 0.86)',
  },
  menuBubbleShine: {
    position: 'absolute',
    top: 14,
    left: 17,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
  },
  menuBubbleText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  moodIllustration: {
    width: 156,
    height: 112,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodCardShape: {
    position: 'absolute',
    width: 96,
    height: 76,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
  },
  moodCardBack: {
    backgroundColor: colors.softPurple,
    transform: [{ rotate: '-10deg' }],
    right: 36,
    top: 10,
  },
  moodCardFront: {
    backgroundColor: colors.card,
    right: 12,
    top: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodFace: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodFaceText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  breakoutIllustration: {
    width: 158,
    height: 112,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakoutIllustrationBall: {
    position: 'absolute',
    top: 12,
    right: 54,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.82)',
  },
  breakoutIllustrationBrick: {
    position: 'absolute',
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
  },
  breakoutIllustrationBrickOne: {
    top: 38,
    right: 18,
    width: 78,
    backgroundColor: colors.softGreen,
  },
  breakoutIllustrationBrickTwo: {
    top: 62,
    right: 46,
    width: 88,
    backgroundColor: colors.softPurple,
  },
  breakoutIllustrationBrickThree: {
    top: 62,
    right: 8,
    width: 34,
    backgroundColor: colors.softYellow,
  },
  breakoutIllustrationPaddle: {
    position: 'absolute',
    bottom: 10,
    right: 30,
    width: 86,
    height: 16,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  memoryHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  memoryStat: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  memoryBoard: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  memoryCard: {
    width: '23.5%',
    aspectRatio: 0.9,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  memoryCardOpen: {
    backgroundColor: colors.softYellow,
    borderColor: colors.primary,
  },
  memoryBackImageWrap: {
    width: '76%',
    height: '76%',
    borderRadius: 18,
    backgroundColor: '#F6F1E8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  memoryBackImage: {
    width: '104%',
    height: '104%',
  },
  memoryLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  memoryIntroCard: {
    width: '100%',
    minHeight: 430,
    backgroundColor: '#EFE3D7',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    marginBottom: 20,
  },
  memoryIconFrame: {
    width: 52,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  memoryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryIconCalm: {
    backgroundColor: colors.softGreen,
  },
  memoryIconRest: {
    backgroundColor: colors.softPurple,
  },
  memoryIconHope: {
    backgroundColor: colors.softYellow,
  },
  memoryIconKind: {
    backgroundColor: colors.softOrange,
  },
  memoryIconRelease: {
    backgroundColor: colors.softGray,
  },
  memoryIconLight: {
    backgroundColor: '#FFF2C4',
  },
  memoryMiniLeaf: {
    position: 'absolute',
    width: 20,
    height: 12,
    borderRadius: 12,
    backgroundColor: colors.secondary,
  },
  memoryMiniLeafLeft: {
    left: 7,
    transform: [{ rotate: '-28deg' }],
  },
  memoryMiniLeafRight: {
    right: 7,
    transform: [{ rotate: '28deg' }],
  },
  memoryMiniMoon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.card,
  },
  memoryMiniMoonCutout: {
    position: 'absolute',
    right: 8,
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: colors.softPurple,
  },
  memoryHopeHorizon: {
    position: 'absolute',
    bottom: 10,
    width: 30,
    height: 10,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    backgroundColor: colors.accent,
  },
  memoryHopeSunrise: {
    position: 'absolute',
    bottom: 15,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.card,
  },
  memoryIconText: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '800',
  },
  memoryMiniCloudBase: {
    width: 28,
    height: 13,
    borderRadius: 13,
    backgroundColor: colors.card,
    marginTop: 8,
  },
  memoryMiniCloudPuff: {
    position: 'absolute',
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  memoryMiniCloudLeft: {
    left: 10,
    top: 13,
  },
  memoryMiniCloudRight: {
    right: 10,
    top: 10,
  },
  memoryMiniSparkVertical: {
    position: 'absolute',
    width: 5,
    height: 26,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  memoryMiniSparkHorizontal: {
    position: 'absolute',
    width: 26,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  memoryPeaceLeaf: {
    position: 'absolute',
    width: 20,
    height: 11,
    borderRadius: 11,
    backgroundColor: colors.secondary,
  },
  memoryPeaceLeafLeft: {
    left: 9,
    top: 17,
    transform: [{ rotate: '-28deg' }],
  },
  memoryPeaceLeafRight: {
    right: 9,
    top: 17,
    transform: [{ rotate: '28deg' }],
  },
  memoryPeaceStem: {
    position: 'absolute',
    bottom: 9,
    width: 3,
    height: 20,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  memorySoftArt: {
    width: 58,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  softBlob: {
    position: 'absolute',
    width: 52,
    height: 36,
    borderRadius: 24,
  },
  softCircle: {
    position: 'absolute',
    borderRadius: 999,
  },
  softDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.card,
  },
  softPill: {
    position: 'absolute',
    borderRadius: 999,
  },
  calmBlob: {
    backgroundColor: colors.softGreen,
    transform: [{ rotate: '-8deg' }],
  },
  calmDot: {
    left: 15,
    top: 13,
  },
  calmPill: {
    right: 3,
    top: 7,
    width: 22,
    height: 12,
    backgroundColor: colors.secondary,
    transform: [{ rotate: '-28deg' }],
  },
  restBlob: {
    backgroundColor: colors.softPurple,
    transform: [{ rotate: '8deg' }],
  },
  restMoon: {
    width: 28,
    height: 28,
    backgroundColor: colors.softYellow,
    left: 17,
    top: 9,
  },
  restMoonCutout: {
    width: 24,
    height: 24,
    backgroundColor: colors.softPurple,
    left: 25,
    top: 7,
  },
  hopeBlob: {
    backgroundColor: '#FFF2C4',
    transform: [{ rotate: '-10deg' }],
  },
  hopeSun: {
    width: 28,
    height: 28,
    backgroundColor: colors.softYellow,
    left: 15,
    top: 9,
  },
  hopeRayOne: {
    width: 30,
    height: 8,
    backgroundColor: colors.accent,
    transform: [{ rotate: '28deg' }],
  },
  hopeRayTwo: {
    width: 26,
    height: 8,
    backgroundColor: colors.accent,
    transform: [{ rotate: '-32deg' }],
  },
  kindBlob: {
    backgroundColor: '#FFF2C4',
  },
  kindHeartPart: {
    position: 'absolute',
    top: 12,
    width: 21,
    height: 21,
    borderRadius: 12,
    backgroundColor: colors.softOrange,
  },
  kindHeartLeft: {
    left: 16,
  },
  kindHeartRight: {
    right: 16,
  },
  kindHeartPoint: {
    position: 'absolute',
    top: 22,
    width: 23,
    height: 23,
    backgroundColor: colors.softOrange,
    transform: [{ rotate: '45deg' }],
  },
  releaseBlob: {
    backgroundColor: colors.softGray,
  },
  cloudCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: colors.card,
  },
  cloudOne: {
    left: 10,
    top: 14,
    width: 24,
    height: 24,
  },
  cloudTwo: {
    right: 10,
    top: 10,
    width: 28,
    height: 28,
  },
  cloudBase: {
    position: 'absolute',
    bottom: 8,
    width: 42,
    height: 18,
    borderRadius: 18,
    backgroundColor: colors.card,
  },
  lightBackCard: {
    position: 'absolute',
    width: 44,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.softPurple,
    transform: [{ rotate: '-10deg' }],
  },
  lightFrontCard: {
    position: 'absolute',
    width: 44,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightCenter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.softYellow,
  },
  lightSparkOne: {
    position: 'absolute',
    width: 16,
    height: 4,
    borderRadius: 3,
    backgroundColor: colors.accent,
    transform: [{ rotate: '40deg' }],
  },
  lightSparkTwo: {
    position: 'absolute',
    width: 4,
    height: 16,
    borderRadius: 3,
    backgroundColor: colors.accent,
    transform: [{ rotate: '40deg' }],
  },
  memoryResult: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  memoryResultTitle: {
    color: colors.primary,
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 4,
  },
  memoryResultText: {
    color: colors.subtext,
    fontSize: 15,
  },
  heartValue: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.accent,
    minHeight: 42,
  },
  gameBoard: {
    width: '100%',
    height: 430,
    backgroundColor: '#EFE3D7',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 20,
  },
  highScoreCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  highScoreLabel: {
    color: colors.subtext,
    fontSize: 15,
    fontWeight: '700',
  },
  highScoreValue: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '800',
  },
  breakoutBoard: {
    width: '100%',
    height: 430,
    backgroundColor: '#EFE3D7',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 20,
  },
  breakoutBrick: {
    position: 'absolute',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakoutDrop: {
    position: 'absolute',
    width: 28,
    height: 28,
    marginLeft: -14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(226, 154, 82, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakoutBonusDrop: {
    backgroundColor: 'rgba(246, 227, 163, 0.78)',
    borderColor: 'rgba(107, 74, 54, 0.24)',
  },
  breakoutBonusTwoDrop: {
    backgroundColor: 'rgba(220, 231, 200, 0.86)',
    borderColor: 'rgba(168, 190, 123, 0.44)',
  },
  breakoutBonusThreeDrop: {
    backgroundColor: 'rgba(246, 227, 163, 0.88)',
    borderColor: 'rgba(226, 154, 82, 0.34)',
  },
  breakoutBonusFiveDrop: {
    backgroundColor: 'rgba(244, 210, 174, 0.9)',
    borderColor: 'rgba(107, 74, 54, 0.3)',
  },
  breakoutDropText: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 22,
  },
  breakoutBonusDropText: {
    color: colors.primary,
    fontSize: 13,
    lineHeight: 16,
  },
  breakoutBonusFiveDropText: {
    color: colors.primary,
  },
  breakoutBall: {
    position: 'absolute',
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.86)',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 2,
  },
  breakoutPaddle: {
    position: 'absolute',
    bottom: 30,
    height: 16,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  breakoutHeartValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.accent,
    minHeight: 34,
  },
  heartsInBoard: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 6,
  },
  scoreInBoard: {
    position: 'absolute',
    top: 18,
    left: 18,
    zIndex: 6,
  },
  scoreText: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  centerMessage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  centerText: {
    fontSize: 19,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 29,
    maxWidth: 620,
  },
  bubble: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.86)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: -3, height: -3 },
    shadowOpacity: 0.85,
    shadowRadius: 10,
    elevation: 2,
  },
  normalBubble: {
    backgroundColor: 'rgba(220, 231, 200, 0.58)',
  },
  bonusBubble: {
    backgroundColor: 'rgba(246, 227, 163, 0.62)',
  },
  heartBubble: {
    backgroundColor: 'rgba(244, 210, 174, 0.66)',
  },
  requiredBubble: {
    backgroundColor: 'rgba(226, 154, 82, 0.62)',
  },
  bubbleHighlight: {
    position: 'absolute',
    top: 10,
    left: 13,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
  },
  bubbleShine: {
    position: 'absolute',
    right: 12,
    bottom: 14,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.68)',
  },
  bubbleText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 46,
    borderRadius: 18,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 15,
    paddingHorizontal: 34,
    borderRadius: 18,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  pauseBadge: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 18,
    zIndex: 5,
  },
  pauseBadgeText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
});
