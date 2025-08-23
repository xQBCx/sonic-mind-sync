import * as Tone from "tone";

export async function playPreview() {
  await Tone.start(); // required by browsers

  const left = new Tone.Oscillator(200, "sine").connect(new Tone.Panner(-1)).toDestination().start();
  const right = new Tone.Oscillator(210, "sine").connect(new Tone.Panner(1)).toDestination().start();

  setTimeout(() => { left.stop(); right.stop(); }, 10000); // stop after 10s
}