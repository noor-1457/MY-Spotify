console.log("Let's start writing JS");

// ✅ Initialize variables
let currentSong = new Audio();
let songs = [];
let currentIndex = 0; // Keeps track of which song is currently playing
let currfolder;

let play = document.getElementById("play");
let previous = document.getElementById("previous");
let next = document.getElementById("next");

// ✅ Function to get songs dynamically from a folder
async function getSongs(folder) {
  currfolder = folder;
  let a = await fetch(`${folder}/`);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let as = div.getElementsByTagName("a");

  let songList = [];
  for (let index = 0; index < as.length; index++) {
    const element = as[index];
    if (element.href.endsWith(".mp3")) {
      // ✅ Extract only the song name, not full path
      songList.push(element.href.split(`/${folder}/`)[1]);
    }
  }

  // ✅ Corrected: use 'songList' instead of 'songs'
  let songUl = document.querySelector(".songList ul");
  songUl.innerHTML = "";
  for (const song of songList) {
    songUl.innerHTML += `
      <li>
        <img src="./assets/music.png" alt="" width="30" height="30">
        <div class="info">
          <div>${song.replaceAll("%20", " ")}</div>
        </div>
        <div class="playnow">
          <span>Play Now</span>
          <img class="invert" src="./assets/p-b.png" alt="" width="20" height="20">
        </div>
      </li>`;
  }

  // ✅ Return list of songs for further use
  return songList;
}

// ✅ Function to play music
const playMusic = (track, pause = false) => {
  currentSong.pause();
  currentSong.src = `/${currfolder}/` + track;

  // Play automatically unless told to pause
  if (!pause) {
    currentSong.play();
    play.src = "./assets/video-pause-button.png"; // ✅ corrected: match play/pause icon
  } else {
    play.src = "./assets/p-b.png";
  }

  // ✅ Update UI with song name & time
  document.querySelector(".song-info").innerHTML = track.replaceAll("%20", " ");
  document.querySelector(".time").innerHTML = "00:00 / 00:00";
};

// ✅ Helper function to convert seconds → MM:SS
function formatTime(seconds) {
  seconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

// ✅ Main function
async function main() {
  // Load default folder
  songs = await getSongs("songs/ncs");

  // Start with first song but paused
  playMusic(songs[0], true);

  // ✅ Attach event listener to each song in playlist
  Array.from(document.querySelectorAll(".songList li")).forEach((li, index) => {
    li.addEventListener("click", () => {
      currentIndex = index;
      playMusic(songs[currentIndex]);
    });
  });

  // ✅ Play / Pause button logic
  play.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      play.src = "./assets/video-pause-button.png";
    } else {
      currentSong.pause();
      play.src = "./assets/p-b.png";
    }
  });

  // ✅ Previous song
  previous.addEventListener("click", () => {
    if (currentIndex > 0) currentIndex--;
    else currentIndex = songs.length - 1; // Loop back to last song
    playMusic(songs[currentIndex]);
  });

  // ✅ Next song
  next.addEventListener("click", () => {
    if (currentIndex < songs.length - 1) currentIndex++;
    else currentIndex = 0; // Loop back to first song
    playMusic(songs[currentIndex]);
  });

  // ✅ Update song time and progress bar
  currentSong.addEventListener("timeupdate", () => {
    let current = formatTime(currentSong.currentTime);
    let total = formatTime(currentSong.duration);
    document.querySelector(".time").innerHTML = `${current} / ${total}`;

    // ✅ Handle circle movement safely (avoid NaN when duration = 0)
    if (currentSong.duration > 0) {
      document.querySelector(".circle").style.left =
        (currentSong.currentTime / currentSong.duration) * 100 + "%";
    }
  });

  // ✅ Hamburger menu toggle
  let hamburger = document.querySelector(".hamburger");
  let left_box = document.querySelector(".left");
  hamburger.addEventListener("click", () => {
    left_box.style.left = "0";
  });

  // ✅ Close button for sidebar
  let closebtn = document.querySelector(".close");
  closebtn.addEventListener("click", () => {
    left_box.style.left = "-120%";
  });
}

// ✅ Seekbar click to jump in song
document.querySelector(".seekbar").addEventListener("click", (e) => {
  let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
  document.querySelector(".circle").style.left = percent + "%";
  currentSong.currentTime = (percent / 100) * currentSong.duration;
});

// ✅ Load the playlist when a card is clicked
Array.from(document.getElementsByClassName("card")).forEach((card) => {
  card.addEventListener("click", async (event) => {
    const folderName = event.currentTarget.dataset.folder;
    console.log("Folder selected:", folderName);

    // Load new songs from the clicked folder
    songs = await getSongs(`songs/${folderName}`);

    // Play the first song but keep it paused initially
    playMusic(songs[0], true);

    // ✅ Reattach event listeners to the *new* song list
    Array.from(document.querySelectorAll(".songList li")).forEach(
      (li, index) => {
        li.addEventListener("click", () => {
          currentIndex = index;
          playMusic(songs[currentIndex]);
        });
      }
    );
  });
});

//adding more folders
// ✅ Show all folders (albums)
async function displayAllItems() {
  try {
    let res = await fetch(`songs/`);
    let html = await res.text();

    let div = document.createElement("div");
    div.innerHTML = html;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".card-container");
    cardContainer.innerHTML = ""; // clear old cards

    for (let e of anchors) {
      if (e.href.includes("/songs/") && !e.href.endsWith(".mp3")) {
        let folder = e.href.split("/songs/")[1].replace("/", "");
        if (!folder) continue;

        try {
          // ✅ only show folders that have info.json (album data)
          let infoRes = await fetch(`songs/${folder}/info.json`);
          if (!infoRes.ok) continue;

          let info = await infoRes.json();

          // ✅ check if cover.jpg exists (optional but keeps design clean)
          let coverCheck = await fetch(`songs/${folder}/cover.jpg`);
          if (!coverCheck.ok) continue;

          // ✅ now safely add the card
          cardContainer.innerHTML += `
            <div class="card" data-folder="${folder}">
              <div class="play">
                <img src="./assets/play.png" alt="" width="30px" height="30px">
              </div>
              <img src="songs/${folder}/cover.jpg" alt="${info.title}">
              <h2>${info.title}</h2>
              <p>${info.description}</p>
            </div>`;
        } catch (error) {
          console.log("Skipping folder:", folder, "-", error.message);
        }
      }
    }

    // ✅ IMPORTANT: attach event listeners *after* cards are created
    Array.from(document.getElementsByClassName("card")).forEach((card) => {
      card.addEventListener("click", async (event) => {
        const folderName = event.currentTarget.dataset.folder;
        console.log("Folder selected:", folderName);

        // Load new songs from clicked folder
        songs = await getSongs(`songs/${folderName}`);

        // Play the first song (paused initially)
        playMusic(songs[0], true);

        // Reattach listeners for new song list
        Array.from(document.querySelectorAll(".songList li")).forEach(
          (li, index) => {
            li.addEventListener("click", () => {
              currentIndex = index;
              playMusic(songs[currentIndex]);
            });
          }
        );
      });
    });
  } catch (error) {
    console.error("Error loading songs folders:", error.message);
  }
}

// ✅ Initialize everything
displayAllItems();
main();
