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
  }

  static initialize(dependencies) {
    const instance = new Business(dependencies);
    return instance._init();
  }

  async _init() {
    this[kCurrentStream] = await this[kMedia].getCamera(false);

    this[kSocket] = this[kSocketBuilder]
      .setOnUserConnected(this[kOnUserConnected]())
      .setOnUserDisconnected(this[kOnUserDisconnected]())
      .build();

    this[kCurrentPeer] = await this[kPeerBuilder]
      .setOnError(this[kOnPeerError]())
      .setOnConnectionOpened(this[kOnConnectionOpened]())
      .setOnCallReceived(this[kOnCallReceived]())
      .setOnPeerStreamReceived(this[kOnPeerStreamReceived]())
      .build();

    this.addVideoStream("wesley");
  }

  addVideoStream(userId, stream = this[kCurrentStream]) {
    const isCurrentId = false;
    console.log("add video stream here");
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
      this.addVideoStream(callerId, stream);
      this[kPeers].set(callerId, { call });
      this[kView].setParticipants(this[kPeers].size);
    };
  }
}
