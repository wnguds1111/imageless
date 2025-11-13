// [파일 이름: script.js]

// --- [ 0. 전역 변수 및 라이브러리 접근 ] ---
const imageCompression = window.imageCompression; 

// DOM 요소 캐싱
const fileInput = document.getElementById('image-file');
const uploadLabel = document.querySelector('.upload-label');
const fileNameDisplay = document.getElementById('file-name');
const compressButton = document.getElementById('compress-button');
const resultArea = document.getElementById('result-area');
const downloadLink = document.getElementById('download-link');
const originalSizeDisplay = document.getElementById('original-size');
const compressedSizeDisplay = document.getElementById('compressed-size');
const saveRateDisplay = document.getElementById('save-rate');
const qualityRadios = document.querySelectorAll('input[name="quality"]');

// 로딩바 관련 요소 추가
const progressBarContainer = document.getElementById('progress-bar-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

let originalFile = null;

// --- [ 1. 이벤트 리스너 설정 ] ---

// 파일 선택 이벤트
fileInput.addEventListener('change', handleFileSelect);

// 드래그 앤 드롭 이벤트
uploadLabel.addEventListener('dragover', (e) => {
    e.preventDefault(); 
    uploadLabel.classList.add('dragover');
});
uploadLabel.addEventListener('dragleave', () => {
    uploadLabel.classList.remove('dragover');
});
uploadLabel.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadLabel.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        // 드롭된 파일이 여러 개일 경우 첫 번째 파일만 사용
        fileInput.files = createFileList(files[0]); 
        handleFileSelect();
    }
});

// 압축 옵션 라벨 스타일링
qualityRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        qualityRadios.forEach(r => {
            r.parentElement.classList.remove('checked');
        });
        if (radio.checked) {
            radio.parentElement.classList.add('checked');
        }
    });
});
// 페이지 로드 시 기본값 체크 (90% 품질)
document.querySelector('input[name="quality"]:checked').parentElement.classList.add('checked');


// 압축 버튼 클릭 이벤트
compressButton.addEventListener('click', handleCompression);

// --- [ 2. 함수 정의 ] ---

// FileList를 생성하는 헬퍼 함수 (드래그 앤 드롭 시 input.files에 할당하기 위함)
function createFileList(file) {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    return dataTransfer.files;
}


// (1) 파일 선택 시
function handleFileSelect() {
    originalFile = fileInput.files[0];
    if (originalFile) {
        fileNameDisplay.textContent = originalFile.name; // 파일 이름 표시
        fileNameDisplay.style.color = '#333';
        compressButton.disabled = false; // 압축 버튼 활성화
        resultArea.classList.add('hidden'); // 이전 결과 숨기기
        progressBarContainer.classList.add('hidden'); // 로딩바 숨기기
    } else {
        fileNameDisplay.textContent = '여기를 클릭하거나 파일을 드래그하세요';
        fileNameDisplay.style.color = '#666';
        compressButton.disabled = true;
    }
}

// (2) 압축 실행 시 (핵심 로직)
async function handleCompression() {
    if (!originalFile) {
        alert('파일을 먼저 선택해주세요!');
        return;
    }

    // 로딩 UI 활성화
    compressButton.disabled = true;
    compressButton.textContent = '압축 준비 중...';
    resultArea.classList.add('hidden');
    progressBarContainer.classList.remove('hidden'); // 로딩바 보이기
    progressBar.style.width = '0%';
    progressText.textContent = '압축 진행 중: 0%';


    // 1. 선택된 압축 옵션(품질) 가져오기 (float 형태로 파싱)
    const selectedQuality = parseFloat(document.querySelector('input[name="quality"]:checked').value);

    // 2. 라이브러리 옵션 설정
    const options = {
        initialQuality: selectedQuality, // 선택된 품질 (0.9, 0.7, 0.5, 0.3)
        // maxWidthOrHeight: 1920,        // 최대 해상도 (필요시 주석 해제)
        useWebWorker: true,            // 웹 워커 사용 (UI 멈춤 방지)
        onProgress: (p) => {
            // 압축 진행률 업데이트 (로딩바)
            progressBar.style.width = `${p}%`;
            progressText.textContent = `압축 진행 중: ${p.toFixed(0)}%`;
            compressButton.textContent = `압축 중... ${p.toFixed(0)}%`;
        }
    }

    try {
        // 3. 압축 실행
        console.log(`압축 시작: ${originalFile.name} (품질: ${selectedQuality})`);
        
        // [핵심] browser-image-compression 라이브러리 함수 호출
        const compressedFile = await imageCompression(originalFile, options);
        
        console.log(`압축 완료: (압축 크기: ${compressedFile.size / 1024 / 1024} MB)`);

        // 4. 결과 표시
        displayResults(originalFile, compressedFile);

    } catch (error) {
        console.error('압축 실패:', error);
        alert(`이미지 압축에 실패했습니다. 다음을 확인해주세요:
        - 파일 형식이 지원되는지 (JPG, PNG, WebP, BMP)
        - 파일이 손상되지 않았는지
        - 이미지 해상도가 너무 높지 않은지 (매우 큰 이미지는 브라우저에서 처리하기 어렵습니다)
        오류: ${error.message}`);
    } finally {
        // 로딩 UI 비활성화 및 초기화
        compressButton.disabled = false;
        compressButton.textContent = '압축 시작하기';
        progressBarContainer.classList.add('hidden'); // 로딩바 숨기기
    }
}

// (3) 결과 표시 및 다운로드 링크 생성
function displayResults(original, compressed) {
    const originalKB = (original.size / 1024).toFixed(1);
    const compressedKB = (compressed.size / 1024).toFixed(1);
    const saveRate = 100 - (compressed.size / original.size) * 100;

    originalSizeDisplay.textContent = `${originalKB} KB`;
    compressedSizeDisplay.textContent = `${compressedKB} KB`;
    saveRateDisplay.textContent = `${saveRate.toFixed(1)}`; // 소수점 한 자리까지 표시

    // 다운로드 링크 생성
    const downloadFileName = original.name.split('.').slice(0, -1).join('.') + '_compressed.' + compressed.name.split('.').pop();
    downloadLink.href = URL.createObjectURL(compressed);
    downloadLink.download = downloadFileName;

    resultArea.classList.remove('hidden'); // 결과 영역 보이기
}
