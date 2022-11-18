"use babel";

// Imports for Discord RPC
import { Client } from "discord-rpc";

// Application ID - Don't touch this
const clientId = "1042665019256610867";

// Idk how this works, but Discord says to do it
const rpc = new Client({ transport: "ipc" });

// Grab local Database from InkDrop
const db = inkdrop.main.dataStore.getLocalDB();

// Keep track of time since plugin started
const timestamp = Date.now();

// Get current application state
let state = inkdrop.store.getState();

// Get current version of InkDrop
let version = state["session"].account.version;

// Title of editor note
let noteTitle = "Browsing notebooks";

// Parent book of editor note
let bookTitle = "Idle...";

// Current bookId
let bookId;

// Reference our interval;
let activityInterval;

// * Set Activty Status for Discord
async function setActivity() {
  if (!rpc) {
    return;
  }

  // * Load all current books from local DB
  const books = await db.books.all();

  // * Compare book id with current to find name of book
  for (var key of Object.keys(books)) {
    if (books[key]._id === bookId) {
      bookTitle = `Workspace: ${books[key].name}`;
    }
  }

  // * Set Rich Presence Information
  rpc.setActivity({
    details: noteTitle,
    state: bookTitle,
    startTimestamp: timestamp,
    largeImageKey: "inkdrop_small",
    largeImageText: `Inkdrop ${version}`,
    smallImageText: `Inkdrop ${version}`,
    instance: false,
    buttons: [{ label: `Download Inkdrop`, url: `https://www.inkdrop.app/` }],
  });
}

// * Update all of our activity data
const setActivityData = () => {
  // * Get current state again
  state = inkdrop.store.getState();

  // * If our current note title exists update rpc var
  if (state["editingNote"].title !== null) {
    noteTitle = `${state["editingNote"].title}`;
    bookId = state["editingNote"].bookId;
  }

  // ? If our note title is blank, set to Untitled
  if (state["editingNote"].title === "") {
    noteTitle = "Untitled";
  }

  // Actually update data
  setActivity();
};

// RPC Startup
rpc.on("ready", () => {
  console.log("[Discord-RPC] Activated!");
  setActivityData();

  // * Activity can only be set every 15 seconds due to Discord limits
  activityInterval = setInterval(() => {
    setActivityData();
  }, 15e3);
});

// On plugin activate
export function activate() {
  // ! Login to Discord RPC
  rpc
    .login({ clientId })
    .then(() => console.log("[Discord-RPC] Online!"))
    .catch(console.error);
}

// On plugin deactivate
export function deactivate() {
  // Clear all current Discord Activity
  rpc.clearActivity().then(() => {
    console.log("[Discord-RPC] Deactivated!");
  });

  // Stop interval
  clearInterval(activityInterval);
}
