# @hoge1e3/mml

Music Macro Language (MML) パーサーと再生ライブラリです。[@hoge1e3/oscillator](https://github.com/hoge1e3/oscillator)を使用して音を生成します。

## 機能

- 標準的なMML構文のパース
- 音符、休符、音長、オクターブの指定
- 異なる文字セット（標準、日本語）のサポート
- WebAudioAPIを使用した音源生成

## インストール

```bash
npm install @hoge1e3/mml
```

## 基本的な使い方

```typescript
import { MelodyParser, standardLiteralSet, toSource } from "@hoge1e3/mml";
import { Playback } from "@hoge1e3/oscillator";

// AudioContextのインスタンスを作成
const audioCtx = new AudioContext();

// MMLをパースして再生
function playMML(mml: string) {
  // MMLをパース
  const parser = new MelodyParser(standardLiteralSet, mml);
  const melody = parser.parse();
  
  // 音源を生成（テンポは120）
  const source = toSource(melody, 120);
  
  // 再生
  const playback = source.play(audioCtx);
  
  // 停止する場合
  // playback.stop();
}

// 使用例
playMML("cdefgab>c");
```

## MML構文

### 基本的な音符

```
c d e f g a b  // ドレミファソラシ（英語表記）
```

または日本語表記を使用する場合:

```
ド レ ミ ファ ソ ラ シ
```

### 音符の長さ

デフォルトでは、各音符は4分音符(1/4)として扱われます。

```
l4 cdef     // 4分音符（指定なしと同じ）
l8 cdef     // 8分音符
l16 cdef    // 16分音符
l2 cdef     // 2分音符
l1 cdef     // 全音符
```

### 付点と伸ばし

```
c. d. e. f.   // 付点（音符の長さを1.5倍に）
c^ d^ e^ f^   // 伸ばし（音符の長さを2倍に）
```

### 複合的な長さ指定

```
c4&8 d8&16    // 4分音符+8分音符、8分音符+16分音符
```

### オクターブ

```
c d e f       // 標準オクターブ
> c d e f     // 1オクターブ上
< c d e f     // 1オクターブ下
```

### 休符

```
r           // 休符（標準表記）
・           // 休符（日本語表記）
```

### シャープとフラット

```
c# d# f#     // シャープ（半音上げ）
c+ d+ f+     // シャープの別表記
c- d- e-     // フラット（半音下げ）
```

## 型定義

### 主要な型

```typescript
// 音符の長さを表す型
export interface NoteLength {
    n: number;   // 分子
    d: number;   // 分母
}

// 音符を表す型
export interface Note {
    scale: number|null; // 0-95の音階、nullは休符
    length: NoteLength; // 音符の長さ
}

// メロディを表す型（音符の配列）
export type Melody = Note[];

// パース中の状態を表す型
export type MelodyState = {
    length: NoteLength,
    octave: number,
}

// 文字セットを表す型
export type LieteralSet = {
    scales: Pattern[],           // 音階
    longSyllable: Pattern,       // 伸ばし記号
    halfSyllable: Pattern,       // 付点記号
    concatLength: Pattern,       // 長さ連結記号
    rest: Pattern,               // 休符
    sharp: Pattern,              // シャープ記号
    flat: Pattern,               // フラット記号
    octave: {up: Pattern, down: Pattern}, // オクターブ変更記号
    length: Pattern,             // 長さ指定記号
    rhysms?: Map<string, Source>; // リズムパターン（オプション）
}
```

## 文字セット

このライブラリでは2種類の文字セットがあらかじめ定義されています：

### 標準文字セット

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

### 日本語文字セット

```typescript
export const japaneseLiteralSet: LieteralSet = {
    scales: ["ド","レ","ミ","ファ","ソ","ラ","シ"],
    concatLength: "&",
    rest: "・",
    octave: {up:/^[↑^]/, down:/^[↓_＿]/},
    length: "l",
    longSyllable: /^[ー〜]/, 
    sharp: /^[#＃]/, 
    flat: "♭",
    halfSyllable: /^[．.]/,
};
```

## 使用例

### シンプルな例

```typescript
import { MelodyParser, standardLiteralSet, toSource } from "@hoge1e3/mml";

const audioCtx = new AudioContext();
const mml = "cdefgab>c";

const parser = new MelodyParser(standardLiteralSet, mml);
const melody = parser.parse();
const source = toSource(melody, 120);
const playback = source.play(audioCtx);

// 停止する場合
playback.stop();
```

### 複雑な例（キラキラ星）

```typescript
import { MelodyParser, standardLiteralSet, toSource } from "@hoge1e3/mml";

const audioCtx = new AudioContext();
const mml = "ccgg aag^ ffee ddc^";

const parser = new MelodyParser(standardLiteralSet, mml);
const melody = parser.parse();
const source = toSource(melody, 120);
const playback = source.play(audioCtx);
```

### HTML UIでの使用例

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

## テスト

プロジェクトには簡単なテストページが含まれています。以下のコマンドで実行できます：

```bash
npm run test
```

テストページでは、テキストボックスにMMLを入力し、再生ボタンをクリックすることで音を確認できます。

## ビルド方法

```bash
# 開発ビルド
npm run build-dev

# 本番ビルド
npm run build
```

## ライセンス

このプロジェクトは特定のライセンスの下で提供されています。詳細はパッケージのライセンスファイルを参照してください。

## 依存関係

- [@hoge1e3/oscillator](https://github.com/hoge1e3/oscillator) - 音源生成のためのライブラリ
