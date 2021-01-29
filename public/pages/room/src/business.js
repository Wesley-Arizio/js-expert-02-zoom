class Business {
  constructor({ room, media, view, socketBuilder }) {
    this.room = room;
    this.media = media;
    this.view = view;
    this.socketBuilder = socketBuilder
      .setOnUserConnected(this.onUserConnected)
      .setOnUserDisconnected(this.onUserDisconnected)
      .build();

    this.socketBuilder.emit("join-room", this.room, "wesleyazinho");

    this.currentStream = {};
  }

  static initialize(dependencies) {
    const instance = new Business(dependencies);
    return instance._init();
  }

  async _init() {
    this.currentStream = await this.media.getCamera();
    this.addVideoStream("wesleyzinho");
  }

  addVideoStream(userId, stream = this.currentStream) {
    const isCurrentId = false;
    console.log("add video stream here");
    this.view.renderVideo({
      userId,
      stream,
      isCurrentId,
    });
  }

  onUserConnected = function () {
    return (userId) => {
      console.log("user connected: ", userId);
    };
  };

  onUserDisconnected = function () {
    return (userId) => {
      console.log("user disconnected: ", userId);
    };
  };
}
