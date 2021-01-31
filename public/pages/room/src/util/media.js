class Media {
  async getCamera(audio = true, video = true) {
    const navigatorMediaDevices = navigator.mediaDevices;

    if (!navigatorMediaDevices)
      throw new Error("navigator mediadevices is undefined");

    return navigatorMediaDevices.getUserMedia({
      video,
      audio,
    });
  }
}
