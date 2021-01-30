const kOnUserConnected = Symbol("kOnUserConnected");
const kOnUserDisconnected = Symbol("kOnUserDisconnected");
const kCurrentStream = Symbol("kCurrentStream");
const kRoom = Symbol("kRoom");
const kMedia = Symbol("kMedia");
const kView = Symbol("kView");
const kSocketBuilder = Symbol("kSocketBuilder");

class Business {
  constructor({ room, media, view, socketBuilder }) {
    this[kRoom] = room;
    this[kMedia] = media;
    this[kView] = view;
    this[kSocketBuilder] = socketBuilder
      .setOnUserConnected(this[kOnUserConnected].bind(this))
      .setOnUserDisconnected(this[kOnUserConnected].bind(this))
      .build();

    this[kSocketBuilder].emit("join-room", this[kRoom], "allan");

    this[kCurrentStream] = {};
  }

  static initialize(dependencies) {
    const instance = new Business(dependencies);
    return instance._init();
  }

  async _init() {
    this[kCurrentStream] = await this[kMedia].getCamera();
    this.addVideoStream("allan");
  }

  addVideoStream(userId, stream = this[kCurrentStream]) {
    const isCurrentId = false;
    console.log("add video stream here");
    this[kView].renderVideo({
      userId,
      stream,
      isCurrentId,
    });
  }

  [kOnUserConnected]() {
    return (userId) => {
      console.log("user connected: ", userId);
    };
  }

  [kOnUserDisconnected]() {
    return (userId) => {
      console.log("user disconnected: ", userId);
    };
  }
}
