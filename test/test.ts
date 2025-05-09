import { BufferedWaveform, bufferedWaveformOfFile, Playback, Waveform } from "@hoge1e3/oscillator";
// "../../dist/index.js"
import { createRhysmLiteralSet, japaneseMelodyLiteralSet, MelodyParser, PlayStatement, RhysmLiteralSet, RhysmParser, rhysmToSource, standardLiteralSet, standardRhysmLiteralSetBase, toSource } from "../src/mml.js";

const audioCtx = new AudioContext();
let playback:Playback|undefined;
export async function stop() {
    playback?.stop();
    ps?.stop();
}
export async function playSound(mml:string) {
    const mp=new MelodyParser(standardLiteralSet,mml);
    const m=mp.parse();
    const src=toSource(m,120);
    console.log(mp, m, src);
    playback=src.play(audioCtx);
}
export async function playJPSound(mml:string) {
    const mp=new MelodyParser(japaneseMelodyLiteralSet,mml);
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
export async function loadWaves() {
    const files=["maou_se_inst_piano2_6ra.wav",
        "maou_se_inst_guitar09.wav",
        "maou_se_inst_guitar13.wav",
        "beep-rotmcits-com.wav",
        "bell-rotmcits-com.wav",
        "cowbell-rotmcits-com.wav",
        "harp-vsq-cojp.wav",
        "okehi-rotmcits-com.wav",];
    const wavs=[] as  BufferedWaveform[];
    for (let file of files) {
        const a:ArrayBuffer=await fetch(`./sounds/${file}`).then(r=>r.arrayBuffer());
        const buf=await bufferedWaveformOfFile(audioCtx, a, 440);
        wavs.push(buf);
    }
    return wavs;
}
export async function playRhysm(mml:string) {
    const rl=await loadRhysmLiteralSet();

    const rp=new RhysmParser(rl,mml);
    const m=rp.parse();
    const src=rhysmToSource(m,120);
    console.log(rp, m, src);
    playback=src.play(audioCtx);
}
let ps:PlayStatement|undefined;
async function initPlayStatement() {
    if (ps)return ps;
    const rl=await loadRhysmLiteralSet();
    const waves=await loadWaves();
    ps = new PlayStatement(audioCtx, standardLiteralSet, rl, waves);
    return ps;
}
export async function playStatement(...mmls:string[]) {
    const ps=await initPlayStatement();
    (globalThis as any).ps=ps;  
    const m=await ps.play(...mmls);
    console.log("playStatement", ps, m);
    ps.playback?.promise.then(
        ()=>console.log("End", ... mmls),
        ()=>console.log("Stop", ... mmls),
    );
    return ps;
}
