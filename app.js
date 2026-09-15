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
const originInput = document.querySelector("#origin-input");
const resultSection = document.querySelector("#result-section");
const toast = document.querySelector("#toast");
const apiBase = (window.SEOUL_EASY_API || "").replace(/\/$/, "");
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

async function apiRequest(path, options) {
  const response = await fetch(`${apiBase}${path}`, options);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "API request failed");
  return body;
}

async function searchLivePlace(query) {
  const data = await apiRequest(`/api/places?q=${encodeURIComponent(query)}`);
  return data.places?.[0];
}

function renderLiveRoute(route) {
  document.querySelector("#route-duration").textContent = route.durationText || "即時路線";
  document.querySelector("#route-transfer").textContent = `轉乘 ${Math.max(0, (route.steps?.length || 1) - 1)} 次`;
  document.querySelector("#route-steps").innerHTML = (route.steps || []).map(step => `
    <div class="route-step" style="--step-color:${step.color || "#596761"}">
      <div class="track"><span class="station-dot">${step.lineShortName || "M"}</span></div>
      <div class="station-name">
        <strong>${step.departureStop?.zh || step.departureStop?.ko || "上車"} → ${step.arrivalStop?.zh || step.arrivalStop?.ko || "下車"}</strong>
        <span>${step.departureStop?.ko || ""} → ${step.arrivalStop?.ko || ""}</span>
        <small>${step.departureStop?.en || ""} → ${step.arrivalStop?.en || ""}</small>
        <b class="line-pill">${step.lineName || step.lineShortName || "大眾運輸"}</b>
      </div>
      <div class="ride-info">${step.stopCount || ""} 站</div>
    </div>
  `).join("") || '<div class="api-notice"><strong>找不到地鐵路線</strong><p>請改用下方 NAVER 地圖確認當地即時交通。</p></div>';
}

async function renderLiveJourney(originQuery, destinationQuery) {
  const [origin, destination] = await Promise.all([
    /^目前位置\s/.test(originQuery)
      ? Promise.resolve({ location: Object.fromEntries(originQuery.replace("目前位置 ", "").split(", ").map((value, i) => [i ? "lng" : "lat", Number(value)])) })
      : searchLivePlace(originQuery),
    searchLivePlace(destinationQuery)
  ]);
  if (!origin?.location || !destination?.location) throw new Error("找不到起點或目的地");
  selectedPlace = destination;
  document.querySelector("#place-name").textContent = destination.names.zh || destinationQuery;
  document.querySelector("#place-ko").textContent = destination.names.ko || "";
  document.querySelector("#place-en").textContent = destination.names.en || "";
  document.querySelector("#place-address").textContent = destination.addressKo || destination.address || "";
  document.querySelector("#route-title").textContent = `從${originQuery}出發`;
  document.querySelector("#naver-link").href = `https://map.naver.com/p/search/${encodeURIComponent(destination.names.ko || destinationQuery)}`;
  const route = await apiRequest("/api/routes", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origin: origin.location, destination: destination.location })
  });
  renderLiveRoute(route);
  resultSection.hidden = false;
  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
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
  const origin = originInput.value.trim() || "目前位置";
  const isSeoulStation = ["首爾站", "서울역", "seoul station"].includes(origin.toLowerCase());
  document.querySelector("#place-name").textContent = place.zh;
  document.querySelector("#place-ko").textContent = place.ko;
  document.querySelector("#place-en").textContent = place.en;
  document.querySelector("#place-address").textContent = place.address;
  document.querySelector("#route-duration").textContent = isSeoulStation ? place.duration : "等待即時查詢";
  document.querySelector("#route-transfer").textContent = isSeoulStation ? place.transfer : "需串接交通 API";
  document.querySelector("#route-title").textContent = `從${origin}出發`;
  const encodedName = encodeURIComponent(place.ko);
  document.querySelector("#naver-link").href = `https://map.naver.com/p/search/${encodedName}`;
  if (isSeoulStation) {
    renderRoute(place);
  } else {
    document.querySelector("#route-steps").innerHTML = '<div class="api-notice"><strong>起點已記錄</strong><p>目前的離線示範資料只涵蓋首爾站。接上正式交通 API 後，這裡會依你的出發站或目前位置產生真正路線，不會拿首爾站路線代替。</p></div>';
  }
  resultSection.hidden = false;
  window.setTimeout(() => resultSection.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!input.value.trim()) return input.focus();
  const match = findPlace(input.value);
  const origin = originInput.value.trim();
  if (!origin) {
    showToast("請輸入出發站，或按 ◎ 使用目前位置");
    return originInput.focus();
  }
  if (apiBase) {
    try {
      showToast("正在搜尋地點與交通路線…");
      await renderLiveJourney(origin, input.value.trim());
    } catch (error) {
      showToast(`即時查詢失敗：${error.message}`);
    }
    return;
  }
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

document.querySelector("#swap-route").addEventListener("click", () => {
  const oldOrigin = originInput.value;
  originInput.value = input.value;
  input.value = oldOrigin;
});

document.querySelector("#use-location").addEventListener("click", () => {
  if (!navigator.geolocation) return showToast("此瀏覽器不支援定位");
  showToast("正在取得目前位置…");
  navigator.geolocation.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords;
    originInput.value = `目前位置 ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    showToast("已取得目前位置");
  }, () => showToast("無法取得位置，請允許定位或輸入出發站"), { enableHighAccuracy: true, timeout: 8000 });
});

document.querySelector("#copy-address").addEventListener("click", async () => {
  const ko = selectedPlace.ko || selectedPlace.names?.ko || "";
  const address = selectedPlace.address || selectedPlace.addressKo || "";
  await navigator.clipboard.writeText(`${ko}\n${address}`);
  showToast("已複製韓文名稱與地址");
});

document.querySelector("#save-route").addEventListener("click", event => {
  const saved = event.currentTarget.textContent === "♥";
  event.currentTarget.textContent = saved ? "♡" : "♥";
  showToast(saved ? "已取消收藏" : "路線已收藏");
});
