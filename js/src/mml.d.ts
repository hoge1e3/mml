import { Source } from "@hoge1e3/oscillator";
export type Pattern = string | RegExp;
export type LieteralSet = {
    scales: Pattern[];
    longSyllable: Pattern;
    halfSyllable: Pattern;
    rest: Pattern;
    sharp: Pattern;
    flat: Pattern;
    rhysms?: Map<string, Source>;
};
export declare const standardLiteralSet: LieteralSet;
export declare const japaneseLiteralSet: LieteralSet;
export interface NoteLength {
    n: number;
    d: number;
}
export interface Note {
    scale: number | null;
    length: NoteLength;
}
export type Melody = Note[];
export type MMLState = {
    length: NoteLength;
    octave: number;
};
export declare class Parser {
    literals: LieteralSet;
    constructor(literals: LieteralSet);
    parse(mml: string): Melody;
}
export declare function toSource(m: Melody, tempo: number): Source;
