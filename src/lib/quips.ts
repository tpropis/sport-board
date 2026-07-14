/** Sports-bar attitude for the home / login screens. Clean, but with a pour of
 *  swagger. Kept short so they read fast on a busy night. */
export const QUIPS: string[] = [
  "A sports bar without sports — or the wrong channel — just doesn't make sense.",
  "Every TV has a job. Give it one.",
  "That game was scheduled a year ago. Let's not fumble the channel.",
  "Seven TVs, one plan, zero “what game is this?”",
  "The remote is mightier than the sword — especially during a blackout.",
  "Big game on five screens. Softball on one. That's just math.",
  "Know the channel before they finish ordering the wings.",
  "Music stays on. Unless the Braves say otherwise.",
  "No more bartenders playing channel roulette.",
  "If it's on the premium tier, somebody's paying for it. Make it count.",
  "The only thing worse than no sports is the wrong sport.",
  "Blackouts are for power outages, not your board.",
];

export function randomQuip(): string {
  return QUIPS[Math.floor(Math.random() * QUIPS.length)];
}
