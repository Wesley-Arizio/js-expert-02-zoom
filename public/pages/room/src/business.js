const kOnUserConnected = Symbol("kOnUserConnected");
const kOnUserDisconnected = Symbol("kOnUserDisconnected");
const kCurrentStream = Symbol("kCurrentStream");
const kRoom = Symbol("kRoom");
const kMedia = Symbol("kMedia");
const kView = Symbol("kView");
const kSocketBuilder = Symbol("kSocketBuilder");
const kSocket = Symbol("kSocket");
const kPeerBuilder = Symbol("kPeerBuilder");
const kCurrentPeer = Symbol("kCurrentPeer");
const kOnPeerError = Symbol("kOnPeerError");
const kOnConnectionOpened = Symbol("kOnConnectionOpened");
const kOnCallReceived = Symbol("kOnCallReceived");
const kOnPeerStreamReceived = Symbol("kOnPeerStreamReceived");
const kPeers = Symbol("kPeers");
const kOnPeerCallError = Symbol("kOnPeerCallError");
const kOnCallClose = Symbol("kOnCallClose");
const kOnRecordPressed = Symbol("kOnRecordPressed");
const kUserRecording = Symbol("kUserRecording");
const kStopRecording = Symbol("kStopRecording");
const kPlayRecordings = Symbol("kPlayRecordings");
const kOnLeavePressed = Symbol("kOnLeavePressed");

class Business {
  constructor({ room, media, view, socketBuilder, peerBuilder }) {
    this[kRoom] = room;
    this[kMedia] = media;
    this[kView] = view;

    this[kSocketBuilder] = socketBuilder;
    this[kPeerBuilder] = peerBuilder;

    this[kSocket] = {};
    this[kCurrentStream] = {};
    this[kCurrentPeer] = {};

    this[kPeers] = new Map();
    this[kUserRecording] = new Map();
  }

  static initialize(dependencies) {
    const instance = new Business(dependencies);
    return instance._init();
  }

  async _init() {
    this[kView].configureRecordButton(this[kOnRecordPressed].bind(this));
    this[kView].configureLeaveButton(this[kOnLeavePressed].bind(this));
    this[kCurrentStream] = await this[kMedia].getCamera();

    this[kSocket] = this[kSocketBuilder]
      .setOnUserConnected(this[kOnUserConnected]())
      .setOnUserDisconnected(this[kOnUserDisconnected]())
      .build();

    this[kCurrentPeer] = await this[kPeerBuilder]
      .setOnError(this[kOnPeerError]())
      .setOnConnectionOpened(this[kOnConnectionOpened]())
      .setOnCallReceived(this[kOnCallReceived]())
      .setOnPeerStreamReceived(this[kOnPeerStreamReceived]())
      .setOnCallError(this[kOnPeerCallError]())
      .setOnCallClose(this[kOnCallClose]())
      .build();

    this.addVideoStream(this[kCurrentPeer].id);
  }

  addVideoStream(userId, stream = this[kCurrentStream]) {
    const recorderInstance = new Recorder(userId, stream);
    this[kUserRecording].set(recorderInstance.fileName, recorderInstance);

    if (this.recordingEnabled) {
      recorderInstance.startRecording();
    }

    const isCurrentId = userId === this[kCurrentPeer].id;

    this[kView].renderVideo({
      userId,
      muted: false,
      stream,
      isCurrentId,
    });
  }

  [kOnUserConnected]() {
    return (userId) => {
      console.log("user connected: ", userId);
      this[kCurrentPeer].call(userId, this[kCurrentStream]);
    };
  }

  [kOnUserDisconnected]() {
    return (userId) => {
      console.log("user disconnected: ", userId);

      if (this[kPeers].has(userId)) {
        this[kPeers].get(userId).call.close();
        this[kPeers].delete(userId);
      }

      this[kView].setParticipants(this[kPeers].size);
      this[kStopRecording](userId);
      this[kView].removeElementVideo(userId);
    };
  }

  [kOnPeerError]() {
    return (error) => {
      console.log("error on peer:  ", error);
    };
  }

  [kOnConnectionOpened]() {
    return (peer) => {
      const id = peer.id;
      console.log("Peer: ", peer);
      this[kSocket].emit("join-room", this[kRoom], id);
    };
  }

  [kOnCallReceived]() {
    return (call) => {
      console.log("answer call", call);
      call.answer(this[kCurrentStream]);
    };
  }

  [kOnPeerStreamReceived]() {
    return (call, stream) => {
      const callerId = call.peer;
      if (this[kPeers].has(callerId)) {
        console.log("calling twice2, ignoring second one", callerId);
        return;
      }

      this.addVideoStream(callerId, stream);
      this[kPeers].set(callerId, { call });
      this[kView].setParticipants(this[kPeers].size);
    };
  }

  [kOnPeerCallError]() {
    return (call, error) => {
      console.log("an call error ocurred: ", error);
      this[kView].removeVideoElement(call.peer);
    };
  }

  [kOnCallClose]() {
    return (call) => {
      console.log("call closed", call.peer);
    };
  }

  [kOnRecordPressed](recordingEnabled) {
    this.recordingEnabled = recordingEnabled;
    for (const [key, value] of this[kUserRecording]) {
      if (this.recordingEnabled) {
        value.startRecording();
        continue;
      }
      this[kStopRecording](key);
    }
  }

  async [kStopRecording](userId) {
    const userRecordings = this[kUserRecording];
    for (const [key, value] of userRecordings) {
      const isContextUser = key.includes(userId);

      if (!isContextUser) continue;

      const rec = value;
      const isRecordingActive = rec.recordingActive;
      if (!isRecordingActive) continue;

      await rec.stopRecording();
      this[kPlayRecordings](key);
    }
  }

  [kPlayRecordings](userId) {
    const user = this[kUserRecording].get(userId);
    const videoURLs = user.getAllVideoURLs();
    videoURLs.map((url) => this[kView].renderVideo({ url, userId }));
  }

  [kOnLeavePressed]() {
    this[kUserRecording].forEach((value, key) => {
      value.download();
    });
  }
}
