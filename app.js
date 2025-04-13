// 전역 변수: 모델
let model;

// 모델 로드 (모델 폴더 내 model.json 경로를 사용)
async function loadModel() {
  model = await tf.loadLayersModel('./model/model.json');
  console.log("모델 로드 완료");
}
loadModel();

// 파일 입력 요소와 미리보기 컨테이너, 분석 버튼 참조
const fileInput = document.getElementById('file-input');
const previewContainer = document.getElementById('preview-container');
const analyzeBtn = document.getElementById('analyze-btn');

// 이미지 업로드 시, 각 파일마다 미리보기 카드 생성
fileInput.addEventListener('change', () => {
  previewContainer.innerHTML = ""; // 기존 미리보기 초기화
  const files = fileInput.files;
  for (let i = 0; i < files.length; i++) {
    const cardDiv = document.createElement('div');
    cardDiv.className = "preview-card";
    
    // 이미지 요소 생성 및 추가
    const img = document.createElement("img");
    const fileURL = URL.createObjectURL(files[i]);
    img.src = fileURL;
    cardDiv.appendChild(img);
    
    // 예측 결과 표시 영역 추가
    const predictedText = document.createElement('div');
    predictedText.className = "predicted-type";
    predictedText.innerText = "예측 중...";
    cardDiv.appendChild(predictedText);
    
    // 이미지 로드 후 AI 모델로 문제 유형 예측
    img.onload = async () => {
      // 모델 입력 사이즈(예: 224x224)로 리사이즈 후 전처리
      let tensor = tf.browser.fromPixels(img).resizeNearestNeighbor([224, 224]).toFloat();
      tensor = tensor.div(tf.scalar(255.0)).expandDims();
      
      // 예측 수행
      const prediction = await model.predict(tensor).data();
      const maxIdx = prediction.indexOf(Math.max(...prediction));
      const labels = ["계산", "함수", "도형"];  // 학습 시 설정한 순서와 동일해야 함
      predictedText.innerText = "예측된 문제 유형: " + labels[maxIdx];
    };
    
    // '정/오' 라디오 버튼 추가
    const radioDiv = document.createElement('div');
    radioDiv.innerHTML = `
      <label><input type="radio" name="result_${i}" value="정"> 정</label>
      <label><input type="radio" name="result_${i}" value="오"> 오</label>
    `;
    cardDiv.appendChild(radioDiv);
    
    previewContainer.appendChild(cardDiv);
  }
});

// "결과 보기" 버튼 클릭 시, 각 카드의 예측 결과와 정/오 선택 값을 집계하여 차트로 표시
analyzeBtn.addEventListener('click', () => {
  const cards = document.getElementsByClassName('preview-card');
  if (cards.length === 0) {
    alert("이미지를 업로드 해주세요, 주인님.");
    return;
  }
  
  // 문제 유형별로 '정'과 '오'를 집계 (예시: { "계산": {정: 0, 오: 0}, ... })
  const results = {};
  const possibleTypes = ["계산", "함수", "도형"];
  possibleTypes.forEach(type => { results[type] = {정: 0, 오: 0}; });
  
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const predictedTextEl = card.getElementsByClassName("predicted-type")[0];
    // 예측된 텍스트 형식: "예측된 문제 유형: 계산" (콜론을 기준으로 분리)
    const predictedType = predictedTextEl.innerText.split(":")[1]?.trim();
    if (!predictedType || !possibleTypes.includes(predictedType)) {
      alert(`이미지 ${i+1}의 문제 유형 예측이 완료되지 않았습니다, 주인님.`);
      return;
    }
    // 각 카드에서 '정/오' 선택된 값 가져오기
    const selected = card.querySelector(`input[name="result_${i}"]:checked`);
    if (!selected) {
      alert(`이미지 ${i+1}에 대해 정오 선택을 해주세요, 주인님.`);
      return;
    }
    const correctness = selected.value;
    results[predictedType][correctness]++;
  }
  
  // 집계된 결과를 가지고 차트를 렌더링
  renderChart(results);
});

// Chart.js를 사용해 그룹형 막대 차트 생성 (문제 유형별 정답/오답 개수)
function renderChart(data) {
  const ctx = document.getElementById('resultChart').getContext('2d');
  
  if (window.myChart) {
    window.myChart.destroy();
  }
  
  const labels = Object.keys(data);
  const correctData = labels.map(label => data[label]["정"]);
  const wrongData = labels.map(label => data[label]["오"]);
  
  window.myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: '정답',
          data: correctData,
          backgroundColor: 'rgba(0, 123, 255, 0.5)'
        },
        {
          label: '오답',
          data: wrongData,
          backgroundColor: 'rgba(255, 99, 132, 0.5)'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          stepSize: 1
        }
      }
    }
  });
}
