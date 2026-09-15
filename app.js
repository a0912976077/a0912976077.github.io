const placeAliases = [
  ["景福宮","경복궁","Gyeongbokgung Palace"],["北村韓屋村","북촌한옥마을","Bukchon Hanok Village"],
  ["廣藏市場","광장시장","Gwangjang Market"],["明洞","명동","Myeong-dong"],["弘大","홍대입구","Hongdae"],
  ["弘大入口","홍대입구","Hongik Univ."],["聖水洞","성수동","Seongsu-dong"],["東大門","동대문","Dongdaemun"],
  ["東大門設計廣場","동대문디자인플라자","Dongdaemun Design Plaza"],["南山首爾塔","N서울타워","N Seoul Tower"],
  ["首爾塔","N서울타워","N Seoul Tower"],["樂天世界","롯데월드","Lotte World"],["樂天世界塔","롯데월드타워","Lotte World Tower"],
  ["首爾站","서울역","Seoul Station"],["江南站","강남역","Gangnam Station"],["新沙洞林蔭道","신사동 가로수길","Garosu-gil"],
  ["梨泰院","이태원","Itaewon"],["漢江公園","여의도한강공원","Yeouido Hangang Park"],["汝矣島","여의도","Yeouido"],
  ["盤浦漢江公園","반포한강공원","Banpo Hangang Park"],["COEX","코엑스","COEX"],["星空圖書館","별마당도서관","Starfield Library"],
  ["延南洞","연남동","Yeonnam-dong"],["望遠市場","망원시장","Mangwon Market"],["益善洞","익선동","Ikseon-dong"],
  ["清溪川","청계천","Cheonggyecheon"],["德壽宮","덕수궁","Deoksugung Palace"],["昌德宮","창덕궁","Changdeokgung Palace"],
  ["梨花女子大學","이화여자대학교","Ewha Womans University"],["建大入口","건대입구","Konkuk Univ."],
  ["高速巴士客運站","고속터미널역","Express Bus Terminal"],["金浦機場","김포국제공항","Gimpo Airport"],
  ["仁川機場第一航廈","인천공항1터미널","Incheon Airport Terminal 1"],["仁川機場第二航廈","인천공항2터미널","Incheon Airport Terminal 2"],
  ["釜山站","부산역","Busan Station"],["海雲台","해운대해수욕장","Haeundae Beach"],["甘川文化村","감천문화마을","Gamcheon Culture Village"],
  ["札嘎其市場","자갈치시장","Jagalchi Market"],["廣安里","광안리해수욕장","Gwangalli Beach"],["南浦洞","남포동","Nampo-dong"],
  ["濟州機場","제주국제공항","Jeju International Airport"],["城山日出峰","성산일출봉","Seongsan Ilchulbong"],
  ["牛島","우도","Udo Island"],["涯月","애월","Aewol"],["東門市場","동문재래시장","Dongmun Market"]
].map(([zh,ko,en]) => ({zh,ko,en}));

const form = document.querySelector("#search-form");
const originInput = document.querySelector("#origin-input");
const destinationInput = document.querySelector("#search-input");
const resultSection = document.querySelector("#result-section");
const toast = document.querySelector("#toast");
const kakaoKey = window.KAKAO_REST_KEY || "";
let selected = null;

function lookup(text) {
  const value = text.trim().toLowerCase();
  return placeAliases.find(p => [p.zh,p.ko,p.en].some(name => name.toLowerCase() === value));
}

