const kVideoType = Symbol("kVideoType");
const kSetup = Symbol("kSetup");

class Recorder {
  constructor(username, stream) {
    this.username = username;
    this.stream = stream;

    this.fileName = `id:${username}-when:${Date.now()}`;

    this[kVideoType] = "video/webm";

    this.mediaRecorder = {};
    this.recordedBlobs = [];
    this.completeRecordings = [];
    this.recordingActive = false;
  }

  [kSetup]() {
    const commonCodecs = ["codecs=vp9,opus", "codecs=vp8,opus", ""];
    const options = commonCodecs
      .map((codec) => ({
        mimeType: `${this[kVideoType]};${codec}`,
      }))
      .find((options) => MediaRecorder.isTypeSupported(options.mimeType));

    if (!options) {
      throw new Error(
        `none of the codecs: ${commonCodecs.join(",")} are supported`
      );
    }

    return options;
  }

  startRecording() {
    const options = this[kSetup]();

    if (!this.stream.active) return;

    this.mediaRecorder = new MediaRecorder(this.stream, options);

    console.log(
      `Created Media Recorder ${this.mediaRecorder} with options ${options}`
    );

    this.mediaRecorder.onstop = () => {
      console.log("Recorded Blobs", this.recordedBlobs);
    };

    this.mediaRecorder.ondataavailable = (event) => {
      if (!event.data || !event.data.size) return;

      this.recordedBlobs.push(event.data);
    };

    this.mediaRecorder.start(1000);

    console.log(`Media recorded started`, this.mediaRecorder);
    this.recordingActive = true;
  }

  async stopRecording() {
    if (!this.recordingActive) return;
    if (this.mediaRecorder.state === "inactive") return;

    console.log(`media recorded stopped: `, this.username);

    this.mediaRecorder.stop();

    this.recordingActive = false;
    await Util.sleep(1000);

    this.completeRecordings.push([...this.recordedBlobs]);
    this.recordedBlobs = [];
  }

  getAllVideoURLs() {
    return this.completeRecordings.map((recording) => {
      const superBuffer = new Blob(recording, {
        type: this[kVideoType],
      });

      return window.URL.createObjectURL(superBuffer);
    });
  }

  download() {
    if (!this.completeRecordings.length) return;

    for (const recording of this.completeRecordings) {
      const blob = new Blob(recording, { type: this[kVideoType] });
      const url = window.URL.createObjectURL(blob);
      const linkElement = document.createElement("a");
      linkElement.display = "none";
      linkElement.href = url;
      linkElement.download = `${this.fileName}.webm`;
      document.body.appendChild(linkElement);
      linkElement.click();
    }
  }
}
