/** Default programming for TVs with no live game — so the board is never blank. */
export interface FillerProgram {
  name: string;
  network: string;
  note: string;
}

export const FILLER_PROGRAMS: FillerProgram[] = [
  { name: "SportsCenter", network: "ESPN", note: "Highlights & scores — the house default when nothing's live." },
  { name: "Golf Channel", network: "Golf Channel", note: "Always-on golf programming — easy background." },
  { name: "First Take / Get Up", network: "ESPN", note: "ESPN morning debate & studio shows." },
  { name: "MLB Network", network: "MLB Network", note: "Around-the-league baseball studio coverage." },
  { name: "NBA TV", network: "NBA TV", note: "NBA studio shows & classic games." },
  { name: "NFL Network", network: "NFL Network", note: "NFL news, Good Morning Football, replays." },
];