function showToast(message) {
  toast.textContent = message; toast.classList.add("show");
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

async function kakaoGet(path, params) {
  const url = new URL(`https://dapi.kakao.com${path}`);
  Object.entries(params).forEach(([key,value]) => url.searchParams.set(key,value));
  const response = await fetch(url, { headers: { Authorization: `KakaoAK ${kakaoKey}` } });
  const data = await response.json();
  if (!response.ok || data.status === "ERROR") throw new Error(data.message || "Kakao 查詢失敗");
  return data;
}

async function findKakaoPlace(raw) {
  if (/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(raw)) {
    const [y,x] = raw.split(",").map(Number); return { place_name:"目前位置", x, y, address_name:"GPS 座標" };
  }
  const alias = lookup(raw);
  const query = alias ? `${alias.ko} ${alias.en}` : raw;
  const data = await kakaoGet("/v2/local/search/keyword.json", { query, size:"15" });
  if (!data.documents?.length) throw new Error(`找不到「${raw}」，請加入分店名或輸入韓文／英文`);
  return data.documents[0];
}

function naverRouteUrl(origin, destination) {
  const params = new URLSearchParams({
    slat:origin.y, slng:origin.x, sname:origin.place_name,
    dlat:destination.y, dlng:destination.x, dname:destination.place_name,
    appname:"seoul.easy.family"
  });
  return `nmap://route/public?${params}`;
}

function minutes(seconds) { return `${Math.max(1,Math.round(seconds/60))} 分`; }

function renderKakaoRoute(routeData, origin, destination) {
  const routes = routeData.routes || [];
  const route = routes.find(r => r.properties.type === "SUBWAY") || routes[0];
  if (!route) throw new Error("目前沒有可用的大眾運輸路線");
  const props = route.properties;
  document.querySelector("#route-duration").textContent = minutes(props.totalTime);
  document.querySelector("#route-transfer").textContent = `轉乘 ${props.transfers || 0} 次 · ₩${props.fare?.value || props.fare?.min || "--"}`;
  document.querySelector("#route-steps").innerHTML = route.steps.map(step => {
    const p = step.properties || {};
    const stops = p.stops || [];
    const first = stops[0]?.name || origin.place_name;
    const last = stops[stops.length-1]?.name || destination.place_name;
    const vehicle = p.vehicles?.[0]?.name || (p.type === "WALKING" ? "步行" : p.type);
    const color = p.type === "SUBWAY" ? "#00a84d" : p.type === "BUS" ? "#315bb5" : "#87948d";
    return `<div class="route-step" style="--step-color:${color}">
      <div class="track"><span class="station-dot">${p.type === "SUBWAY" ? "M" : p.type === "BUS" ? "B" : "走"}</span></div>
      <div class="station-name"><strong>${first} → ${last}</strong><span>${p.guidance || "移動"}</span><small>${vehicle}</small><b class="line-pill">${vehicle}</b></div>
      <div class="ride-info">${minutes(p.time || 0)}${stops.length ? `<br>${stops.length-1} 站` : ""}</div>
    </div>`;
  }).join("");
  document.querySelector("#kakao-link").href = routeData.properties.landingURL;
  document.querySelector("#naver-link").href = naverRouteUrl(origin,destination);
  const fare = props.fare?.value || props.fare?.min;
  if (fare) document.querySelector(".fare-title strong").textContent = `此路線預估 ₩${fare}`;
}

function renderResult(originRaw, destinationRaw, destination) {
  selected = destination;
  const alias = lookup(destinationRaw);
  document.querySelector("#place-name").textContent = alias?.zh || destination.place_name;
  document.querySelector("#place-ko").textContent = destination.place_name;
  document.querySelector("#place-en").textContent = alias?.en || destination.category_name || "Kakao Map 地點";
  document.querySelector("#place-address").textContent = destination.road_address_name || destination.address_name || "";
  document.querySelector("#route-title").textContent = `從${originRaw}出發`;
  resultSection.hidden = false;
  resultSection.scrollIntoView({behavior:"smooth",block:"start"});
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const originRaw = originInput.value.trim(), destinationRaw = destinationInput.value.trim();
  if (!originRaw) return originInput.focus();
  if (!destinationRaw) return destinationInput.focus();
  try {
    showToast("正在搜尋韓國地點與真實路線…");
    const [origin,destination] = await Promise.all([findKakaoPlace(originRaw),findKakaoPlace(destinationRaw)]);
    renderResult(originRaw,destinationRaw,destination);
    const route = await kakaoGet("/v2/routing/publictraffic", {
      start_x:origin.x,start_y:origin.y,end_x:destination.x,end_y:destination.y,
      s_name:origin.place_name,e_name:destination.place_name
    });
    renderKakaoRoute(route,origin,destination);
    showToast("真實路線已載入");
  } catch (error) { showToast(error.message); }
});

document.querySelector("#clear-search").onclick = () => { destinationInput.value=""; destinationInput.focus(); };
document.querySelector("#swap-route").onclick = () => { [originInput.value,destinationInput.value]=[destinationInput.value,originInput.value]; };
document.querySelector("#use-location").onclick = () => {
  if (!navigator.geolocation) return showToast("瀏覽器不支援定位");
  showToast("正在取得目前位置…");
  navigator.geolocation.getCurrentPosition(({coords}) => {
    originInput.value = `${coords.latitude},${coords.longitude}`; showToast("已取得目前位置");
  }, () => showToast("請允許定位或手動輸入出發地"), {enableHighAccuracy:true,timeout:8000});
};
document.querySelector("#copy-address").onclick = async () => {
  if (!selected) return;
  await navigator.clipboard.writeText(`${selected.place_name}\n${selected.road_address_name || selected.address_name || ""}`); showToast("已複製韓文名稱與地址");
};
document.querySelector("#save-route").onclick = e => { e.currentTarget.textContent=e.currentTarget.textContent==="♥"?"♡":"♥"; };

document.querySelectorAll("[data-query]").forEach(button => button.onclick = () => { destinationInput.value=button.dataset.query; destinationInput.focus(); });
