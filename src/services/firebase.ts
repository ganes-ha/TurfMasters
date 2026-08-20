import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  serverTimestamp,
  Unsubscribe 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously as fbSignInAnonymously, 
  signInWithEmailAndPassword as fbSignInWithEmail,
  createUserWithEmailAndPassword as fbCreateWithEmail,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';

import firebaseConfig from '../../firebase-applet-config.json';
import { Match, MatchHistoryEntry, Tournament, UserRole, UserSession } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom database ID if provided
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);

/* ============================================================
   AUTHENTICATION & USER PROFILE SERVICES
   ============================================================ */

export interface CloudUserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: number;
}

export const subscribeToAuthChanges = (
  callback: (userSession: UserSession | null, fbUser: FirebaseUser | null) => void
): Unsubscribe => {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      callback(null, null);
      return;
    }

    try {
      // Fetch Firestore profile for role verification
      const userRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data() as CloudUserProfile;
        callback({
          uid: fbUser.uid,
          email: fbUser.email || '',
          username: fbUser.email ? fbUser.email.split('@')[0] : 'user_' + fbUser.uid.slice(0, 5),
          role: data.role || 'viewer',
          name: data.name || fbUser.displayName || 'Cricket Fan',
          isCloudAuth: true
        }, fbUser);
      } else {
        // Fallback for default user
        callback({
          uid: fbUser.uid,
          email: fbUser.email || '',
          username: fbUser.email ? fbUser.email.split('@')[0] : 'viewer_' + fbUser.uid.slice(0, 5),
          role: 'viewer',
          name: fbUser.displayName || 'Guest Spectator',
          isCloudAuth: true
        }, fbUser);
      }
    } catch (err) {
      console.warn('Could not fetch cloud profile, using fallback:', err);
      callback({
        uid: fbUser.uid,
        email: fbUser.email || '',
        username: fbUser.email ? fbUser.email.split('@')[0] : 'user',
        role: 'viewer',
        name: fbUser.displayName || 'Spectator',
        isCloudAuth: true
      }, fbUser);
    }
  });
};

export const loginWithEmail = async (email: string, pass: string): Promise<UserSession> => {
  const cred = await fbSignInWithEmail(auth, email, pass);
  const fbUser = cred.user;
  
  const userRef = doc(db, 'users', fbUser.uid);
  const userSnap = await getDoc(userRef);

  let role: UserRole = 'scorer';
  let name = fbUser.displayName || email.split('@')[0];

  if (userSnap.exists()) {
    const data = userSnap.data() as CloudUserProfile;
    role = data.role || 'scorer';
    name = data.name || name;
  } else {
    // Determine default role based on email or create profile
    if (email.toLowerCase().includes('admin')) {
      role = 'cloudadmin';
    }
    await setDoc(userRef, {
      uid: fbUser.uid,
      email: fbUser.email || email,
      name,
      role,
      createdAt: Date.now()
    }, { merge: true });
  }

  return {
    uid: fbUser.uid,
    email: fbUser.email || email,
    username: email.split('@')[0],
    role,
    name,
    isCloudAuth: true
  };
};

export const registerWithEmail = async (
  email: string, 
  pass: string, 
  name: string, 
  role: UserRole = 'scorer'
): Promise<UserSession> => {
  const cred = await fbCreateWithEmail(auth, email, pass);
  const fbUser = cred.user;

  await updateProfile(fbUser, { displayName: name });

  const userRef = doc(db, 'users', fbUser.uid);
  await setDoc(userRef, {
    uid: fbUser.uid,
    email: fbUser.email || email,
    name,
    role,
    createdAt: Date.now()
  });

  return {
    uid: fbUser.uid,
    email: fbUser.email || email,
    username: email.split('@')[0],
    role,
    name,
    isCloudAuth: true
  };
};

export const loginAsSpectatorGuest = async (customName?: string): Promise<UserSession> => {
  const cred = await fbSignInAnonymously(auth);
  const fbUser = cred.user;
  const name = customName || 'Spectator ' + Math.floor(1000 + Math.random() * 9000);

  const userRef = doc(db, 'users', fbUser.uid);
  await setDoc(userRef, {
    uid: fbUser.uid,
    email: '',
    name,
    role: 'viewer',
    createdAt: Date.now()
  }, { merge: true });

  return {
    uid: fbUser.uid,
    username: 'guest_' + fbUser.uid.slice(0, 5),
    role: 'viewer',
    name,
    isCloudAuth: true
  };
};

export const logoutFromCloud = async (): Promise<void> => {
  await fbSignOut(auth);
};

/* ============================================================
   REAL-TIME LIVE MATCH SYNC (SPECTATOR MODE)
   ============================================================ */

let liveSyncTimer: ReturnType<typeof setTimeout> | null = null;
let pendingMatchToSync: Match | null = null;

const performLiveSync = async (match: Match): Promise<void> => {
  if (!match || !match.id) return;
  try {
    const matchIdStr = String(match.id);
    const matchRef = doc(db, 'matches', matchIdStr);
    const activeRef = doc(db, 'matches', 'active_match');
    
    // Efficient JSON serialization
    const sanitizedMatch = JSON.parse(JSON.stringify(match));

    const payload = {
      id: matchIdStr,
      status: match.status || 'live',
      matchData: sanitizedMatch,
      updatedAt: Date.now(),
      serverUpdated: serverTimestamp()
    };

    // Parallel non-blocking sync with merge to prevent data loss
    await Promise.all([
      setDoc(matchRef, payload, { merge: true }),
      setDoc(activeRef, payload, { merge: true })
    ]);
  } catch (err) {
    console.warn('Live match sync warning (will retry on next ball):', err);
  }
};

