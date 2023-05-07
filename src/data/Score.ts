



// PitchSet is immutable for sharing
export type PitchSet = Set<number>
export interface ScoreChord {
  // "beat-stamp" like a timestamp.
  // endBeat not used currently, but might be used for trills in the future
  startBeat: number,
  pitches: PitchSet,
}
// Score should be sorted in order of startBeat. Duplicate startBeats allowed,
// which would represent grace notes (might not be supported currently)
export type Score = ScoreChord[]



