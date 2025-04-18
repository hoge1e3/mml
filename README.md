# @hoge1e3/mml

A Music Macro Language (MML) parser and playback library that uses [@hoge1e3/oscillator](https://github.com/hoge1e3/oscillator) to generate sound.

## Features

- Parsing of standard MML syntax
- Support for notes, rests, note lengths, and octave specifications
- Support for different character sets (standard and Japanese)
- Sound generation using WebAudioAPI

## Installation

```bash
npm install @hoge1e3/mml
```

## Basic Usage

```typescript
import { MelodyParser, standardLiteralSet, toSource } from "@hoge1e3/mml";
import { Playback } from "@hoge1e3/oscillator";

// Create an AudioContext instance
const audioCtx = new AudioContext();

// Parse and play MML
function playMML(mml: string) {
  // Parse MML
  const parser = new MelodyParser(standardLiteralSet, mml);
  const melody = parser.parse();
  
  // Generate sound source (tempo 120)
  const source = toSource(melody, 120);
  
  // Play
  const playback = source.play(audioCtx);
  
  // To stop
  // playback.stop();
}

// Example
playMML("cdefgab>c");
```

## MML Syntax

### Basic Notes

```
c d e f g a b  // C, D, E, F, G, A, B
```

### Note Lengths

By default, each note is treated as a quarter note (1/4).

```
l4 cdef     // Quarter notes (same as default)
l8 cdef     // Eighth notes
l16 cdef    // Sixteenth notes
l2 cdef     // Half notes
l1 cdef     // Whole notes
```

### Dots and Extended Notes

```
c. d. e. f.   // Dotted notes (multiply length by 1.5)
c^ d^ e^ f^   // Extended notes (multiply length by 2)
```

### Compound Length Specifications

```
c4&8 d8&16    // Quarter note + eighth note, eighth note + sixteenth note
```

### Octaves

```
c d e f       // Standard octave
> c d e f     // One octave up
< c d e f     // One octave down
```

### Rests

```
r           // Rest
```

### Sharps and Flats

```
c# d# f#     // Sharp (raise a half tone)
c+ d+ f+     // Alternative sharp notation
c- d- e-     // Flat (lower a half tone)
```

## Type Definitions

### Core Types

```typescript
// Type representing note length
export interface NoteLength {
    n: number;   // Numerator
    d: number;   // Denominator
}

// Type representing a note
export interface Note {
    scale: number|null; // 0-95 scale, null for rests
    length: NoteLength; // Note length
}

// Type representing a melody (array of notes)
export type Melody = Note[];

// Type representing parser state
export type MelodyState = {
    length: NoteLength,
    octave: number,
}

// Type representing a character set
export type LieteralSet = {
    scales: Pattern[],           // Scales
    longSyllable: Pattern,       // Extended note symbol
    halfSyllable: Pattern,       // Dotted note symbol
    concatLength: Pattern,       // Length concatenation symbol
    rest: Pattern,               // Rest symbol
    sharp: Pattern,              // Sharp symbol
    flat: Pattern,               // Flat symbol
    octave: {up: Pattern, down: Pattern}, // Octave change symbols
    length: Pattern,             // Length specification symbol
    rhysms?: Map<string, Source>; // Rhythm patterns (optional)
}
```

## Character Sets

This library includes two predefined character sets:

### Standard Character Set

```typescript
export const standardLiteralSet: LieteralSet = {
    scales: ["c","d","e","f","g","a","b"],
    rest: "r",
    octave: {up:">", down:"<"},
    length: "l",
    concatLength: "&",
    longSyllable: "^", 
    sharp: /^[#+]/, 
    flat: "-",
    halfSyllable: ".",    
};
```

### Japanese Character Set

The library also supports a Japanese character set for use with Japanese notation.

## Examples

### Simple Example

```typescript
import { MelodyParser, standardLiteralSet, toSource } from "@hoge1e3/mml";

const audioCtx = new AudioContext();
const mml = "cdefgab>c";

const parser = new MelodyParser(standardLiteralSet, mml);
const melody = parser.parse();
const source = toSource(melody, 120);
const playback = source.play(audioCtx);

// To stop
playback.stop();
```

### Complex Example (Twinkle Twinkle Little Star)

```typescript
import { MelodyParser, standardLiteralSet, toSource } from "@hoge1e3/mml";

const audioCtx = new AudioContext();
const mml = "ccgg aag^ ffee ddc^";

const parser = new MelodyParser(standardLiteralSet, mml);
const melody = parser.parse();
const source = toSource(melody, 120);
const playback = source.play(audioCtx);
```

### HTML UI Example

```html
<div>
    <input id="mml" value="cdefedc^efgagfe^c^c^c^c^l8ccddeeffe^d^c^"/>
</div>
<button id="play">Play</button>
<button id="stop">Stop</button>
<script type="module">
    import { MelodyParser, standardLiteralSet, toSource } from "@hoge1e3/mml";
    
    const audioCtx = new AudioContext();
    let playback;
    
    document.getElementById('play').addEventListener('click', () => {
        const mml = document.getElementById('mml').value;
        const parser = new MelodyParser(standardLiteralSet, mml);
        const melody = parser.parse();
        const source = toSource(melody, 120);
        playback = source.play(audioCtx);
    });
    
    document.getElementById('stop').addEventListener('click', () => {
        playback?.stop();
    });
</script>
```

## Testing

The project includes a simple test page that can be run with:

```bash
npm run test
```

On the test page, you can enter MML in the text box and click the play button to hear the sound.

## Building

```bash
# Development build
npm run build-dev

# Production build
npm run build
```

## License

This project is provided under a specific license. Please refer to the license file in the package for details.

## Dependencies

- [@hoge1e3/oscillator](https://github.com/hoge1e3/oscillator) - Library for sound generation
