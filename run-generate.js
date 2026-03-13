// 간단한 실행 래퍼 (한글 경로 문제 해결)
const { spawn } = require('child_process');
const path = require('path');

// 현재 파일의 디렉토리
const scriptDir = __dirname;
const generateScript = path.join(scriptDir, 'generate-index.js');

console.log('스크립트 실행 중...');
console.log('경로:', generateScript);

const child = spawn('node', [generateScript], {
    cwd: scriptDir,
    stdio: 'inherit',
    shell: true
});

child.on('error', (error) => {
    console.error('실행 오류:', error);
});

child.on('exit', (code) => {
    if (code === 0) {
        console.log('완료!');
    } else {
        console.error('오류 코드:', code);
    }
});
