"use babel";

// Imports for Discord RPC
const RPC = require("discord-rpc");

const clientId = "1042665019256610867";
const rpc = new RPC.Client({ transport: "ipc" });

// ! Grab state and DB information from InkDrop
const db = inkdrop.main.dataStore.getLocalDB();
const timestamp = Date.now();

let state = inkdrop.store.getState();

// * Get current version of InkDrop
let version = state["session"].account.version;
// ! Dicord RPC Variables
let noteTitle = "Browsing notebooks";
let bookTitle = "Idle...";
let bookId;

// * Set Activty
async function setActivity() {
  if (!rpc) {
    return;
  }

  // * Loads all current books from local DB
  const books = await db.books.all();

  // * Compare book id's with current to find name of book
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
    smallImageKey: "inkdrop_small",
    smallImageText: `Inkdrop ${version}`,
    instance: false,
    buttons: [{ label: `Download Inkdrop`, url: `https://www.inkdrop.app/` }],
  });
}

module.exports = {
  activate() {
    // ! On RPC Bootup
    rpc.on("ready", () => {
      console.log("Discord RPC Ready");

      // ! Activity can only be set every 15 seconds due to Discord
      setInterval(() => {
        setActivity();
        state = inkdrop.store.getState();
        if (state["editingNote"].title !== null) {
          noteTitle = `${state["editingNote"].title}`;
          bookId = state["editingNote"].bookId;
        } else {
          noteTitle = "Untitled";
        }

        // * Grab current editing note details and assign as needed
      }, 15e3);
    });
  },

  deactivate() {
    console.log("Deactivating");
    rpc.destroy();
  },
};

// ! Login to Discord RPC
rpc.login({ clientId }).catch(console.error);
