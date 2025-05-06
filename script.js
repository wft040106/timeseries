const map = new ol.Map({
  target: "map",
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM(),
    }),
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat([100.2, 36.9]),
    zoom: 10,
  }),
});

let featuresByTime = {};
let times = [];
let playing = true; // 自动播放默认开启
let currentIndex = 0; // 初始化当前索引
let intervalId = null; // 存储定时器的ID

fetch("timeseries.geojson")
  .then((res) => res.json())
  .then((data) => {
    const format = new ol.format.GeoJSON();
    const allFeatures = format.readFeatures(data, {
      featureProjection: "EPSG:3857",
    });

    // 假设每个要素有 time 属性
    allFeatures.forEach((f) => {
      const time = f.get("time");
      if (!featuresByTime[time]) {
        featuresByTime[time] = [];
        times.push(time);
      }
      featuresByTime[time].push(f);
    });

    times.sort(); // 按时间排序

    const vectorSource = new ol.source.Vector();
    const vectorLayer = new ol.layer.Vector({
      source: vectorSource,
      style: new ol.style.Style({
        fill: new ol.style.Fill({ color: "rgba(0, 102, 255, 0.4)" }),
        stroke: new ol.style.Stroke({ color: "#0066ff", width: 1 }),
      }),
    });
    map.addLayer(vectorLayer);

    const slider = document.getElementById("timeSlider");
    const label = document.getElementById("timeLabel");
    slider.max = times.length - 1;

    slider.oninput = () => {
      const t = times[slider.value];
      label.textContent = t;
      vectorSource.clear();
      vectorSource.addFeatures(featuresByTime[t]);
    };

    const playPauseBtn = document.getElementById("playPauseBtn");

    // 自动播放函数
    function startPlayback() {
      intervalId = setInterval(() => {
        if (!playing) return;
        currentIndex = (currentIndex + 1) % times.length;
        slider.value = currentIndex;
        slider.oninput();
      }, 250);
    }

    // 控制播放/暂停按钮点击
    playPauseBtn.onclick = () => {
      playing = !playing;
      playPauseBtn.textContent = playing ? "⏸" : "▶";

      if (playing) {
        startPlayback();
      } else {
        clearInterval(intervalId); // 暂停时清除定时器
      }
    };

    // 用户拖动时暂停播放
    slider.addEventListener("mousedown", () => {
      playing = false;
      playPauseBtn.textContent = "▶";
      clearInterval(intervalId); // 清除定时器，停止自动播放
    });

    // 页面加载时直接开始自动播放
    startPlayback();
  });
