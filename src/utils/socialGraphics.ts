/**
 * Social & Viral Loop Engine: WhatsApp Sharing, HTML5 Canvas Poster Generator, & QR Code
 */

import QRCode from 'qrcode';
import { Match, MatchAwards } from '../types';
import { oversStr } from './cricketRules';

/**
 * 1-Click WhatsApp Formatted Match Summary
 */
export function generateWhatsAppSummary(match: Match, viewerUrl?: string): string {
  if (!match) return '';

  const awards: MatchAwards | undefined = match.awards;
  const inn1 = match.inn1;
  const inn2 = match.inn2;

  const team1Name = match.battingFirst === 'A' ? match.teamA.name : match.teamB.name;
  const team2Name = match.battingFirst === 'A' ? match.teamB.name : match.teamA.name;

  const inn1Score = inn1 ? `${inn1.total}/${inn1.wickets} (${oversStr(inn1.legalBalls)} ov)` : 'Yet to bat';
  const inn2Score = inn2 ? `${inn2.total}/${inn2.wickets} (${oversStr(inn2.legalBalls)} ov)` : 'Yet to bat';

  let text = `🏏 *CRICVAULT MATCH SUMMARY*\n`;
  text += `━━━━━━━━━━━━━━━━━━\n`;
  text += `⚔️ *${match.teamA.name}* vs *${match.teamB.name}*\n`;
  text += `📅 ${new Date(match.date).toLocaleDateString()} | ${match.overs} Overs Match\n\n`;

  text += `📊 *Scorecard:*\n`;
  text += `1️⃣ *${team1Name}:* ${inn1Score}\n`;
  text += `2️⃣ *${team2Name}:* ${inn2Score}\n\n`;

  if (match.result) {
    text += `🏆 *Result:* ${match.result}\n\n`;
  }

  if (awards) {
    text += `⭐ *MATCH HONORS:*\n`;
    text += `👑 *Player of the Match:* ${awards.manOfTheMatch}\n`;
    text += `🏏 *Best Batter:* ${awards.bestBatsman}\n`;
    text += `🎳 *Best Bowler:* ${awards.bestBowler}\n\n`;
  }

  // Top performers breakdown
  const topBatters: { name: string; runs: number; balls: number; fours: number; sixes: number }[] = [];
  [inn1, inn2].forEach(inn => {
    if (!inn) return;
    inn.batting.forEach(b => {
      if (b.runs >= 10 || b.sixes >= 1) {
        topBatters.push({ name: b.name, runs: b.runs, balls: b.balls, fours: b.fours, sixes: b.sixes });
      }
    });
  });
  topBatters.sort((a, b) => b.runs - a.runs);

  if (topBatters.length > 0) {
    text += `💥 *Top Batters:*\n`;
    topBatters.slice(0, 3).forEach(b => {
      text += `• ${b.name}: ${b.runs} (${b.balls}b, 4s:${b.fours}, 6s:${b.sixes})\n`;
    });
    text += `\n`;
  }

  if (viewerUrl) {
    text += `📱 *Live Ball-by-Ball Scorecard:*\n${viewerUrl}\n\n`;
  }

  text += `⚡ Powered by CricVault`;
  return text;
}

export function shareToWhatsApp(match: Match, viewerUrl?: string) {
  const summary = generateWhatsAppSummary(match, viewerUrl);
  const encoded = encodeURIComponent(summary);
  window.open(`https://wa.me/?text=${encoded}`, '_blank');
}

/**
 * Generate High-Resolution Poster Graphic on HTML5 Canvas
 */
