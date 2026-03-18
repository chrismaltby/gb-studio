import createMusicSession from "components/music/helpers/musicSession";
import API from "renderer/lib/api";

const sfx = decodeURIComponent(window.location.hash).slice(1);
const session = createMusicSession();

session.subscribe((data) => {
  API.music.sendToProjectWindow(data);
});

session.open(sfx);

API.events.music.data.subscribe((_event, d) => {
  session.send(d);
});
