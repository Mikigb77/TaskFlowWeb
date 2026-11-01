export async function startRecorder() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
    video: false,
  });
  let context: AudioContext | undefined;
  try {
    context = new AudioContext();
    await context.audioWorklet.addModule("/audio-capture.js");
    const source = context.createMediaStreamSource(stream);
    const node = new AudioWorkletNode(context, "taskflow-capture");
    const silent = context.createGain();
    silent.gain.value = 0;
    source.connect(node).connect(silent).connect(context.destination);
    const chunks: Float32Array[] = [];
    let samples = 0;
    // The latest chunk's loudness, 0 (silence) to 1 (a loud voice), for the listening halo.
    let level = 0;
    let flushed: (() => void) | undefined;
    node.port.onmessage = (
      event: MessageEvent<Float32Array | { samples: Float32Array; done: true }>,
    ) => {
      const chunk =
        event.data instanceof Float32Array ? event.data : event.data.samples;
      let sum = 0;
      for (const sample of chunk) sum += sample * sample;
      const rms = chunk.length ? Math.sqrt(sum / chunk.length) : 0;
      level = Math.min(1, Math.sqrt(rms) * 2);
      if (samples < context!.sampleRate * 60) {
        chunks.push(chunk);
        samples += chunk.length;
      }
      if (!(event.data instanceof Float32Array)) flushed?.();
    };
    await context.resume();
    let stopped = false;
    return {
      level() {
        return stopped ? 0 : level;
      },
      async stop() {
        if (stopped) return null;
        stopped = true;
        stream.getTracks().forEach((track) => track.stop());
        // Keep the last partial buffer so the final word is not clipped.
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(resolve, 500);
          flushed = () => {
            clearTimeout(timeout);
            resolve();
          };
          node.port.postMessage("finish");
        });
        node.disconnect();
        source.disconnect();
        silent.disconnect();
        const rate = context!.sampleRate;
        await context!.close();
        const raw = new Float32Array(samples);
        let cursor = 0;
        for (const chunk of chunks) {
          raw.set(chunk, cursor);
          cursor += chunk.length;
        }
        const count = Math.min(960000, Math.floor((samples * 16000) / rate));
        const bytes = new ArrayBuffer(44 + count * 2),
          view = new DataView(bytes);
        const word = (offset: number, value: string) =>
          [...value].forEach((letter, i) =>
            view.setUint8(offset + i, letter.charCodeAt(0)),
          );
        word(0, "RIFF");
        view.setUint32(4, bytes.byteLength - 8, true);
        word(8, "WAVE");
        word(12, "fmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, 16000, true);
        view.setUint32(28, 32000, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        word(36, "data");
        view.setUint32(40, count * 2, true);
        // Average source samples in each target interval rather than discarding samples.
        for (let i = 0; i < count; i++) {
          const start = Math.floor((i * rate) / 16000),
            end = Math.max(start + 1, Math.floor(((i + 1) * rate) / 16000));
          let sum = 0;
          for (let j = start; j < Math.min(end, samples); j++) sum += raw[j];
          const sample = Math.max(-1, Math.min(1, sum / (end - start)));
          view.setInt16(
            44 + i * 2,
            sample < 0 ? sample * 32768 : sample * 32767,
            true,
          );
        }
        return new Blob([bytes], { type: "audio/wav" });
      },
    };
  } catch (error) {
    stream.getTracks().forEach((track) => track.stop());
    await context?.close();
    throw error;
  }
}

export async function audioBase64(blob: Blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let value = "";
  for (let i = 0; i < bytes.length; i += 16384)
    value += String.fromCharCode(...bytes.subarray(i, i + 16384));
  return btoa(value);
}
