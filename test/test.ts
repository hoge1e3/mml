import { Playback } from "@hoge1e3/oscillator";
// "../../dist/index.js"
import { MelodyParser, standardLiteralSet, toSource } from "../src/mml.js";

const audioCtx = new AudioContext();
let playback:Playback|undefined;
export async function stop() {
    playback?.stop();
}
export async function playSound(mml:string) {
    const mp=new MelodyParser(standardLiteralSet,mml);
    const m=mp.parse();
    const src=toSource(m,120);
    console.log(mp, m, src);
    src.play(audioCtx);
}