export async function generateMatchPosterCanvas(
  match: Match,
  aspectRatio: 'story' | 'feed' = 'story'
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not supported');

  // Dimensions
  const width = 1080;
  const height = aspectRatio === 'story' ? 1920 : 1080;
  canvas.width = width;
  canvas.height = height;

  // Background gradient: Dark luxury emerald turf
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#04160e');
  bgGrad.addColorStop(0.4, '#092518');
  bgGrad.addColorStop(0.8, '#061a12');
  bgGrad.addColorStop(1, '#020b07');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle turf texture / pitch grid lines
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.04)';
  ctx.lineWidth = 2;
  for (let i = 0; i < width; i += 60) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, height);
    ctx.stroke();
  }
  for (let j = 0; j < height; j += 60) {
    ctx.beginPath();
    ctx.moveTo(0, j);
    ctx.lineTo(width, j);
    ctx.stroke();
  }

  // Top Glowing Orb
  const orb = ctx.createRadialGradient(width / 2, 200, 10, width / 2, 200, 450);
  orb.addColorStop(0, 'rgba(34, 197, 94, 0.18)');
  orb.addColorStop(1, 'rgba(34, 197, 94, 0)');
  ctx.fillStyle = orb;
  ctx.fillRect(0, 0, width, 600);

  // Top CricVault Header
  ctx.textAlign = 'center';
  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 36px "Outfit", sans-serif';
  ctx.fillText('🏏 CRICVAULT TURF LEAGUE', width / 2, 100);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 24px "Plus Jakarta Sans", sans-serif';
  const matchDate = new Date(match.date).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  ctx.fillText(`${matchDate}  •  ${match.overs} Overs Match`, width / 2, 145);

  // Divider line
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(140, 180);
  ctx.lineTo(width - 140, 180);
  ctx.stroke();

  // Matchup Section (Team A vs Team B)
  const inn1 = match.inn1;
  const inn2 = match.inn2;
  const team1Name = match.battingFirst === 'A' ? match.teamA.name : match.teamB.name;
  const team2Name = match.battingFirst === 'A' ? match.teamB.name : match.teamA.name;
  const inn1Score = inn1 ? `${inn1.total}/${inn1.wickets}` : '0/0';
  const inn1Overs = inn1 ? `${oversStr(inn1.legalBalls)} ov` : '0.0 ov';
  const inn2Score = inn2 ? `${inn2.total}/${inn2.wickets}` : '0/0';
  const inn2Overs = inn2 ? `${oversStr(inn2.legalBalls)} ov` : '0.0 ov';

  const startY = aspectRatio === 'story' ? 240 : 220;

  // Box 1: Team 1
  drawTeamCard(ctx, 80, startY, 420, 220, team1Name, inn1Score, inn1Overs, '#16a34a');

  // "VS" Badge
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(width / 2, startY + 110, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c1917';
  ctx.font = '900 28px "Outfit", sans-serif';
  ctx.fillText('VS', width / 2, startY + 120);

  // Box 2: Team 2
  drawTeamCard(ctx, width - 500, startY, 420, 220, team2Name, inn2Score, inn2Overs, '#3b82f6');

  // Result Banner
  const resultY = startY + 280;
  ctx.fillStyle = 'rgba(18, 44, 35, 0.9)';
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2;
  roundRect(ctx, 80, resultY, width - 160, 90, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#22c55e';
  ctx.font = '800 38px "Outfit", sans-serif';
  ctx.fillText(match.result || 'Match Completed', width / 2, resultY + 58);

  // Awards Section
  const awards = match.awards;
  if (awards) {
    const awardsY = resultY + 140;

    // MVP Gold Box
    const mvpGrad = ctx.createLinearGradient(80, awardsY, width - 80, awardsY + 200);
    mvpGrad.addColorStop(0, 'rgba(202, 138, 4, 0.25)');
    mvpGrad.addColorStop(1, 'rgba(180, 83, 9, 0.15)');
    ctx.fillStyle = mvpGrad;
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    roundRect(ctx, 80, awardsY, width - 160, 190, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = '800 24px "Outfit", sans-serif';
    ctx.fillText('👑 PLAYER OF THE MATCH', width / 2, awardsY + 44);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 52px "Outfit", sans-serif';
    ctx.fillText(awards.manOfTheMatch, width / 2, awardsY + 110);

    if (awards.momReason) {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(awards.momReason, width / 2, awardsY + 155);
    }

    // Best Batter & Best Bowler 2-col cards
    const subAwardsY = awardsY + 220;
    const cardW = (width - 160 - 30) / 2;

    // Best Batter Card
    drawSubAward(ctx, 80, subAwardsY, cardW, 140, '🏏 BEST BATTER', awards.bestBatsman, '#38bdf8');

    // Best Bowler Card
    drawSubAward(ctx, 80 + cardW + 30, subAwardsY, cardW, 140, '🎳 BEST BOWLER', awards.bestBowler, '#a855f7');
  }

  // Footer Branding & QR Code Note (for Story mode)
  if (aspectRatio === 'story') {
    const footerY = height - 280;

    // Mini stats highlights
    ctx.fillStyle = 'rgba(26, 58, 46, 0.8)';
    ctx.strokeStyle = '#1e4d3a';
    ctx.lineWidth = 1.5;
    roundRect(ctx, 80, footerY, width - 160, 160, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f0fdf4';
    ctx.font = '700 26px "Outfit", sans-serif';
    ctx.fillText('HIT HARD. STAY IN.', width / 2, footerY + 55);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Live Turf Scoring • Real-time Points Table • Player Badges', width / 2, footerY + 105);

    // Bottom App credit
    ctx.fillStyle = 'rgba(34, 197, 94, 0.8)';
    ctx.font = '800 28px "Outfit", sans-serif';
    ctx.fillText('CricVault Scorekeeper', width / 2, height - 50);
  } else {
    // Feed bottom
    ctx.fillStyle = 'rgba(34, 197, 94, 0.8)';
    ctx.font = '800 24px "Outfit", sans-serif';
    ctx.fillText('CricVault Scorekeeper', width / 2, height - 30);
  }

  return canvas;
}

function drawTeamCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  teamName: string,
  score: string,
  overs: string,
  accentColor: string
) {
  ctx.fillStyle = 'rgba(18, 44, 35, 0.95)';
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2.5;
  roundRect(ctx, x, y, w, h, 20);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f0fdf4';
  ctx.font = '800 34px "Outfit", sans-serif';
  ctx.fillText(teamName, x + w / 2, y + 55);

  ctx.fillStyle = accentColor;
  ctx.font = '900 64px "Outfit", sans-serif';
  ctx.fillText(score, x + w / 2, y + 135);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(overs, x + w / 2, y + 185);
}

function drawSubAward(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  value: string,
  color: string
) {
  ctx.fillStyle = 'rgba(18, 44, 35, 0.9)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.font = '800 22px "Outfit", sans-serif';
  ctx.fillText(title, x + w / 2, y + 42);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(value, x + w / 2, y + 95);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Generate Spectator QR Code Data URL
 */
export async function generateSpectatorQRCode(spectatorUrl: string): Promise<string> {
  try {
    return await QRCode.toDataURL(spectatorUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#052e16',
        light: '#f0fdf4'
      }
    });
  } catch (err) {
    console.error('QR Code generation failed:', err);
    return '';
  }
}
