// [파일 이름: script.js]

// --- [ 0. 전역 변수 및 라이브러리 접근 ] ---
const imageCompression = window.imageCompression; 
const JSZip = window.JSZip; // ✅ [추가] JSZip 라이브러리

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

let originalFiles = null; // ✅ [수정] 단일 파일이 아닌 FileList를 저장

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
        fileInput.files = files; // ✅ [수정] 드롭된 파일 목록 전체를 할당
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
document.querySelector('input[name="quality"]:checked').parentElement.classList.add('checked');


// 압축 버튼 클릭 이벤트
compressButton.addEventListener('click', handleCompression);

// --- [ 2. 함수 정의 ] ---

// (1) 파일 선택 시 (멀티 파일 지원으로 수정)
function handleFileSelect() {
    originalFiles = fileInput.files; // ✅ [수정] FileList 전체를 저장
    
    if (originalFiles && originalFiles.length > 0) {
        if (originalFiles.length === 1) {
            // 단일 파일
            fileNameDisplay.textContent = originalFiles[0].name;
        } else {
            // ✅ [추가] 멀티 파일
            fileNameDisplay.textContent = `${originalFiles.length}개의 파일이 선택되었습니다.`;
        }
        
        fileNameDisplay.style.color = '#333';
        compressButton.disabled = false;
        resultArea.classList.add('hidden');
        progressBarContainer.classList.add('hidden');
    } else {
        fileNameDisplay.textContent = '여기를 클릭하거나 파일을 드래그하세요';
        fileNameDisplay.style.color = '#666';
        compressButton.disabled = true;
    }
}

// (2) 압축 실행 시 (멀티 파일 분기 처리)
async function handleCompression() {
    if (!originalFiles || originalFiles.length === 0) {
        alert('파일을 먼저 선택해주세요!');
        return;
    }

    // 로딩 UI 활성화
    compressButton.disabled = true;
    compressButton.textContent = '압축 준비 중...';
    resultArea.classList.add('hidden');
    progressBarContainer.classList.remove('hidden');
    progressBar.style.width = '0%';
    progressText.textContent = '압축 진행 중: 0%';

    // 1. 선택된 압축 옵션(품질) 가져오기
    const selectedQuality = parseFloat(document.querySelector('input[name="quality"]:checked').value);

    // 2. 라이브러리 옵션 설정
    const options = {
        initialQuality: selectedQuality,
        useWebWorker: true,
        // ✅ [수정] onProgress는 개별 파일 압축 시 사용
    };

    try {
        if (originalFiles.length === 1) {
            // --- 단일 파일 처리 ---
            options.onProgress = (p) => updateProgressBar(p); // 프로그레스 바 연결
            
            const originalFile = originalFiles[0];
            console.log(`단일 파일 압축 시작: ${originalFile.name} (품질: ${selectedQuality})`);
            
            const compressedFile = await imageCompression(originalFile, options);
            
            console.log(`압축 완료: (압축 크기: ${compressedFile.size / 1024 / 1024} MB)`);
            displayResults(originalFile, compressedFile); // 단일 파일 결과 표시

        } else {
            // --- ✅ [추가] 멀티 파일 처리 (ZIP) ---
            const zip = new JSZip();
            const totalFiles = originalFiles.length;
            let compressedFilesCount = 0;

            // 프로그레스 바 초기화
            updateProgressBar(0, `0 / ${totalFiles} 파일 압축 중...`);
            
            // 모든 파일을 병렬로 압축
            const compressionPromises = Array.from(originalFiles).map(async (file) => {
                try {
                    const compressedFile = await imageCompression(file, options);
                    
                    // 압축 완료 시 카운트 증가 및 UI 업데이트
                    compressedFilesCount++;
                    const progress = (compressedFilesCount / totalFiles) * 100;
                    updateProgressBar(progress, `${compressedFilesCount} / ${totalFiles} 파일 압축 완료...`);
                    
                    return { file: compressedFile, originalName: file.name };
                } catch (err) {
                    console.error(`${file.name} 압축 실패:`, err);
                    return null; // 실패한 파일은 null 반환
                }
            });

            const results = await Promise.all(compressionPromises);

            // ZIP 파일 생성
            updateProgressBar(100, 'ZIP 파일 생성 중...');
            results.forEach(result => {
                if (result) {
                    // 새 파일 이름 생성 (예: image.jpg -> image_compressed.jpg)
                    const newName = getCompressedFileName(result.originalName, result.file.name);
                    zip.file(newName, result.file); // ZIP에 추가
                }
            });

            const zipBlob = await zip.generateAsync({ 
                type: "blob",
                compression: "DEFLATE",
                compressionOptions: {
                    level: 9
                }
            });
            
            console.log('멀티 파일 ZIP 압축 완료');
            displayResults(originalFiles, zipBlob); // ZIP 파일 결과 표시
        }

    } catch (error) {
        console.error('압축 실패:', error);
        alert(`이미지 압축에 실패했습니다. 오류: ${error.message}`);
    } finally {
        compressButton.disabled = false;
        compressButton.textContent = '압축 시작하기';
        // 프로그레스 바는 displayResults에서 숨김 처리
    }
}

