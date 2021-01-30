const onload = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const room = urlParams.get("room");
  console.log("this is the room", room);

  const socketUrl = "http://localhost:3000";

  const peerConfig = Object.values({
    id: undefined,
    config: {
      port: 9000,
      host: "localhost",
      path: "/",
    },
  });

  const socketBuilder = new SocketBuilder({ socketUrl });
  const peerBuilder = new PeerBuilder({ peerConfig });

  const view = new View();
  const media = new Media();

  const dependencies = {
    view,
    media,
    room,
    socketBuilder,
    peerBuilder,
  };

  Business.initialize(dependencies);
};

window.onload = onload;
