console.log("Let's start writing JS");

// ✅ Initialize variables
let currentSong = new Audio();
let songs = [];
let currentIndex = 0; // Keeps track of which song is currently playing
let currfolder;

let play = document.getElementById("play");
let previous = document.getElementById("previous");
let next = document.getElementById("next");

// ✅ Function to get songs dynamically from info.json file in a folder
async function getSongs(folder) {
  currfolder = folder;

  try {
    // Fetch the info.json file for the selected folder
    let a = await fetch(`/songs/${folder}/info.json`);
    let data = await a.json();

    // Get songs array from info.json
    let songList = data.songs || [];

    // ✅ Populate the song list in UI
    let songUl = document.querySelector(".songList ul");
    songUl.innerHTML = "";
    for (const song of songList) {
      songUl.innerHTML += `
        <li>
          <img src="/assets/music.png" alt="" width="30" height="30">
          <div class="info">
            <div>${song.replaceAll("%20", " ")}</div>
          </div>
          <div class="playnow">
            <span>Play Now</span>
            <img class="invert" src="/assets/p-b.png" alt="" width="20" height="20">
          </div>
        </li>`;
    }

    return songList;
  } catch (error) {
    console.error("Error loading songs:", error.message);
    return [];
  }
}

// ✅ Function to play music
const playMusic = (track, pause = false) => {
  currentSong.pause();
  currentSong.src = `/songs/${currfolder}/` + track;

  if (!pause) {
    currentSong.play();
    play.src = "/assets/video-pause-button.png";
  } else {
    play.src = "/assets/p-b.png";
  }

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
  // Load default folder (e.g., ncs)
  songs = await getSongs("ncs");
  playMusic(songs[0], true);

  // Play selected song
  Array.from(document.querySelectorAll(".songList li")).forEach((li, index) => {
    li.addEventListener("click", () => {
      currentIndex = index;
      playMusic(songs[currentIndex]);
    });
  });

  // Play/Pause toggle
  play.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      play.src = "/assets/video-pause-button.png";
    } else {
      currentSong.pause();
      play.src = "/assets/p-b.png";
    }
  });

  // Previous button
  previous.addEventListener("click", () => {
    if (currentIndex > 0) currentIndex--;
    else currentIndex = songs.length - 1;
    playMusic(songs[currentIndex]);
  });

  // Next button
  next.addEventListener("click", () => {
    if (currentIndex < songs.length - 1) currentIndex++;
    else currentIndex = 0;
    playMusic(songs[currentIndex]);
  });

  // Update progress bar and time
  currentSong.addEventListener("timeupdate", () => {
    let current = formatTime(currentSong.currentTime);
    let total = formatTime(currentSong.duration);
    document.querySelector(".time").innerHTML = `${current} / ${total}`;

    if (currentSong.duration > 0) {
      document.querySelector(".circle").style.left =
        (currentSong.currentTime / currentSong.duration) * 100 + "%";
    }
  });

  // Hamburger open/close
  let hamburger = document.querySelector(".hamburger");
  let left_box = document.querySelector(".left");
  hamburger.addEventListener("click", () => {
    left_box.style.left = "0";
  });

  let closebtn = document.querySelector(".close");
  closebtn.addEventListener("click", () => {
    left_box.style.left = "-120%";
  });
}

// ✅ Seekbar jump
document.querySelector(".seekbar").addEventListener("click", (e) => {
  let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
  document.querySelector(".circle").style.left = percent + "%";
  currentSong.currentTime = (percent / 100) * currentSong.duration;
});

// ✅ Load all folders from folders.json
async function displayAllItems() {
  try {
    let res = await fetch("/songs/folders.json");
    let data = await res.json();
    let folders = data.folders || [];

    let cardContainer = document.querySelector(".card-container");
    cardContainer.innerHTML = "";

    for (let folder of folders) {
      try {
        let infoRes = await fetch(`/songs/${folder}/info.json`);
        if (!infoRes.ok) continue;
        let info = await infoRes.json();

        // Add card for each folder
        cardContainer.innerHTML += `
          <div class="card" data-folder="${folder}">
            <div class="play">
              <img src="/assets/play.png" alt="" width="30px" height="30px">
            </div>
            <img src="/songs/${folder}/cover.jpg" alt="${info.title}">
            <h2>${info.title}</h2>
            <p>${info.description}</p>
          </div>`;
      } catch (err) {
        console.log("Skipping folder:", folder, "-", err.message);
      }
    }

    // Reattach listeners to all cards
    Array.from(document.getElementsByClassName("card")).forEach((card) => {
      card.addEventListener("click", async (event) => {
        const folderName = event.currentTarget.dataset.folder;
        songs = await getSongs(folderName);
        playMusic(songs[0], true);

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
    console.error("Error loading folders:", error.message);
  }
}

// ✅ Initialize app
displayAllItems();
main();
