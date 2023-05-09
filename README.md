# Piano Performance and Interpretation Visualization

## Live Demo (requires MIDI keyboard)
[Live Demo](https://645975db75ce4300086d9f7a--stunning-eclair-3ccae9.netlify.app/)

## Repo directory structure (files of interest)
- midiToScore: a small node script that turns `.mid` files into a JSON representation of the score that the application can read
- public: default directory for the `.html` file and other assets
- src:
  - App.tsx: app entry point
  - render: rendering code for GPU
    - NoteRenderer: horizontal bar for each note
    - TempoRenderer: background tempo variation field with diverging color scheme
  - data
    - scores.ts: hardcoded scores. includes Fur Elise by Beethoven
    - debussy.json: outputted from midiToScore. represents First Arabesque by Debussy
  - analysis: data analysis
    - match: match a sequence of performed notes to the score. assigns a beat-stamp to each note according to the score
    - tempo: calculate each note's contribution to tempo variation
  - midi: midi device and message event handling

