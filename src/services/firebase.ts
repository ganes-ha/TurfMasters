import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
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
  getDatabase, 
  ref as rtdbRef, 
  set as rtdbSet, 
  remove as rtdbRemove,
  get as rtdbGet,
  Database 
} from 'firebase/database';
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

import firebaseConfig from '../firebaseConfig';
import { Match, MatchHistoryEntry, Tournament, UserRole, UserSession } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with default database
export const db = (firebaseConfig.firestoreDatabaseId && 
  firebaseConfig.firestoreDatabaseId !== '(default)' && 
  !firebaseConfig.firestoreDatabaseId.startsWith('ai-studio-')) 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Realtime Database (RTDB)
export const rtdb: Database | null = (() => {
  try {
    return getDatabase(app);
  } catch (err) {
    console.warn('Realtime Database initialization warning:', err);
    return null;
  }
})();

// Helper to safely write to Realtime Database
const safeRtdbSet = async (path: string, value: any): Promise<void> => {
  if (!rtdb) return;
  try {
    const dbRef = rtdbRef(rtdb, path);
    await rtdbSet(dbRef, value);
  } catch (e) {
    console.warn(`RTDB set at ${path} notice:`, e);
  }
};

// Realtime Database cleanup for live match and history
const safeRtdbRemove = async (path: string): Promise<void> => {
  if (!rtdb) return;
  try {
    const dbRef = rtdbRef(rtdb, path);
    await rtdbRemove(dbRef);
  } catch (e) {
    console.warn(`RTDB remove at ${path} notice:`, e);
  }
};

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

    const rtdbPayload = {
      id: matchIdStr,
      status: match.status || 'live',
      matchData: sanitizedMatch,
      updatedAt: Date.now()
    };

    // Parallel non-blocking sync with merge to Firestore and RTDB
    await Promise.allSettled([
      setDoc(matchRef, payload, { merge: true }),
      setDoc(activeRef, payload, { merge: true }),
      safeRtdbSet(`matches/${matchIdStr}`, rtdbPayload),
      safeRtdbSet('matches/active_match', rtdbPayload)
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
      await Promise.allSettled([
        deleteDoc(doc(db, 'matches', matchId)),
        safeRtdbRemove(`matches/${matchId}`)
      ]);
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
    
    // Deep clone to strip undefined fields which Firestore rejects
    const cleanEntry = JSON.parse(JSON.stringify(historyEntry));
    const timestamp = typeof historyEntry.id === 'number' 
      ? historyEntry.id 
      : (historyEntry.date ? new Date(historyEntry.date).getTime() : Date.now());

    await Promise.allSettled([
      setDoc(historyRef, {
        ...cleanEntry,
        createdAt: timestamp,
        updatedAt: Date.now()
      }, { merge: true }),
      safeRtdbSet(`match_history/${docId}`, {
        ...cleanEntry,
        createdAt: timestamp,
        updatedAt: Date.now()
      })
    ]);
  } catch (err) {
    console.error('Failed to archive match to cloud:', err);
  }
};

/**
 * Syncs multiple historical matches to cloud if not already synced
 */
export const syncLocalHistoryToCloud = async (localHistory: MatchHistoryEntry[]): Promise<void> => {
  if (!localHistory || localHistory.length === 0) return;
  try {
    for (const item of localHistory) {
      await saveMatchHistoryToCloud(item);
    }
  } catch (err) {
    console.warn('Sync local history batch warning:', err);
  }
};

/**
 * Real-time listener for all match archives
 */
export const subscribeToMatchHistory = (
  onUpdate: (history: MatchHistoryEntry[]) => void
): Unsubscribe => {
  const historyCol = collection(db, 'match_history');

  return onSnapshot(historyCol, (snapshot) => {
    const records: MatchHistoryEntry[] = [];
    snapshot.forEach((doc) => {
      records.push(doc.data() as MatchHistoryEntry);
    });
    // In-memory sort by timestamp descending
    records.sort((a, b) => {
      const timeA = (a as any).createdAt || (a.date ? new Date(a.date).getTime() : (typeof a.id === 'number' ? a.id : 0));
      const timeB = (b as any).createdAt || (b.date ? new Date(b.date).getTime() : (typeof b.id === 'number' ? b.id : 0));
      return timeB - timeA;
    });
    onUpdate(records);
  }, (error) => {
    console.warn('Real-time history subscription error:', error);
  });
};

/**
 * Actively fetches all archived match records from Cloud Firestore and Realtime Database.
 * This can be triggered on demand or on new devices when local storage is cleared.
 */
