import { Score, ScoreChord } from 'data/Score'
import debussy from 'data/debussy.json'



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
chord(1,76),
chord(1.25,75),
chord(1.5,76),
chord(1.75,75),
chord(2,76),
chord(2.25,71),
chord(2.5,74),
chord(2.75,72),
chord(3,45,69),
chord(3.25,52),
chord(3.5,57),
chord(3.75,60),
chord(4,64),
chord(4.25,69),
chord(4.5,40,71),
chord(4.75,52),
chord(5,56),
chord(5.25,64),
chord(5.5,68),
chord(5.75,71),
chord(6,72),
chord(6,45),
chord(6.25,52),
chord(6.5,57),
chord(6.75,64),
chord(7,76),
chord(7.25,75),
chord(7.5,76),
chord(7.75,75),
chord(8,76),
chord(8.25,71),
chord(8.5,74),
chord(8.75,72),
chord(9,45,69),
chord(9.25,52),
chord(9.5,57),
chord(9.75,60),
chord(10,64),
chord(10.25,69),
chord(10.5,71),
chord(10.5,40),
chord(10.75,52),
chord(11,56),
chord(11.25,64),
chord(11.5,72),
chord(11.75,71),
chord(12,45.69),
chord(12.25,52),
chord(12.5,57),
chord(13,76),
chord(13.25,75),
chord(13.5,76),
chord(13.75,75),
chord(14,76),
chord(14.25,71),
chord(14.5,74),
chord(14.75,72),
chord(15,45,69),
chord(15.25,52),
chord(15.5,57),
chord(15.75,60),
chord(16,64),
chord(16.25,69),
chord(16.5,40,71),
chord(16.75,52),
chord(17,56),
chord(17.25,64),
chord(17.5,68),
chord(17.75,71),
chord(18,45,72),
chord(18.25,52),
chord(18.5,57),
chord(18.75,64),
chord(19,76),
chord(19.25,75),
chord(19.5,76),
chord(19.75,75),
chord(20,76),
chord(20.25,71),
chord(20.5,74),
chord(20.75,72),
chord(21,45,69),
chord(21.25,52),
chord(21.5,57),
chord(21.75,60),
chord(22,64),
chord(22.25,69),
chord(22.5,71),
chord(22.5,40),
chord(22.75,52),
chord(23,56),
chord(23.25,64),
chord(23.75,72),
chord(24,69,71),
chord(24.25,45),
chord(24.5,52),
chord(24.75,57),
chord(25,71),
chord(25.25,72),
chord(25.5,74,76),
]



function importScoreJson(json: string) {
  return JSON.parse(json, (key, value) => {
    if (key === 'pitches') {
      return new Set(value)
    } else {
      return value
    }
  }) as Score
}

function importScore(s: { startBeat: number; pitches: number[]; }[]): Score {
  return s.map(c => ({ startBeat: c.startBeat, pitches: new Set(c.pitches) }))
}



export const scores: Score[] = [debugScore, importScore(debussy)]


