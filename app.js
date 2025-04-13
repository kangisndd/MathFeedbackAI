// 파일 입력 요소와 미리보기 컨테이너, 분석 버튼을 가져옴
const fileInput = document.getElementById('file-input');
const previewContainer = document.getElementById('preview-container');
const analyzeBtn = document.getElementById('analyze-btn');

// 파일이 선택될 때마다 미리보기 카드 생성 (각 카드에는 이미지와 '정' 또는 '오' 선택 라디오 버튼 포함)
fileInput.addEventListener('change', () => {
  previewContainer.innerHTML = ""; // 기존 미리보기 초기화
  const files = fileInput.files;
  for (let i = 0; i < files.length; i++) {
    // 카드 요소 생성
    const cardDiv = document.createElement('div');
    cardDiv.className = "preview-card";
    
    // 이미지 요소 생성
    const img = document.createElement("img");
    img.src = URL.createObjectURL(files[i]);
    cardDiv.appendChild(img);
    
    // 라디오 버튼 요소 생성 (정/오 선택)
    const radioDiv = document.createElement('div');
    radioDiv.innerHTML = `
      <label><input type="radio" name="result_${i}" value="정"> 정</label>
      <label><input type="radio" name="result_${i}" value="오"> 오</label>
    `;
    cardDiv.appendChild(radioDiv);
    previewContainer.appendChild(cardDiv);
  }
});

// 결과 보기 버튼 클릭 시, 각 이미지별 정오 선택 결과를 집계하여 차트로 표시
analyzeBtn.addEventListener('click', () => {
  const files = fileInput.files;
  if (files.length === 0) {
    alert("이미지를 업로드 해주세요, 주인님.");
    return;
  }
  
  let correctCount = 0;
  let wrongCount = 0;
  
  for (let i = 0; i < files.length; i++) {
    const selected = document.querySelector(`input[name="result_${i}"]:checked`);
    if (!selected) {
      alert(`이미지 ${i + 1}에 대해 정오 선택을 해주세요, 주인님.`);
      return;
    }
    if (selected.value === "정") correctCount++;
    else if (selected.value === "오") wrongCount++;
  }
  
  // 결과 데이터를 객체 형태로 전달하고 차트를 렌더링
  renderChart({정: correctCount, 오: wrongCount});
});

// Chart.js를 이용해 결과 차트를 생성하는 함수
function renderChart(data) {
  const ctx = document.getElementById('resultChart').getContext('2d');
  
  // 이전 차트가 존재하면 파괴
  if (window.myChart) {
    window.myChart.destroy();
  }
  
  window.myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(data),
      datasets: [{
        label: '문제 결과',
        data: Object.values(data),
        backgroundColor: [
          'rgba(0, 123, 255, 0.5)',  // 정
          'rgba(255, 99, 132, 0.5)'   // 오
        ]
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
