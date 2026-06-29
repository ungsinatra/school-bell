import { Howl } from "howler";

let current: Howl | null = null;

export function playSound(filePath: string) {
  current?.stop();
  current = new Howl({
    src: [filePath],
    volume: 1,
    html5: true,
    onloaderror: (_id, error) => {
      console.error("Load error:", error);
    },
    onend: () => {
      current = null;
    },
  });
  current.play();
}

export function stopSound() {
  current?.stop();
  current = null;
}
