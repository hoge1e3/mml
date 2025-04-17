import {createMuteNote, createNote, joinSource, Source} from "@hoge1e3/oscillator";
export type Pattern=string|RegExp;
export type LieteralSet={
    scales:Pattern[],
    longSyllable: Pattern, 
    halfSyllable: Pattern, 
    concatLength: Pattern,
    rest: Pattern,
    sharp: Pattern, flat: Pattern,
    octave: {up:Pattern, down:Pattern},
    length: Pattern,
    rhysms?: Map<string, Source>;
}
export const standardLiteralSet:LieteralSet={
    scales: ["c","d","e","f","g","a","b"],
    rest: "r",
    octave: {up:">", down:"<"},
    length: "l",
    concatLength: "&",
    longSyllable: "^", 
    sharp :/^[#+]/, flat: "-",
    halfSyllable: ".",    
};
export const japaneseLiteralSet:LieteralSet={
    scales: ["ド","レ","ミ","ファ","ソ","ラ","シ"],
    concatLength: "&",
    rest: "・",
    octave: {up:/^[↑^]/, down:/^[↓_＿]/},
    length: "l",
    longSyllable: /^[ー〜]/, 
    sharp: /^[#＃]/, flat: "♭",
    halfSyllable: /^[．.]/,
};
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

export interface Note {
    scale: number|null; //0-95 ,null=rest
    length: NoteLength;
}
export type Melody=Note[];
export type MelodyState={
    length: NoteLength,
    octave: number,
}
export type StateBase={
    length: NoteLength,
};
export abstract class Parser {
    i=0;
    constructor (public literals: LieteralSet, public mml:string){
    }
    eos() {
        return this.i>=this.mml.length;
    }
    reg(p:RegExp):RegExpExecArray|undefined {
        const looking=this.mml.substring(this.i);
        const m=p.exec(looking);
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
    constructor(literals: LieteralSet, mml:string, ) {
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
            } else if (read(literals.length)) {
                const deflen=parseLen(state.length);
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
export function toSource(m:Melody, tempo:number):Source {
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
    for (let note of m) {
        if (note.scale==null) {
            notes.push(createMuteNote(todur(note.length)));
            continue;   
        }
        notes.push(createNote(todur(note.length), toscl(note.scale),0.5, "square", {
            attack: 0, // time in seconds to reach max volume
            decay: 0.1, // time in seconds to reach sustain level
            sustain: 0.5, // volume level during sustain (0 to 1)
            release: 0.1, // time in seconds to fade out
        }))
    } 
    return joinSource(...notes);
}