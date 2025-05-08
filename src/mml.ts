import {createMuteNote, createNote, joinSource, BufferedWaveform, Waveform, Playback, ADSR, parallelSource, joinPlaybackAndSource, Source} from "@hoge1e3/oscillator";
export * as oscillator from "@hoge1e3/oscillator";
export type Pattern=string|RegExp;
export type LengthLiteralSet={
    longSyllable: Pattern, 
    halfSyllable: Pattern, 
    concatLength: Pattern,  
};
export type MelodyLieteralSet=LengthLiteralSet & {
    scales:Pattern[],
    rest: Pattern,
    sharp: Pattern, flat: Pattern,
    octave: {up:Pattern, down:Pattern},
    defaultLength: Pattern,
};
export type RhysmLiteralSetBase=LengthLiteralSet & {    
    rest: Pattern,
    lengthBase?: NoteLength,  // 1/2
    unbase?: Pattern, //ン
    defaultLength: Pattern, // "L"
}; 
export type RhysmSet=Map<Pattern, Waveform> ;
export type RhysmLiteralSet=RhysmLiteralSetBase & { rhysms: RhysmSet };
export const standardRhysmLiteralSetBase:RhysmLiteralSetBase={
    concatLength: "&",
    longSyllable: "^", 
    halfSyllable: ".",    
    rest :"r",
    defaultLength :"l",
};
export function createRhysmLiteralSet(base: RhysmLiteralSetBase, rhysms: RhysmSet):RhysmLiteralSet {
    return {...base, rhysms};
}
export const standardLiteralSet:MelodyLieteralSet={
    scales: ["c","d","e","f","g","a","b"],
    rest: "r",
    octave: {up:">", down:"<"},
    sharp :/^[#+]/, flat: "-",
    defaultLength: "l",
    concatLength: "&",
    longSyllable: "^", 
    halfSyllable: ".",    
};
export const standardMelodyLiteralSet=standardLiteralSet;
export const japaneseRhysmLiteralSetBase:RhysmLiteralSetBase={
    lengthBase: nl(1,2), unbase: "ン",
    rest :"・",
    defaultLength :"l",
    concatLength: "&",
    longSyllable: /^[ー〜]/, 
    halfSyllable: /^[．.]/,
    //rhysms: ["ド","タ","ツ","ク", "チ", "パ"],
};
export const japaneseLiteralSet:MelodyLieteralSet={
    scales: ["ド","レ","ミ","ファ","ソ","ラ","シ"],
    rest: "・",
    octave: {up:/^[↑^]/, down:/^[↓_＿]/},
    defaultLength: "l",
    sharp: /^[#＃]/, flat: "♭",
    concatLength: "&",
    //https://qiita.com/ryounagaoka/items/4cf5191d1a2763667add

    longSyllable: /^[ー～\u002d\u30fc\u2010-\u2015\u2212\uff70\u301c\uff5e]/, 
    halfSyllable: /^[．.]/,
};
export const japaneseMelodyLiteralSet=japaneseLiteralSet;
const scaleOffset=[0, 2, 4,5, 7, 9, 11];

export interface NoteLength {
    n: number;   // numerator
//-----------------------------
    d: number;   // denominator
}
function nl(n:number, d:number) {return {n,d};}
function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
}
function lcm(a: number, b: number): number {
    return (a * b) / gcd(a, b);
}
function addNoteLength(a: NoteLength, b: NoteLength): NoteLength {
    const commonDenominator = lcm(a.d, b.d);
    const numeratorA = a.n * (commonDenominator / a.d);
    const numeratorB = b.n * (commonDenominator / b.d);
    const resultNumerator = numeratorA + numeratorB;
    const divisor = gcd(resultNumerator, commonDenominator);
    return {
        n: resultNumerator / divisor,
        d: commonDenominator / divisor,
    };
}
function normalizeLength(a:NoteLength):NoteLength {
    if (a.n==0) return nl(0,1);
    const divisor=gcd(a.n, a.d);
    return {
        n: (a.n) / divisor,
        d: (a.d) / divisor,
    };

}
function mulNoteLength(a: NoteLength, b: NoteLength): NoteLength {
    return normalizeLength({
        n: (a.n * b.n),
        d: (a.d * b.d),
    });
}

export interface Note {
    scale: number|null; //0-95 ,null=rest
    length: NoteLength;
}
export interface Drum {
    waveform: Waveform|null; // null=rest
    length: NoteLength;
}
export type Melody=Note[];
export type Rhysm=Drum[];
export type MelodyState={
    length: NoteLength,
    octave: number,
}
export type StateBase={
    length: NoteLength,
};
export type RhysmState=StateBase;
export abstract class Parser {
    i=0;
    constructor (public literals: LengthLiteralSet, public mml:string){
    }
    eos() {
        return this.i>=this.mml.length;
    }
    reg(p:RegExp):RegExpExecArray|undefined {
        const looking=this.mml.substring(this.i);
        const m=p.exec(looking);
        //console.log("reg",looking, p, m);
        if (m) {
            this.i+=m[0].length;
            return m;
        }
    }
    str(p:string):RegExpExecArray|undefined {
        const looking=this.mml.substring(this.i);
        if (looking.startsWith(p)) {
            this.i+=p.length;
            const groups=[p];
            return Object.assign(groups,{groups, index:0, input:looking}) as any;
        }
    }
    read(p:Pattern) {
        this.reg(/^\s*/);
        if (typeof p==="string") return this.str(p);
        return this.reg(p);
    }
    parseLen(def:NoteLength) {
        const literals=this.literals;
        let length=def;
        let lengthA=nl(0,1);
        while (true) {
            const lennum=this.read(/^[0-9]+/);
            if (!lennum) break;
            lengthA=addNoteLength(lengthA, nl(1, parseInt(lennum[0])));
            const and=this.read(literals.concatLength);
            if (!and) break;
        }
        if (lengthA.n>0) length=lengthA;
        let lengthS=length;
        while (true) {
            const longs=this.read(literals.longSyllable);
            if (longs) {
                length=addNoteLength(length, lengthS)
                continue;
            }
            const halfs=this.read(literals.halfSyllable);
            if (halfs) {
                length=addNoteLength(length, nl(lengthS.n, lengthS.d*2));
                continue;
            }
            break;
        }
        return length;
    }

}
export class MelodyParser extends Parser {
    public state:MelodyState={
        length: nl(1,4), octave:4,
    };
    constructor(public literals: MelodyLieteralSet, mml:string, ) {
        super(literals, mml);
    }
    parse():Melody {
        let result=[] as Melody;
        const literals=this.literals;
        const state=this.state;
        const scls=literals.scales;
        const read=this.read.bind(this);
        const parseLen=this.parseLen.bind(this);
        while(!this.eos()) {
            let pi=this.i;
            for (let j=0; j<scls.length;j++) {
                if (!read(scls[j])) continue;
                let scale=scaleOffset[j] + (state.octave-1)*12;
                while(true) {
                    if (read(literals.sharp)) {
                        scale++;
                    } else if (read(literals.flat)) {
                        scale--;
                    } else break;
                }
                let length=parseLen(state.length);
                result.push({scale, length});
                break;
            }
            if (read(literals.rest)) {
                let length=parseLen(state.length);
                result.push({scale: null, length});    
            } else if (read(literals.defaultLength)) {
                const deflen=parseLen(state.length);
                //console.log("defaultLength", deflen);
                state.length=deflen;
            } else if (read(literals.octave.up)) {
                state.octave++;
            } else if (read(literals.octave.down)) {
                state.octave--;
            }
            if (pi==this.i) this.i++;
        }
        return result;
    }
}
export class RhysmParser extends Parser {
    public state:RhysmState={
        length: nl(1,4),
    };
    constructor(public literals: RhysmLiteralSet, mml:string, ) {
        super(literals, mml);
    }
    parse():Rhysm {
        let result=[] as Rhysm;
        const literals=this.literals;
        const state=this.state;
        const read=this.read.bind(this);
        const parseLen=this.parseLen.bind(this);
        while(!this.eos()) {
            let pi=this.i;
            for (let [pat, source] of literals.rhysms) {
                if (!read(pat)) continue;
                let base=nl(1,1);
                if (literals.lengthBase) base=literals.lengthBase;
                if (literals.unbase) {
                    if (read(literals.unbase)) {
                        base=nl(1,1);
                    }
                }
                let length=parseLen(state.length);
                length=mulNoteLength(length, base);
                result.push({waveform: source, length});
                break;
            }
            if (read(literals.rest)) {
                let length=parseLen(state.length);
                result.push({waveform: null, length});    
            } else if (read(literals.defaultLength)) {
                const deflen=parseLen(state.length);
                state.length=deflen;
            }
            if (pi==this.i) this.i++;
        }
        return result;
    }
}
export function toSource(m:Melody, tempo:number, wave: Waveform="square", envelope?: ADSR):Source {
    // 0 = o1c
    // 12 = o2c
    // 24 = o3c
    // 36 = o4c
    // 48 = o5c
    // o4a = 48-3 = 45 = 440Hz
    const toscl=(scale:number)=>440 * Math.pow(2, (scale-45)/12 );
    // t120 = l2 = 1sec
    // t240 = l1 = 1sec
    const todur=(len:NoteLength)=>(len.n)/(len.d)*240/tempo;
    const notes=[] as Source[];
    let _envelope; 
    if (!envelope) {
        _envelope = typeof wave=="string" ? 
        { attack: 0, decay: 0.1, sustain: 0.5, release: 0.1 }:
        { attack: 0, decay: 0.1, sustain: 1, release: 0 };
    } else {
        _envelope = envelope;   
    }
    for (let note of m) {
        if (note.scale==null) {
            notes.push(createMuteNote(todur(note.length)));
            continue;   
        }
        notes.push(createNote(todur(note.length), toscl(note.scale),0.5, wave, _envelope))
    } 
    return joinSource(...notes);
}
export const melodyToSource=toSource;
export function rhysmToSource(r:Rhysm, tempo:number):Source {
    // t120 = l2 = 1sec
    // t240 = l1 = 1sec
    const todur=(len:NoteLength)=>(len.n)/(len.d)*240/tempo;
    const notes=[] as Source[];
    for (let note of r) {
        if (note.waveform==null) {
            notes.push(createMuteNote(todur(note.length)));
            continue;   
        }
        notes.push(createNote(todur(note.length), 440, 0.5, note.waveform, {
            attack: 0, // time in seconds to reach max volume
            decay: 0.1, // time in seconds to reach sustain level
            sustain: 1, // volume level during sustain (0 to 1)
            release: 0, // time in seconds to fade out
        }))
    } 
    return joinSource(...notes);
}
export type PlayState = MelodyState|RhysmState;
const rs2ms=(state:RhysmState|MelodyState):MelodyState=>{
    return {
        length: state.length,
        octave: "octave" in state ? state.octave : 4,
    };
}
export class PlayStatement {
    //start:number=0;
    maxTime=60; // 1 min
    public playStates=[] as PlayState[];
    private _playback:Playback|undefined;
    public get playback():Playback|undefined {
        return (this._playback && this._playback.end>this.audioCtx.currentTime) ? this._playback : undefined;
    }
    constructor(
        public audioCtx:AudioContext,
        public melodyLiteralSet:MelodyLieteralSet, 
        public rhysmLiteralSet:RhysmLiteralSet,
        public waves:Waveform[]) {}
    async play(...mmls:string[]) {
        // if mml starts with @drum, use rhysmLiteralSet
        // otherwise use melodyLiteralSet
        let tempo=120;
        let reg_tempo=/^t([0-9]+)/i;
        let reg_wave=/^@([0-9]+)/i;
        let reg_drum=/^@drum/i;

        // wait until remaining time become less than 1 min
        const remain=this.remainTime;
        const wait=remain-this.maxTime;
        if (wait>0) {
            await new Promise(r=>setTimeout(r, wait*1000));
        }    
    
        //let next_start=this.start;
        let sources=[] as Source[];
        for (let i=0;i<mmls.length; i++) {
            let mml=mmls[i];
            let isDrum=false;
            let wave=this.waves[0];
            while (true) {
                let m=reg_tempo.exec(mml);
                if (m) {
                    tempo=parseInt(m[1]);
                    mml=mml.substring(m[0].length);
                    continue;
                }
                m=reg_wave.exec(mml);
                if (m) {
                    const wsel=parseInt(m[1]);
                    if (wsel>=0 && wsel<this.waves.length) {
                        wave=(this.waves[wsel]);
                    } else {
                        console.warn("wave select out of range", m[1], this.waves.length);
                    }
                    mml=mml.substring(m[0].length);
                    continue;
                }
                m=reg_drum.exec(mml);
                if (m) {
                    isDrum=true;
                    mml=mml.substring(m[0].length);
                    continue;
                }
                break;
            }
            let state:RhysmState|MelodyState;
            if (isDrum) {
                const mp=new RhysmParser(this.rhysmLiteralSet, mml);
                if (this.playStates[i]) mp.state=this.playStates[i];
                const m=mp.parse();
                const src=rhysmToSource(m, tempo);
                console.log(mp, m, src);
                
                sources.push(src);//.play(this.audioCtx, this.start);
                state=mp.state;
            } else {  
                const mp=new MelodyParser(this.melodyLiteralSet, mml);
                if (this.playStates[i]) mp.state=rs2ms(this.playStates[i]);
                const m=mp.parse();
                const src=melodyToSource(m, tempo, wave);
                console.log(mp, m, src);
                sources.push(src);//
                //sources=src.play(this.audioCtx, this.start);
                state=mp.state;
            }
            /*if (next_start < sources.end) {
                next_start = sources.end;
            }*/
            this.playStates[i] = state;
        }
        const newSource=parallelSource(...sources);
        if (this.playback ) {
            this._playback=joinPlaybackAndSource(this.playback, newSource); 
        } else {
            this._playback=newSource.play(this.audioCtx, this.audioCtx.currentTime);
        }
        //this.start=this._playback.end;
    }
    stop() {
        this.playback?.stop();
    }
    get remainTime() {
        if (!this.playback) return 0;
        return Math.max(0, this.playback.end - this.audioCtx.currentTime);
    }
}