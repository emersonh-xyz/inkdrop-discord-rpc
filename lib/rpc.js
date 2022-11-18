"use babel";

// Imports for Discord RPC
const RPC = require("discord-rpc");

// Application ID - Don't touch this
const clientId = "1042665019256610867";

// Idk how this works, but Discord says to do it
const rpc = new RPC.Client({ transport: "ipc" });

// ! Grab local Database from Inkdrop 
const db = inkdrop.main.dataStore.getLocalDB();

// Keep track of time since plugin started
const timestamp = Date.now();

// Get current application state
let state = inkdrop.store.getState();

// Get current version of InkDrop
let version = state["session"].account.version;


// Defaults
let noteTitle = "Browsing notebooks";
let bookTitle = "Idle...";
let bookId;

// * Set Activty Status for Discord 
async function setActivity() {
  if (!rpc) {
    return;
  }

  // Load all current books from local DB
  const books = await db.books.all();

  // Compare book id with current to find name of book
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
    
    // ! On RPC Startup
    rpc.on("ready", () => {
      console.log("Discord RPC Ready");

      // ! Activity can only be set every 15 seconds due to Discord limits
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
  },
};

// ! Login to Discord RPC
rpc.login({ clientId }).catch(console.error);