export const fetchMatchHistoryFromCloud = async (): Promise<MatchHistoryEntry[]> => {
  const recordsMap = new Map<string | number, MatchHistoryEntry>();

  // 1. Fetch from Firestore match_history collection
  try {
    const historyCol = collection(db, 'match_history');
    const snap = await getDocs(historyCol);
    snap.forEach((d) => {
      const data = d.data() as MatchHistoryEntry;
      if (data && (data.id || d.id)) {
        const id = data.id || d.id;
        recordsMap.set(id, { ...data, id });
      }
    });
  } catch (err) {
    console.warn('Firestore fetch match_history notice:', err);
  }

  // 2. Also query Realtime Database match_history as dual-redundant backup
  if (rtdb) {
    try {
      const snap = await rtdbGet(rtdbRef(rtdb, 'match_history'));
      if (snap.exists()) {
        const val = snap.val();
        if (val && typeof val === 'object') {
          Object.entries(val).forEach(([k, item]: [string, any]) => {
            if (item && (item.id || k)) {
              const id = item.id || k;
              if (!recordsMap.has(id)) {
                recordsMap.set(id, { ...item, id });
              }
            }
          });
        }
      }
    } catch (err) {
      console.warn('RTDB fetch match_history notice:', err);
    }
  }

  // 3. Fallback check: If still empty, check matches collection for any completed matches
  if (recordsMap.size === 0) {
    try {
      const matchesCol = collection(db, 'matches');
      const snap = await getDocs(matchesCol);
      snap.forEach((d) => {
        const data = d.data();
        if (data && data.matchData && (data.matchData.status === 'completed' || data.matchData.result)) {
          const m: Match = data.matchData;
          const entry: MatchHistoryEntry = {
            id: m.id,
            date: m.date,
            teamA: m.teamA.name,
            teamB: m.teamB.name,
            result: m.result || 'Completed',
            inn1: `${m.inn1.total}/${m.inn1.wickets}`,
            inn2: `${m.inn2 ? m.inn2.total : 0}/${m.inn2 ? m.inn2.wickets : 0}`,
            overs: m.overs,
            awards: m.awards,
            tournamentId: m.tournamentId,
            tournamentName: m.tournamentName,
            full: m
          };
          recordsMap.set(entry.id, entry);
          saveMatchHistoryToCloud(entry);
        }
      });
    } catch (err) {
      console.warn('Recover from matches collection notice:', err);
    }
  }

  // 4. Sort descending by creation date or timestamp
  const records = Array.from(recordsMap.values());
  records.sort((a, b) => {
    const timeA = (a as any).createdAt || (a.date ? new Date(a.date).getTime() : (typeof a.id === 'number' ? a.id : 0));
    const timeB = (b as any).createdAt || (b.date ? new Date(b.date).getTime() : (typeof b.id === 'number' ? b.id : 0));
    return timeB - timeA;
  });

  return records;
};

/**
 * Deletes a match from cloud archive
 */
export const deleteMatchHistoryFromCloud = async (historyId: string | number): Promise<void> => {
  try {
    const docId = String(historyId);
    await Promise.allSettled([
      deleteDoc(doc(db, 'match_history', docId)),
      safeRtdbRemove(`match_history/${docId}`)
    ]);
  } catch (err) {
    console.error('Failed to delete match history entry:', err);
  }
};

/**
 * Clears all match history entries from cloud archive
 */
export const clearAllMatchHistoryFromCloud = async (historyList: MatchHistoryEntry[]): Promise<void> => {
  try {
    for (const h of historyList) {
      await deleteMatchHistoryFromCloud(h.id);
    }
  } catch (err) {
    console.error('Failed to clear all match history from cloud:', err);
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
    const cleanTourn = JSON.parse(JSON.stringify(tournament));
    await Promise.allSettled([
      setDoc(tournRef, {
        ...cleanTourn,
        updatedAt: Date.now()
      }, { merge: true }),
      safeRtdbSet(`tournaments/${tournament.id}`, {
        ...cleanTourn,
        updatedAt: Date.now()
      })
    ]);
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
    await Promise.allSettled([
      deleteDoc(doc(db, 'tournaments', tournamentId)),
      safeRtdbRemove(`tournaments/${tournamentId}`)
    ]);
  } catch (err) {
    console.error('Failed to delete tournament from cloud:', err);
  }
};

/**
 * Initial sync helper to write active live match and match history only
 */
export const seedAndSyncAllData = async (
  currentMatch: Match | null,
  historyList: MatchHistoryEntry[]
): Promise<void> => {
  try {
    if (historyList && historyList.length > 0) {
      for (const h of historyList) {
        await saveMatchHistoryToCloud(h);
      }
    }
    if (currentMatch) {
      await performLiveSync(currentMatch);
    }
  } catch (e) {
    console.warn('Initial cloud seed warning:', e);
  }
};
