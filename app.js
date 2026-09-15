const places = [
  {
    aliases: ["景福宮", "景福宫", "gyeongbokgung"],
    zh: "景福宮", ko: "경복궁", en: "Gyeongbokgung Palace",
    address: "서울특별시 종로구 사직로 161", lat: 37.579617, lng: 126.977041,
    duration: "約 24 分", transfer: "轉乘 1 次",
    steps: [
      { id: "133", zh: "首爾站", ko: "서울역", en: "Seoul Station", line: "1號線", color: "#0052a4", info: "往東廟前方向" },
      { id: "130", zh: "鐘路三街", ko: "종로3가", en: "Jongno 3-ga", line: "3號線", color: "#ef7c1c", info: "轉乘 · 往大化方向", transfer: true },
      { id: "327", zh: "景福宮站", ko: "경복궁역", en: "Gyeongbokgung", line: "3號線", color: "#ef7c1c", info: "5號出口 · 步行 6 分" }
    ]
  },
  {
    aliases: ["廣藏市場", "广藏市场", "gwangjang"],
    zh: "廣藏市場", ko: "광장시장", en: "Gwangjang Market",
    address: "서울특별시 종로구 창경궁로 88", lat: 37.570153, lng: 126.99934,
    duration: "約 18 分", transfer: "免轉乘",
    steps: [
      { id: "133", zh: "首爾站", ko: "서울역", en: "Seoul Station", line: "1號線", color: "#0052a4", info: "往東廟前方向" },
      { id: "129", zh: "鐘路五街", ko: "종로5가", en: "Jongno 5-ga", line: "1號線", color: "#0052a4", info: "7號出口 · 步行 4 分" }
    ]
  },
  {
    aliases: ["弘大", "弘大入口", "hongdae"],
    zh: "弘大入口", ko: "홍대입구", en: "Hongik Univ.",
    address: "서울특별시 마포구 양화로 160", lat: 37.557192, lng: 126.925381,
    duration: "約 12 分", transfer: "免轉乘",
    steps: [
      { id: "A01", zh: "首爾站", ko: "서울역", en: "Seoul Station", line: "機場鐵路", color: "#0090d2", info: "往仁川機場方向" },
      { id: "A03", zh: "弘大入口", ko: "홍대입구", en: "Hongik Univ.", line: "機場鐵路", color: "#0090d2", info: "9號出口" }
    ]
  },
  {
    aliases: ["聖水洞", "聖水", "圣水洞", "seongsu"],
    zh: "聖水洞", ko: "성수동", en: "Seongsu-dong",
    address: "서울특별시 성동구 성수동2가", lat: 37.54458, lng: 127.05596,
    duration: "約 31 分", transfer: "轉乘 1 次",
    steps: [
      { id: "426", zh: "首爾站", ko: "서울역", en: "Seoul Station", line: "4號線", color: "#00a5de", info: "往榛接方向" },
      { id: "205", zh: "東大門歷史文化公園", ko: "동대문역사문화공원", en: "Dongdaemun History & Culture Park", line: "2號線", color: "#00a84d", info: "轉乘 · 往聖水方向", transfer: true },
      { id: "211", zh: "聖水站", ko: "성수역", en: "Seongsu", line: "2號線", color: "#00a84d", info: "3號出口" }
    ]
  },
  {
    aliases: ["明洞", "myeongdong"],
    zh: "明洞", ko: "명동", en: "Myeong-dong",
    address: "서울특별시 중구 명동", lat: 37.56094, lng: 126.9862,
    duration: "約 7 分", transfer: "免轉乘",
    steps: [
      { id: "426", zh: "首爾站", ko: "서울역", en: "Seoul Station", line: "4號線", color: "#00a5de", info: "往榛接方向" },
      { id: "424", zh: "明洞站", ko: "명동역", en: "Myeong-dong", line: "4號線", color: "#00a5de", info: "6號出口" }
    ]
  }
];

const form = document.querySelector("#search-form");
const input = document.querySelector("#search-input");
const resultSection = document.querySelector("#result-section");
const toast = document.querySelector("#toast");
let selectedPlace = places[0];

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function findPlace(query) {
  const normalized = query.trim().toLowerCase();
  return places.find(place => place.aliases.some(alias => alias.toLowerCase().includes(normalized) || normalized.includes(alias.toLowerCase())));
}

function renderRoute(place) {
  const steps = place.steps.map((step, index) => `
    <div class="route-step" style="--step-color:${step.color}">
      <div class="track"><span class="station-dot">${step.id}</span></div>
      <div class="station-name">
        <strong>${step.zh}</strong><span>${step.ko}</span><small>${step.en}</small>
        <b class="line-pill">${step.line}</b>
      </div>
      <div class="ride-info">${step.info}</div>
    </div>${step.transfer ? '<p class="transfer-note">轉乘時請跟著月台上的路線顏色與韓文站名行走</p>' : ''}
  `).join("");
  document.querySelector("#route-steps").innerHTML = steps;
}

function renderPlace(place) {
  selectedPlace = place;
  document.querySelector("#place-name").textContent = place.zh;
  document.querySelector("#place-ko").textContent = place.ko;
  document.querySelector("#place-en").textContent = place.en;
  document.querySelector("#place-address").textContent = place.address;
  document.querySelector("#route-duration").textContent = place.duration;
  document.querySelector("#route-transfer").textContent = place.transfer;
  const encodedName = encodeURIComponent(place.ko);
  document.querySelector("#naver-link").href = `https://map.naver.com/p/search/${encodedName}`;
  renderRoute(place);
  resultSection.hidden = false;
  window.setTimeout(() => resultSection.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
}

form.addEventListener("submit", event => {
  event.preventDefault();
  if (!input.value.trim()) return input.focus();
  const match = findPlace(input.value);
  if (!match) {
    showToast("MVP 尚未收錄，正式版將交由 Google 搜尋韓文名稱");
    return;
  }
  renderPlace(match);
});

document.querySelectorAll("[data-query]").forEach(button => button.addEventListener("click", () => {
  input.value = button.dataset.query;
  renderPlace(findPlace(button.dataset.query));
}));

document.querySelector("#clear-search").addEventListener("click", () => {
  input.value = "";
  input.focus();
});

document.querySelector("#copy-address").addEventListener("click", async () => {
  await navigator.clipboard.writeText(`${selectedPlace.ko}\n${selectedPlace.address}`);
  showToast("已複製韓文名稱與地址");
});

document.querySelector("#save-route").addEventListener("click", event => {
  const saved = event.currentTarget.textContent === "♥";
  event.currentTarget.textContent = saved ? "♡" : "♥";
  showToast(saved ? "已取消收藏" : "路線已收藏");
});
