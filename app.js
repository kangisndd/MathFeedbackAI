// 전역 변수: AI 모델
let model;

// 모델 로드 (모델 폴더 내 model.json 경로 사용)
async function loadModel() {
  try {
    model = await tf.loadLayersModel('./model/model.json');
    console.log("Model loaded successfully");
  } catch (error) {
    console.error("Error loading model", error);
  }
}
loadModel();

// HTML 요소 참조
const fileInput = document.getElementById('file-input');
const previewContainer = document.getElementById('preview-container');
const analyzeBtn = document.getElementById('analyze-btn');

// 파일 선택 시, 미리보기 카드 생성
fileInput.addEventListener('change', () => {
  console.log("파일 선택 이벤트 발생");
  previewContainer.innerHTML = ""; // 기존 미리보기 초기화
  const files = fileInput.files;
  if (files.length === 0) {
    console.log("선택된 파일 없음");
    return;
  }
  
  for (let i = 0; i < files.length; i++) {
    // 미리보기 카드 생성
    const cardDiv = document.createElement('div');
    cardDiv.className = "preview-card";
    
    // 이미지 요소 생성 및 파일 URL 설정
    const img = document.createElement("img");
    const fileURL = URL.createObjectURL(files[i]);
    img.src = fileURL;
    cardDiv.appendChild(img);
    
    // 예측 결과 표시 영역 추가
    const predictedText = document.createElement('div');
    predictedText.className = "predicted-type";
    predictedText.innerText = "예측 중...";
    cardDiv.appendChild(predictedText);
    
    // 이미지 로드 후, AI 모델을 이용한 문제 유형 예측 (224×224, 정규화)
    img.onload = async () => {
      try {
        let tensor = tf.browser.fromPixels(img)
                      .resizeNearestNeighbor([224, 224])
                      .toFloat();
        tensor = tensor.div(tf.scalar(255.0)).expandDims();
        const prediction = await model.predict(tensor).data();
        const maxIdx = prediction.indexOf(Math.max(...prediction));
        const labels = ["계산", "함수", "도형"]; // 학습 시 정의한 순서와 동일
        predictedText.innerText = "예측: " + labels[maxIdx];
      } catch (error) {
        console.error("Prediction error", error);
        predictedText.innerText = "예측 오류";
      }
    };

    // '정/오' 선택 라디오 버튼 추가
    const radioDiv = document.createElement('div');
    radioDiv.innerHTML = `
      <label><input type="radio" name="result_${i}" value="정"> 정</label>
      <label><input type="radio" name="result_${i}" value="오"> 오</label>
    `;
    cardDiv.appendChild(radioDiv);
    
    // 미리보기 카드 컨테이너에 추가
    previewContainer.appendChild(cardDiv);
  }
});

// "결과 보기" 버튼 클릭 시, 결과 집계 및 차트, 분석 문구 출력
analyzeBtn.addEventListener('click', () => {
  const cards = document.getElementsByClassName('preview-card');
  if (cards.length === 0) {
    alert("이미지를 업로드해 주세요.");
    return;
  }
  
  // 문제 유형별로 '정'과 '오' 집계 (예: { "계산": {정: x, 오: y}, "함수": {정: x, 오: y}, ... })
  const results = {};
  const possibleTypes = ["계산", "함수", "도형"];
  possibleTypes.forEach(type => { results[type] = {정: 0, 오: 0}; });
  
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const predictedTextEl = card.getElementsByClassName("predicted-type")[0];
    // 예측 텍스트 예시: "예측: 계산"
    const predictedType = predictedTextEl.innerText.split(":")[1]?.trim();
    if (!predictedType || !possibleTypes.includes(predictedType)) {
      alert(`이미지 ${i + 1}의 문제 유형 예측이 완료되지 않았습니다.`);
      return;
    }
    const selected = card.querySelector(`input[name="result_${i}"]:checked`);
    if (!selected) {
      alert(`이미지 ${i + 1}에 대해 정오 선택을 해주세요.`);
      return;
    }
    results[predictedType][selected.value]++;
  }
  
  // 차트 그리기
  renderChart(results);

  // 분석 결과 문구 생성
  let totalProblems = 0;
  let maxType = "";
  let maxRatio = 0;
  possibleTypes.forEach(type => {
    const count = results[type]["정"] + results[type]["오"];
    totalProblems += count;
    if (count > 0) {
      const ratio = (results[type]["오"] / count) * 100;
      if (ratio > maxRatio) {
        maxRatio = ratio;
        maxType = type;
      }
    }
  });
  
  const analysisText = `분석 결과: 총 ${totalProblems}개의 문제 중, ${maxType}에서 오답 비율이 ${maxRatio.toFixed(0)}%로 나타났습니다. 해당 유형에 대한 추가 학습이 필요해보입니다.`;
  document.getElementById("analysis-result").innerText = analysisText;
});

// Chart.js를 사용해 문제 유형별 총 문제 수와 오답 건수를 겹쳐서 표시하는 함수
function renderChart(data) {
  const ctx = document.getElementById('resultChart').getContext('2d');
  
  // 이전 차트 제거
  if (window.myChart) {
    window.myChart.destroy();
  }
  
  const labels = Object.keys(data); // 예: ["계산", "함수", "도형"]
  // 총 문제 수: 정답 + 오답
  const totalCounts = labels.map(label => data[label]["정"] + data[label]["오"]);
  // 오답 건수
  const wrongCounts = labels.map(label => data[label]["오"]);
  
  window.myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: '총 문제 수',
          data: totalCounts,
          backgroundColor: 'rgba(0, 123, 255, 0.5)',
          barThickness: 40
        },
        {
          label: '오답 건수',
          data: wrongCounts,
          backgroundColor: 'rgba(255, 99, 132, 0.9)',
          barThickness: 20
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: { mode: 'index', intersect: false },
        legend: { position: 'top' }
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      }
    }
  });
}
