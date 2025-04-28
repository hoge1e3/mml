import { Playback } from "@hoge1e3/oscillator";
// "../../dist/index.js"
import { MelodyParser, standardMelodyLiteralSet, toSource } from "../src/mml.js";

const audioCtx = new AudioContext();
let playback:Playback|undefined;
export async function stop() {
    playback?.stop();
}
export async function playSound(mml:string) {
    const mp=new MelodyParser(standardMelodyLiteralSet,mml);
    const m=mp.parse();
    const src=toSource(m,120);
    console.log(mp, m, src);
    playback=src.play(audioCtx);
}