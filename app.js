let model;
const modelURL = './model/model.json';

// 모델 로드
async function loadModel() {
  model = await tf.loadLayersModel(modelURL);
  console.log("모델 로드 완료");
}

loadModel();

// 파일 읽기 및 이미지 예측
document.getElementById('analyze-btn').addEventListener('click', async () => {
  const inputFiles = document.getElementById('file-input').files;
  if (!model || inputFiles.length === 0) {
    alert("모델이 로드되지 않았거나 이미지를 선택하지 않았습니다.");
    return;
  }

  // 각 문제 이미지에 대해 예측 수행 (예: 각 이미지가 '계산', '함수', '도형' 중 어느 것인지)
  let predictionCounts = {
    계산: 0,
    함수: 0,
    도형: 0
  };

  for (let file of inputFiles) {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise((resolve) => {
      img.onload = () => {
        // 이미지 전처리 (예: 모델이 요구하는 크기로 조정)
        const tensor = tf.browser.fromPixels(img).resizeNearestNeighbor([224, 224]).toFloat();
        const normalized = tensor.div(255.0).expandDims();
        // 예측 수행
        model.predict(normalized).data().then(prediction => {
          // 예시: 예측 결과 배열의 인덱스별로 각 유형에 해당한다고 가정
          const maxIndex = prediction.indexOf(Math.max(...prediction));
          if (maxIndex === 0) predictionCounts.계산++;
          else if (maxIndex === 1) predictionCounts.함수++;
          else if (maxIndex === 2) predictionCounts.도형++;
          resolve();
        });
      }
    });
  }

  // 예측 결과 차트로 시각화
  renderChart(predictionCounts);
});

// 차트 생성 함수 (Chart.js 이용)
function renderChart(data) {
  const ctx = document.getElementById('resultChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(data),
      datasets: [{
        label: '오답 발생 건수',
        data: Object.values(data),
        backgroundColor: ['rgba(255, 99, 132, 0.5)', 'rgba(54, 162, 235, 0.5)', 'rgba(255, 206, 86, 0.5)']
      }]
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
