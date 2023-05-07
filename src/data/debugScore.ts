import { Score, ScoreChord } from 'data/Score'



const [
  c4,
  cs4,
  d4,
  ds4,
  e4,
  f4,
  fs4,
  g4,
  gs4,
  a4,
  as4,
  b4,
  c5,
] = Array.from({ length: 13 }, (_, i) => i + 60)



const chord = (startBeat: number, ...pitches: number[]): ScoreChord => ({
  startBeat,
  pitches: new Set(pitches),
})


export const debugScore: Score = [
  chord(0, f4),
  chord(1.5, c4),
  chord(2, f4),
  chord(3.5, c4),
  chord(4, f4),
  chord(4.5, c4),
  chord(5, f4),
  chord(5.5, a4),
  chord(6, c5),
  chord(8, as4),
  chord(9.5, g4),
  chord(10, as4),
  chord(11.5, g4),
  chord(12, as4),
  chord(12.5, g4),
  chord(13, e4),
  chord(13.5, g4),
  chord(14, c4),
  chord(16, c4, f4, a4, c5),
]