// (3) 결과 표시 및 다운로드 링크 생성 (멀티 파일 지원)
function displayResults(originals, compressedResult) {
    let originalKB, compressedKB, saveRate;

    if (compressedResult.type === 'application/zip') {
        // --- ZIP 결과 표시 ---
        const originalTotalSize = Array.from(originals).reduce((sum, file) => sum + file.size, 0);
        originalKB = (originalTotalSize / 1024).toFixed(1);
        compressedKB = (compressedResult.size / 1024).toFixed(1);
        saveRate = 100 - (compressedResult.size / originalTotalSize) * 100;

        downloadLink.href = URL.createObjectURL(compressedResult);
        downloadLink.download = 'compressed_images.zip'; // ZIP 파일 이름
        downloadLink.textContent = `압축 ZIP 파일 다운로드 (${originals.length}개)`;

    } else {
        // --- 단일 파일 결과 표시 ---
        originalKB = (originals.size / 1024).toFixed(1);
        compressedKB = (compressedResult.size / 1024).toFixed(1);
        saveRate = 100 - (compressedResult.size / originals.size) * 100;
        
        const newName = getCompressedFileName(originals.name, compressedResult.name);
        downloadLink.href = URL.createObjectURL(compressedResult);
        downloadLink.download = newName;
        downloadLink.textContent = '압축 이미지 다운로드';
    }

    originalSizeDisplay.textContent = `${originalKB} KB`;
    compressedSizeDisplay.textContent = `${compressedKB} KB`;
    saveRateDisplay.textContent = `${saveRate.toFixed(1) < 0 ? 0 : saveRate.toFixed(1)}`; // 압축 후 커지는 경우 0%로 표시

    resultArea.classList.remove('hidden'); // 결과 영역 보이기
    progressBarContainer.classList.add('hidden'); // 로딩바 숨기기
}

// --- [ 3. 헬퍼 함수 ] ---

// ✅ [추가] 프로그레스 바 UI 업데이트 함수
function updateProgressBar(percentage, text) {
    progressBar.style.width = `${percentage}%`;
    if (text) {
        progressText.textContent = text;
    } else {
        progressText.textContent = `압축 진행 중: ${percentage.toFixed(0)}%`;
    }
}

// ✅ [추가] 압축 파일 이름 생성 함수 (예: 'image.jpg' -> 'image_compressed.jpg')
function getCompressedFileName(originalName, compressedMimeName) {
    const nameWithoutExtension = originalName.split('.').slice(0, -1).join('.');
    const extension = compressedMimeName.split('.').pop() || 'jpg'; // 라이브러리가 확장자를 주지 않을 경우 대비
    return `${nameWithoutExtension}_compressed.${extension}`;
}
