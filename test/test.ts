import { BufferedWaveform, bufferedWaveformOfFile, Playback, Waveform } from "@hoge1e3/oscillator";
// "../../dist/index.js"
import { createRhysmLiteralSet, MelodyParser, RhysmLiteralSet, RhysmParser, rhysmToSource, standardLiteralSet, standardRhysmLiteralSetBase, toSource } from "../src/mml.js";

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
    playback=src.play(audioCtx);
}
let rhysmLiteralSet: RhysmLiteralSet|undefined;
async function loadRhysmLiteralSet() {
    if (rhysmLiteralSet)return rhysmLiteralSet;
    const files=`maou_se_inst_bass02.wav
maou_se_inst_bass02_cut.wav
maou_se_inst_drum1_cymbal.wav
maou_se_inst_drum1_hat.wav
maou_se_inst_drum2_kick.wav
maou_se_inst_drum2_snare.wav
maou_se_inst_drum2_tom1.wav
maou_se_inst_guitar09.wav
maou_se_inst_guitar13.wav
maou_se_inst_piano2_6ra.wav`.split(/\r?\n/);
    const wavs=new Map<string, BufferedWaveform>();
    for (let file of files) {
        const a:ArrayBuffer=await fetch(`./sounds/${file}`).then(r=>r.arrayBuffer());
        const buf=await bufferedWaveformOfFile(audioCtx, a, 440);
        wavs.set(file, buf);
    }
    const set=new Map<string, Waveform>();
    set.set("b",wavs.get("maou_se_inst_drum2_kick.wav")!);
    set.set("s",wavs.get("maou_se_inst_drum2_snare.wav")!);
    set.set("m",wavs.get("maou_se_inst_drum2_tom1.wav")!);
    set.set("c",wavs.get("maou_se_inst_drum1_cymbal.wav")!);
    set.set("h",wavs.get("maou_se_inst_drum1_hat.wav")!);
    rhysmLiteralSet=createRhysmLiteralSet(standardRhysmLiteralSetBase, set);
    return rhysmLiteralSet;
    /*
    play("@drum B バスドラム
                  S スネアドラム
                  M タムタム
                  C シンバル
                  H ハイハット")
    */
}
export async function playRhysm(mml:string) {
    const rl=await loadRhysmLiteralSet();

    const rp=new RhysmParser(rl,mml);
    const m=rp.parse();
    const src=rhysmToSource(m,120);
    console.log(rp, m, src);
    playback=src.play(audioCtx);
}