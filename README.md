# CricVault - Box Cricket Live Scoring & Tournament Suite

A box cricket scoring and live tournament match center with real-time ball-by-ball updates, live audio commentary, multi-match management, cloud persistence, and high-visibility outdoor themes.

---

## 📋 Comprehensive Feature & Changelog History

### 1. ⚙️ Match Engine & Custom Box Cricket Rules
- **Flexible Team & Player Setup**:
  - Custom team names, logos, player rosters, and common players (box cricket joker/neutral player).
  - Common player rule enforcement (preventing common player from batting and bowling against same side illegally).
- **Match Configurations**:
  - Configurable overs (3, 4, 5, 6, 8, 10, 12, 15, 20 overs).
  - Bowler over quotas (e.g. Max 1, 2, or 3 overs per bowler).
  - Extra delivery penalties & box rules (Wide = 1 run, No-Ball = 1 run + Free Hit, Bye, Leg-Bye, Box boundary overrides).
- **Innings 1 & Innings 2 Launch Modals ("Begin Innings")**:
  - **Innings 1 Modal**: Displays toss winner & election (bat/bowl), total overs & total legal deliveries, bowler quotas, and interactive opener/bowler pickers.
  - **Innings 2 Modal**: Real-time target calculator, runs required, balls remaining, Required Run Rate (RRR), and Current Run Rate (CRR).

---

### 2. ⚡ Live Scoring Engine & Real-Time Ball-by-Ball
- **Scoring Keypad**:
  - Instant scoring buttons (`0`, `1`, `2`, `3`, `4`, `6`, `Wicket`, `Wide`, `No Ball`, `Bye`, `Leg Bye`).
  - Strike auto-rotation on odd runs (1, 3, 5) and end-of-over changeover.
  - Strike manual toggle switch (`🔄 Swap Strike`).
  - Change bowler and change batsman controls with validation.
- **Wicket Workflow**:
  - Dismissal types: Bowled, Caught, Run Out (Striker/Non-Striker), Stumped, LBW, Hit Wicket, Retired Hurt.
  - Dynamic replacement modal allowing any eligible squad player to take the crease.
  - **Robust All-Out Engine**: Dynamically calculates squad dismissals and finishes the innings when max wickets fall or fewer than 2 active batsmen remain, even after multiple in-match batsman swaps.
- **Undo / Delivery Revision**:
  - Full delivery stack undo system that accurately rolls back runs, bowler stats, batsman scores, strike position, and over counts.

---

### 3. 🎙️ AI & Voice Commentary (Live Multilingual Audio)
- **Live Ball-by-Ball Voice Broadcast**:
  - Automatic speech synthesis on every delivery, boundary, wicket, milestone, and free hit.
  - Multilingual voice support with regional Indian & global accents (Hindi, English - Indian accent, English - UK, English - US, Tamil, Telugu, Kannada, Bengali).
  - Configurable commentary styles (Excited T20, Radio broadcast, Minimal, Technical).
  - Mute/Unmute quick toggle directly in the scoring header.

---

### 4. 📊 Scorecard, Wagon Wheel & Match Analytics
- **Live Match Center**:
  - Tabbed interface: **Live Scoring**, **Full Scorecard**, **Ball-by-Ball Timeline**, **Wagon Wheel & Pitch Map**, **Match Summary & Awards**.
- **Full Batting & Bowling Scorecards**:
  - Batting: Runs, Balls, 4s, 6s, Strike Rate (SR), Dismissal info.
  - Bowling: Overs (`O.B`), Maidens, Runs conceded, Wickets taken, Economy Rate (Econ), Extra counts (Wides/No-Balls).
  - Fall of Wickets (FOW) timeline.
- **Man of the Match & Individual Awards**:
  - Automated MVP / Man of the Match calculation based on batting impact, strike rate, wickets, and economy.
  - Best Batter, Best Bowler, and Maximum Sixes awards.

---

### 5. 🎨 Multi-Theme System & Anti-Glare Visuals
- **Theme Switcher** (Accessible anytime via the top navigation bar):
  - 🌙 **Midnight Slate (Default)**: Eye-friendly, low-glare dark palette designed for evening games and indoor scoring without neon eye fatigue.
  - ☀️ **Daylight Outdoor Mode**: High-contrast, clean sunlight mode specifically built for outdoor matches under bright sunlight.
  - 🌲 **Stadium Forest**: Premium turf green palette with crisp contrast.
- **Responsive Layout**: Designed for mobile touch interaction (44px+ touch targets) and fluid desktop widescreen display.

---

### 6. ☁️ Real-time Cloud Synchronization (Firebase Firestore)
- **Real-Time Live Sharing**:
  - Instant spectator link generation (`/view/:matchId`) allowing spectators, players, and pavilion viewers to watch ball-by-ball updates with sub-second latency.
- **Match History & Cloud Storage**:
  - Past matches archive with filterable search, date, result summary, and full replay scorecard access.
- **User Roles & Security**:
  - Match scorer vs. live spectator view modes.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18+ with TypeScript & Vite |
| **Styling** | Tailwind CSS with custom theme variables |
| **Icons** | Lucide React |
| **Animations** | Motion (`motion/react`) |
| **Persistence** | Firebase Cloud Firestore |
| **Speech & Commentary** | Web Speech API Synthesis Engine |
| **State Architecture** | Modular React state with immutable delivery ledger |

---

## 📂 Project Directory Structure

```
├── src/
│   ├── App.tsx                     # Primary match state, routing, and controller
│   ├── types.ts                    # TypeScript definitions for Match, Innings, Delivery, Player
│   ├── components/
│   │   ├── LiveScoringScreen.tsx   # Scoring keypad, live batsman/bowler cards, controls
│   │   ├── ScorecardView.tsx       # Detailed batting & bowling tabular scorecard
│   │   ├── StartInningsModal.tsx   # Innings 1 & 2 launch setup & target banner
│   │   ├── SelectBatsmanModal.tsx  # Dynamic batter replacement & opener picker
│   │   ├── SelectBowlerModal.tsx   # Bowler selector with quota checks
│   │   ├── WicketModal.tsx         # Dismissal types & run-out player picker
│   │   ├── MatchSummaryModal.tsx   # Match result, awards, and scorecard exporter
│   │   ├── Navbar.tsx              # Top navigation, theme switcher, voice toggle
│   │   ├── NewMatchModal.tsx       # Team configuration & match rules form
│   │   └── ShareMatchModal.tsx     # Spectator QR & live share URL generator
│   ├── lib/
│   │   └── firebase.ts             # Firestore connection & sync handlers
│   └── index.css                   # Tailwind CSS styling and theme definitions
├── metadata.json                   # Applet configuration and metadata
└── README.md                       # Complete documentation and change history
```
