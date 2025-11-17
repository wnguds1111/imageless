// [파일 이름: en/script.js]
// 모든 알림창과 UI 텍스트를 영어로 수정했습니다.

// --- [ 0. 전역 변수 및 라이브러리 접근 ] ---
const imageCompression = window.imageCompression; 
const JSZip = window.JSZip; 

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

let originalFiles = null; 

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
        fileInput.files = files; 
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
    originalFiles = fileInput.files; 
    
    if (originalFiles && originalFiles.length > 0) {
        if (originalFiles.length === 1) {
            // 단일 파일
            fileNameDisplay.textContent = originalFiles[0].name;
        } else {
            // ✅ [수정] 멀티 파일 (영어)
            fileNameDisplay.textContent = `${originalFiles.length} files selected.`;
        }
        
        fileNameDisplay.style.color = '#333';
        compressButton.disabled = false;
        resultArea.classList.add('hidden');
        progressBarContainer.classList.add('hidden');
    } else {
        // ✅ [수정] (영어)
        fileNameDisplay.textContent = 'Click here or drag files to upload';
        fileNameDisplay.style.color = '#666';
        compressButton.disabled = true;
    }
}

// (2) 압축 실행 시 (멀티 파일 분기 처리)
async function handleCompression() {
    if (!originalFiles || originalFiles.length === 0) {
        // ✅ [수정] (영어)
        alert('Please select files first!');
        return;
    }

    // 로딩 UI 활성화
    compressButton.disabled = true;
    compressButton.textContent = 'Preparing...'; // ✅ [수정]
    resultArea.classList.add('hidden');
    progressBarContainer.classList.remove('hidden');
    progressBar.style.width = '0%';
    progressText.textContent = 'Compressing: 0%'; // ✅ [수정]

    // 1. 선택된 압축 옵션(품질) 가져오기
    const selectedQuality = parseFloat(document.querySelector('input[name="quality"]:checked').value);

    // 2. 라이브러리 옵션 설정
    const options = {
        initialQuality: selectedQuality,
        useWebWorker: true,
    };

    try {
        if (originalFiles.length === 1) {
            // --- 단일 파일 처리 ---
            options.onProgress = (p) => updateProgressBar(p); 
            
            const originalFile = originalFiles[0];
            console.log(`Compressing single file: ${originalFile.name} (Quality: ${selectedQuality})`);
            
            const compressedFile = await imageCompression(originalFile, options);
            
            console.log(`Compression complete: (Size: ${compressedFile.size / 1024 / 1024} MB)`);
            displayResults(originalFile, compressedFile); 

        } else {
            // --- 멀티 파일 처리 (ZIP) ---
            const zip = new JSZip();
            const totalFiles = originalFiles.length;
            let compressedFilesCount = 0;

            // ✅ [수정] (영어)
            updateProgressBar(0, `0 / ${totalFiles} files compressed...`);
            
            const compressionPromises = Array.from(originalFiles).map(async (file) => {
                try {
                    const compressedFile = await imageCompression(file, options);
                    
                    compressedFilesCount++;
                    const progress = (compressedFilesCount / totalFiles) * 100;
                    // ✅ [수정] (영어)
                    updateProgressBar(progress, `${compressedFilesCount} / ${totalFiles} files compressed...`);
                    
                    return { file: compressedFile, originalName: file.name };
                } catch (err) {
                    console.error(`Failed to compress ${file.name}:`, err);
                    return null; 
                }
            });

            const results = await Promise.all(compressionPromises);

            // ZIP 파일 생성
            updateProgressBar(100, 'Creating ZIP file...'); // ✅ [수정]
            results.forEach(result => {
                if (result) {
                    const newName = getCompressedFileName(result.originalName, result.file.name);
                    zip.file(newName, result.file); 
                }
            });

            const zipBlob = await zip.generateAsync({ 
                type: "blob",
                compression: "DEFLATE",
                compressionOptions: {
                    level: 9
                }
            });
            
            console.log('Multi-file ZIP compression complete');
            displayResults(originalFiles, zipBlob); 
        }

    } catch (error) {
        console.error('Compression failed:', error);
        // ✅ [수정] (영어)
        alert(`Image compression failed: ${error.message}`);
    } finally {
        compressButton.disabled = false;
        compressButton.textContent = 'Start Compression'; // ✅ [수정]
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
        downloadLink.download = 'compressed_images.zip'; 
        // ✅ [수정] (영어)
        downloadLink.textContent = `Download Compressed ZIP (${originals.length} files)`;

    } else {
        // --- 단일 파일 결과 표시 ---
        originalKB = (originals.size / 1024).toFixed(1);
        compressedKB = (compressedResult.size / 1024).toFixed(1);
        saveRate = 100 - (compressedResult.size / originals.size) * 100;
        
        const newName = getCompressedFileName(originals.name, compressedResult.name);
        downloadLink.href = URL.createObjectURL(compressedResult);
        downloadLink.download = newName;
        // ✅ [수정] (영어)
        downloadLink.textContent = 'Download Compressed Image';
    }

    originalSizeDisplay.textContent = `${originalKB} KB`;
    compressedSizeDisplay.textContent = `${compressedKB} KB`;
    saveRateDisplay.textContent = `${saveRate.toFixed(1) < 0 ? 0 : saveRate.toFixed(1)}`; 

    resultArea.classList.remove('hidden'); 
    progressBarContainer.classList.add('hidden'); 
}

// --- [ 3. 헬퍼 함수 ] ---

// 프로그레스 바 UI 업데이트 함수
function updateProgressBar(percentage, text) {
    progressBar.style.width = `${percentage}%`;
    if (text) {
        progressText.textContent = text;
    } else {
        // ✅ [수정] (영어)
        progressText.textContent = `Compressing: ${percentage.toFixed(0)}%`;
    }
}

// 압축 파일 이름 생성 함수 (예: 'image.jpg' -> 'image_compressed.jpg')
function getCompressedFileName(originalName, compressedMimeName) {
    const nameWithoutExtension = originalName.split('.').slice(0, -1).join('.');
    const extension = compressedMimeName.split('.').pop() || 'jpg'; 
    return `${nameWithoutExtension}_compressed.${extension}`;
}
