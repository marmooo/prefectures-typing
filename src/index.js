import simpleKeyboard from "https://cdn.jsdelivr.net/npm/simple-keyboard@3.7.77/+esm";
import { Romaji } from "https://cdn.jsdelivr.net/npm/@marmooo/romaji/+esm";

const gamePanel = document.getElementById("gamePanel");
const infoPanel = document.getElementById("infoPanel");
const countPanel = document.getElementById("countPanel");
const scorePanel = document.getElementById("scorePanel");
const startButton = document.getElementById("startButton");
const romaNode = document.getElementById("roma");
const japanese = document.getElementById("japanese");
const gameTime = 300;
let playing;
let countdowning;
let typeTimer;
// https://dova-s.jp/bgm/play19615.html
const bgm = new Audio("mp3/bgm.mp3");
bgm.volume = 0.3;
bgm.loop = true;
let errorCount = 0;
let normalCount = 0;
let solveCount = 0;
let problems = [];
let problem;
let guide = false;
const layout104 = {
  "default": [
    "q w e r t y u i o p",
    "a s d f g h j k l ;",
    "z x c v b n m , .",
    "🌏 {altLeft} {space} {altRight}",
  ],
  "shift": [
    "Q W E R T Y U I O P",
    "A S D F G H J K L :",
    "Z X C V B N M < >",
    "🌏 {altLeft} {space} {altRight}",
  ],
};
const layout109 = {
  "default": [
    "q w e r t y u i o p",
    "a s d f g h j k l ;",
    "z x c v b n m , .",
    "🌏 無変換 {space} 変換",
  ],
  "shift": [
    "Q W E R T Y U I O P",
    "A S D F G H J K L +",
    "Z X C V B N M < >",
    "🌏 無変換 {space} 変換",
  ],
};
const keyboardDisplay = {
  "{space}": " ",
  "{altLeft}": "Alt",
  "{altRight}": "Alt",
  "🌏": (navigator.language.startsWith("ja")) ? "🇯🇵" : "🇺🇸",
};
const keyboard = new simpleKeyboard.default({
  layout: (navigator.language.startsWith("ja")) ? layout109 : layout104,
  display: keyboardDisplay,
  onInit: () => {
    document.getElementById("keyboard").classList.add("d-none");
  },
  onKeyPress: (input) => {
    switch (input) {
      case "{space}":
        return typeEventKey(" ");
      case "無変換":
        return typeEventKey("NonConvert");
      case "変換":
        return typeEventKey("Convert");
      case "🌏": {
        if (keyboard.options.layout == layout109) {
          keyboardDisplay["🌏"] = "🇺🇸";
          keyboard.setOptions({
            layout: layout104,
            display: keyboardDisplay,
          });
        } else {
          keyboardDisplay["🌏"] = "🇯🇵";
          keyboard.setOptions({
            layout: layout109,
            display: keyboardDisplay,
          });
        }
        break;
      }
      default:
        return typeEventKey(input);
    }
  },
});
const audioContext = new globalThis.AudioContext();
const audioBufferCache = {};
loadAudio("end", "mp3/end.mp3");
loadAudio("keyboard", "mp3/keyboard.mp3");
loadAudio("correct", "mp3/correct.mp3");
loadAudio("incorrect", "mp3/cat.mp3");
let japaneseVoices = [];
loadVoices();
loadConfig();

function loadConfig() {
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
  if (localStorage.getItem("bgm") != 1) {
    document.getElementById("bgmOn").classList.add("d-none");
    document.getElementById("bgmOff").classList.remove("d-none");
  }
}

