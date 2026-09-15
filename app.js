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
let selected = null;

function lookup(text) {
  const value = text.trim().toLowerCase();
  return placeAliases.find(p => [p.zh,p.ko,p.en].some(name => name.toLowerCase() === value));
}

function showToast(message) {
  toast.textContent = message; toast.classList.add("show");
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function naverSearchUrl(destination) {
  return `https://map.naver.com/p/search/${encodeURIComponent(destination)}`;
}

function renderResult(originRaw, destinationRaw, destination) {
  selected = destination || { zh: destinationRaw, ko: destinationRaw, en: "Google Maps 即時搜尋" };
  document.querySelector("#place-name").textContent = selected.zh;
  document.querySelector("#place-ko").textContent = selected.ko;
  document.querySelector("#place-en").textContent = selected.en;
  document.querySelector("#place-address").textContent = "由 Google Maps／Naver Map 即時確認地址與營業狀態";
  document.querySelector("#route-title").textContent = `從${originRaw}出發`;
  document.querySelector("#route-duration").textContent = "即時查詢";
  document.querySelector("#route-transfer").textContent = "NAVER 現場導航";
  document.querySelector("#route-steps").innerHTML = '<div class="api-notice"><strong>已轉換為韓國地點名稱</strong><p>按下方按鈕在 NAVER Map 核對目的地，接著點「路線」並選擇大眾運輸。尚未取得 Kakao Key 前，不會假裝已算出路線。</p></div>';
  document.querySelector("#naver-link").href = `https://map.naver.com/p/search/${encodeURIComponent(selected.ko)}`;
  document.querySelector("#naver-link").textContent = "在 NAVER 地圖核對地點 ↗";
  resultSection.hidden = false;
  resultSection.scrollIntoView({behavior:"smooth",block:"start"});
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const originRaw = originInput.value.trim(), destinationRaw = destinationInput.value.trim();
  if (!originRaw) return originInput.focus();
  if (!destinationRaw) return destinationInput.focus();
  const destination = lookup(destinationRaw);
  const destinationQuery = destination ? `${destination.ko} ${destination.en}` : destinationRaw;
  renderResult(originRaw, destinationRaw, destination);
  window.open(naverSearchUrl(destinationQuery), "_blank", "noopener,noreferrer");
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
  await navigator.clipboard.writeText(selected.ko); showToast("已複製韓文地點名稱");
};
document.querySelector("#save-route").onclick = e => { e.currentTarget.textContent=e.currentTarget.textContent==="♥"?"♡":"♥"; };

document.querySelectorAll("[data-query]").forEach(button => button.onclick = () => { destinationInput.value=button.dataset.query; destinationInput.focus(); });