/**
 * Pushes live match state to Firestore with a 150ms trailing debounce.
 * This guarantees smooth 60fps UI responsiveness during rapid mobile taps.
 */
export const syncLiveMatchToCloud = (match: Match, immediate: boolean = false): void => {
  if (!match || !match.id) return;
  pendingMatchToSync = match;

  if (immediate) {
    if (liveSyncTimer) {
      clearTimeout(liveSyncTimer);
      liveSyncTimer = null;
    }
    performLiveSync(match);
    return;
  }

  if (liveSyncTimer) clearTimeout(liveSyncTimer);
  liveSyncTimer = setTimeout(() => {
    if (pendingMatchToSync) {
      performLiveSync(pendingMatchToSync);
      pendingMatchToSync = null;
    }
  }, 150);
};

/**
 * Clears active live match when concluded or reset
 */
export const clearLiveMatchFromCloud = async (matchId: string): Promise<void> => {
  try {
    if (matchId) {
      await deleteDoc(doc(db, 'matches', matchId));
    }
  } catch (err) {
    console.error('Failed to delete live match document:', err);
  }
};

/**
 * Real-time listener for spectators watching a specific match
 */
export const subscribeToLiveMatch = (
  matchId: string, 
  onUpdate: (match: Match | null) => void
): Unsubscribe => {
  const targetId = matchId || 'active_match';
  const matchRef = doc(db, 'matches', targetId);

  return onSnapshot(matchRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && data.matchData) {
        onUpdate(data.matchData as Match);
        return;
      }
    }
    onUpdate(null);
  }, (error) => {
    console.warn('Real-time live match subscription error:', error);
  });
};

/**
 * Real-time listener for the active live match across the organization/box turf
 */
export const subscribeToActiveLiveMatch = (
  onUpdate: (match: Match | null) => void
): Unsubscribe => {
  const activeRef = doc(db, 'matches', 'active_match');
  return onSnapshot(activeRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && data.matchData) {
        onUpdate(data.matchData as Match);
        return;
      }
    }
    onUpdate(null);
  }, (error) => {
    console.warn('Real-time active match subscription error:', error);
  });
};

/* ============================================================
   CLOUD MATCH ARCHIVES & STATS
   ============================================================ */

/**
 * Saves a completed match to cloud history archive
 */
export const saveMatchHistoryToCloud = async (historyEntry: MatchHistoryEntry): Promise<void> => {
  try {
    const docId = String(historyEntry.id);
    const historyRef = doc(db, 'match_history', docId);
    
    await setDoc(historyRef, {
      ...historyEntry,
      createdAt: typeof historyEntry.id === 'number' ? historyEntry.id : Date.now(),
      updatedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    console.error('Failed to archive match to cloud:', err);
  }
};

/**
 * Real-time listener for all match archives
 */
export const subscribeToMatchHistory = (
  onUpdate: (history: MatchHistoryEntry[]) => void
): Unsubscribe => {
  const historyCol = collection(db, 'match_history');
  const historyQuery = query(historyCol, orderBy('createdAt', 'desc'), limit(50));

  return onSnapshot(historyQuery, (snapshot) => {
    const records: MatchHistoryEntry[] = [];
    snapshot.forEach((doc) => {
      records.push(doc.data() as MatchHistoryEntry);
    });
    onUpdate(records);
  }, (error) => {
    console.warn('Real-time history subscription error:', error);
  });
};

/**
 * Deletes a match from cloud archive
 */
export const deleteMatchHistoryFromCloud = async (historyId: string | number): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'match_history', String(historyId)));
  } catch (err) {
    console.error('Failed to delete match history entry:', err);
  }
};

/* ============================================================
   CLOUD TOURNAMENTS & LEAGUES
   ============================================================ */

/**
 * Syncs tournament to cloud
 */
export const saveTournamentToCloud = async (tournament: Tournament): Promise<void> => {
  try {
    const tournRef = doc(db, 'tournaments', tournament.id);
    await setDoc(tournRef, {
      ...tournament,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    console.error('Failed to sync tournament to cloud:', err);
  }
};

/**
 * Real-time listener for cloud tournaments
 */
export const subscribeToTournaments = (
  onUpdate: (tournaments: Tournament[]) => void
): Unsubscribe => {
  const tournCol = collection(db, 'tournaments');
  const tournQuery = query(tournCol, limit(50));

  return onSnapshot(tournQuery, (snapshot) => {
    const list: Tournament[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as Tournament);
    });
    onUpdate(list);
  }, (error) => {
    console.warn('Real-time tournament subscription error:', error);
  });
};

/**
 * Deletes tournament from cloud
 */
export const deleteTournamentFromCloud = async (tournamentId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'tournaments', tournamentId));
  } catch (err) {
    console.error('Failed to delete tournament from cloud:', err);
  }
};

/* ============================================================
   CLOUD SQUAD PLAYERS ROSTER
   ============================================================ */

/**
 * Syncs master squad roster to cloud
 */
export const saveSquadPlayersToCloud = async (playersList: string[]): Promise<void> => {
  try {
    const squadRef = doc(db, 'squad_players', 'master_roster');
    await setDoc(squadRef, {
      id: 'master_roster',
      players: playersList,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    console.error('Failed to save squad roster to cloud:', err);
  }
};

/**
 * Real-time listener for squad players roster
 */
export const subscribeToSquadPlayers = (
  onUpdate: (players: string[]) => void
): Unsubscribe => {
  const squadRef = doc(db, 'squad_players', 'master_roster');
  return onSnapshot(squadRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && Array.isArray(data.players) && data.players.length > 0) {
        onUpdate(data.players);
      }
    }
  }, (error) => {
    console.warn('Real-time squad players subscription error:', error);
  });
};