function toggleDarkMode() {
  if (localStorage.getItem("darkMode") == 1) {
    localStorage.setItem("darkMode", 0);
    document.documentElement.setAttribute("data-bs-theme", "light");
  } else {
    localStorage.setItem("darkMode", 1);
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
}

function toggleBGM() {
  if (localStorage.getItem("bgm") == 1) {
    document.getElementById("bgmOn").classList.add("d-none");
    document.getElementById("bgmOff").classList.remove("d-none");
    localStorage.setItem("bgm", 0);
    bgm.pause();
  } else {
    document.getElementById("bgmOn").classList.remove("d-none");
    document.getElementById("bgmOff").classList.add("d-none");
    localStorage.setItem("bgm", 1);
    bgm.play();
  }
}

function toggleKeyboard() {
  const virtualKeyboardOn = document.getElementById("virtualKeyboardOn");
  const virtualKeyboardOff = document.getElementById("virtualKeyboardOff");
  if (virtualKeyboardOn.classList.contains("d-none")) {
    virtualKeyboardOn.classList.remove("d-none");
    virtualKeyboardOff.classList.add("d-none");
    document.getElementById("keyboard").classList.remove("d-none");
  } else {
    virtualKeyboardOn.classList.add("d-none");
    virtualKeyboardOff.classList.remove("d-none");
    document.getElementById("keyboard").classList.add("d-none");
    document.getElementById("guideSwitch").checked = false;
    guide = false;
  }
}

function toggleGuide(event) {
  if (event.target.checked) {
    guide = true;
  } else {
    guide = false;
  }
}

async function playAudio(name, volume) {
  const audioBuffer = await loadAudio(name, audioBufferCache[name]);
  const sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = audioBuffer;
  if (volume) {
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    gainNode.connect(audioContext.destination);
    sourceNode.connect(gainNode);
    sourceNode.start();
  } else {
    sourceNode.connect(audioContext.destination);
    sourceNode.start();
  }
}

async function loadAudio(name, url) {
  if (audioBufferCache[name]) return audioBufferCache[name];
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  audioBufferCache[name] = audioBuffer;
  return audioBuffer;
}

function unlockAudio() {
  audioContext.resume();
}

function loadVoices() {
  // https://stackoverflow.com/questions/21513706/
  const allVoicesObtained = new Promise((resolve) => {
    let voices = speechSynthesis.getVoices();
    if (voices.length !== 0) {
      resolve(voices);
    } else {
      let supported = false;
      speechSynthesis.addEventListener("voiceschanged", () => {
        supported = true;
        voices = speechSynthesis.getVoices();
        resolve(voices);
      });
      setTimeout(() => {
        if (!supported) {
          document.getElementById("noTTS").classList.remove("d-none");
        }
      }, 1000);
    }
  });
  allVoicesObtained.then((voices) => {
    japaneseVoices = voices.filter((voice) => voice.lang == "ja-JP");
  });
}

function loopVoice(text, n) {
  speechSynthesis.cancel();
  const msg = new globalThis.SpeechSynthesisUtterance(text);
  msg.voice = japaneseVoices[Math.floor(Math.random() * japaneseVoices.length)];
  msg.lang = "ja-JP";
  for (let i = 0; i < n; i++) {
    speechSynthesis.speak(msg);
  }
}

function loadProblems() {
  fetch("problems.csv")
    .then((response) => response.text())
    .then((csv) => {
      problems = csv.trimEnd().split("\n").map((line, id) => {
        const [kanji, yomi] = line.split(",");
        return { id: id, kanji: kanji, yomi: yomi };
      });
      problem = problems[12]; // 東京都
      problem.romaji = new Romaji(problem.yomi);
    }).catch((err) => {
      console.error(err);
    });
}

function nextProblem() {
  playAudio("correct", 0.3);
  solveCount += 1;
  typable();
}

function removeGuide(key) {
  if (key == " ") key = "{space}";
  const button = keyboard.getButtonElement(key);
  if (button) {
    button.classList.remove("guide");
    keyboard.setOptions({ layoutName: "default" });
  } else {
    const shift = keyboard.getButtonElement("{shift}");
    if (shift) shift.classList.remove("guide");
  }
}

function showGuide(key) {
  if (key == " ") key = "{space}";
  const button = keyboard.getButtonElement(key);
  if (button) {
    button.classList.add("guide");
  } else {
    const shift = keyboard.getButtonElement("{shift}");
    if (shift) shift.classList.add("guide");
  }
}

function typeEvent(event) {
  switch (event.code) {
    case "Space":
      event.preventDefault();
      // falls through
    default:
      return typeEventKey(event.key);
  }
}

function typeEventKey(key) {
  switch (key) {
    case "NonConvert": {
      loopVoice(problem.kanji, 1);
      japanese.textContent = `${problem.kanji} (${problem.yomi})`;
      const visibility = "visible";
      japanese.style.visibility = visibility;
      const children = romaNode.children;
      children[1].style.visibility = visibility;
      children[2].style.visibility = visibility;
      downTime(5);
      return;
    }
    case "Escape":
      startGame();
      return;
    case " ":
      if (!playing) {
        startGame();
        return;
      }
  }
  if (key.length == 1) {
    key = key.toLowerCase();
    const romaji = problem.romaji;
    const prevNode = problem.romaji.currentNode;
    const state = romaji.input(key);
    if (state) {
      playAudio("keyboard");
      normalCount += 1;
      const remainedRomaji = romaji.remainedRomaji;
      romaNode.children[0].textContent += key;
      romaNode.children[1].textContent = remainedRomaji[0];
      romaNode.children[2].textContent = remainedRomaji.slice(1);
      for (const key of prevNode.children.keys()) {
        removeGuide(key);
      }
      if (romaji.isEnd()) {
        nextProblem();
      } else if (guide) {
        showGuide(remainedRomaji[0]);
      }
    } else {
      playAudio("incorrect", 0.3);
      errorCount += 1;
    }
  }
}

function shuffle(array) {
  for (let i = array.length; 1 < i; i--) {
    const k = Math.floor(Math.random() * i);
    [array[k], array[i - 1]] = [array[i - 1], array[k]];
  }
  return array;
}

function startGame() {
  clearInterval(typeTimer);
  initTime();
  countdown();
  shuffle(problems);
  countPanel.classList.remove("d-none");
  scorePanel.classList.add("d-none");
}

function paintPrefecture(prefectureId) {
  const doc = document.getElementById("map").contentDocument;
  doc.querySelectorAll(".main").forEach((node) => {
    while (!node.dataset.code) {
      node = node.parentNode;
    }
    const id = parseInt(node.dataset.code) - 1;
    if (id == prefectureId) {
      node.setAttribute("fill", "black");
    } else {
      node.setAttribute("fill", "#eee");
    }
  });
}

function typable() {
  if (solveCount >= problems.length) {
    speechSynthesis.cancel();
    clearInterval(typeTimer);
    bgm.pause();
    playAudio("end");
    scoring();
  } else {
    const prevProblem = problem;
    problem = problems[solveCount];
    paintPrefecture(problem.id);
    japanese.textContent = `${problem.kanji} (${problem.yomi})`;
    const romaji = new Romaji(problem.yomi);
    problem.romaji = romaji;
    const children = romaNode.children;
    children[0].textContent = romaji.inputedRomaji;
    children[1].textContent = romaji.remainedRomaji[0];
    children[2].textContent = romaji.remainedRomaji.slice(1);

    if (mode.textContent == "EASY") loopVoice(problem.kanji, 1);
    const visibility = (mode.textContent == "EASY") ? "visible" : "hidden";
    children[1].style.visibility = visibility;
    children[2].style.visibility = visibility;
    japanese.style.visibility = visibility;

    if (guide) {
      if (prevProblem) {
        const prevNode = prevProblem.romaji.currentNode;
        if (prevNode) {
          for (const key of prevNode.children.keys()) {
            removeGuide(key);
          }
        }
      }
      const nextKey = problem.romaji.currentNode.children.keys().next().value;
      showGuide(nextKey);
    }
  }
}

function countdown() {
  if (countdowning) return;
  countdowning = true;
  normalCount = errorCount = solveCount = 0;
  document.getElementById("guideSwitch").disabled = true;
  document.getElementById("virtualKeyboard").disabled = true;
  gamePanel.classList.add("d-none");
  infoPanel.classList.add("d-none");
  countPanel.classList.remove("d-none");
  counter.textContent = 3;
  const timer = setInterval(() => {
    const counter = document.getElementById("counter");
    const colors = ["skyblue", "greenyellow", "violet", "tomato"];
    if (parseInt(counter.textContent) > 1) {
      const t = parseInt(counter.textContent) - 1;
      counter.style.backgroundColor = colors[t];
      counter.textContent = t;
    } else {
      countdowning = false;
      playing = true;
      clearInterval(timer);
      document.getElementById("guideSwitch").disabled = false;
      document.getElementById("virtualKeyboard").disabled = false;
      gamePanel.classList.remove("d-none");
      countPanel.classList.add("d-none");
      infoPanel.classList.remove("d-none");
      scorePanel.classList.add("d-none");
      globalThis.scrollTo({
        top: document.getElementById("typePanel").getBoundingClientRect().top,
        behavior: "auto",
      });
      typable();
      startTypeTimer();
      if (localStorage.getItem("bgm") == 1) {
        bgm.play();
      }
    }
  }, 1000);
}

function startTypeTimer() {
  const timeNode = document.getElementById("time");
  typeTimer = setInterval(() => {
    const t = parseInt(timeNode.textContent);
    if (t > 0) {
      timeNode.textContent = t - 1;
    } else {
      clearInterval(typeTimer);
      bgm.pause();
      playAudio("end");
      scoring();
    }
  }, 1000);
}

function downTime(n) {
  const timeNode = document.getElementById("time");
  const t = parseInt(timeNode.textContent);
  const downedTime = t - n;
  if (downedTime < 0) {
    timeNode.textContent = 0;
  } else {
    timeNode.textContent = downedTime;
  }
}

function initTime() {
  document.getElementById("time").textContent = gameTime;
}

function scoring() {
  playing = false;
  infoPanel.classList.remove("d-none");
  gamePanel.classList.add("d-none");
  countPanel.classList.add("d-none");
  scorePanel.classList.remove("d-none");
  let time = parseInt(document.getElementById("time").textContent);
  if (time < gameTime) {
    time = gameTime - time;
  }
  const typeSpeed = (normalCount / time).toFixed(2);
  document.getElementById("solveCount").textContent = solveCount;
  document.getElementById("totalType").textContent = normalCount + errorCount;
  document.getElementById("typeSpeed").textContent = typeSpeed;
  document.getElementById("errorType").textContent = errorCount;
  document.getElementById("twitter").href =
    "https://twitter.com/intent/tweet?text=都道府県タイピングをプレイしたよ! (速度: " +
    typeSpeed + "回/秒) " +
    "&url=https%3a%2f%2fmarmooo.github.com/prefectures-typing/%2f&hashtags=都道府県タイピング";
}

function changeMode(event) {
  if (event.target.textContent == "EASY") {
    event.target.textContent = "HARD";
  } else {
    event.target.textContent = "EASY";
  }
}

paintPrefecture(13); // 東京
loadProblems();

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("toggleBGM").onclick = toggleBGM;
document.getElementById("virtualKeyboard").onclick = toggleKeyboard;
document.getElementById("mode").onclick = changeMode;
document.getElementById("guideSwitch").onchange = toggleGuide;
startButton.addEventListener("click", startGame);
document.addEventListener("keydown", typeEvent);
document.addEventListener("click", unlockAudio, {
  once: true,
  useCapture: true,
});
