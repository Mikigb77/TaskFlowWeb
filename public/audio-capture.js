class TaskFlowCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(4096);
    this.offset = 0;
    this.finished = false;
    this.port.onmessage = (event) => {
      if (event.data === "finish") {
        this.finished = true;
        this.port.postMessage({
          samples: this.buffer.slice(0, this.offset),
          done: true,
        });
      }
    };
  }
  process(inputs) {
    if (this.finished) return true;
    const input = inputs[0]?.[0];
    if (input)
      for (const sample of input) {
        this.buffer[this.offset++] = sample;
        if (this.offset === this.buffer.length) {
          this.port.postMessage(this.buffer, [this.buffer.buffer]);
          this.buffer = new Float32Array(4096);
          this.offset = 0;
        }
      }
    return true;
  }
}
registerProcessor("taskflow-capture", TaskFlowCapture);
