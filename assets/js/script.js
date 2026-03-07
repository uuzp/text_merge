document.addEventListener('DOMContentLoaded', () => {
    const $id = (id) => document.getElementById(id);

    const fileInput = $id('fileInput');
    const selectedDirSpan = $id('selectedDir');
    const fileListUl = $id('fileList');
    const mergedFileNameInput = $id('mergedFileName');
    const fileEncodingSelect = $id('fileEncoding');
    const mergeButton = $id('mergeButton');
    const clearAllButton = $id('clearAllButton');

    let selectedFiles = [];

    const vibrate = (ms = 50) => {
        if (navigator.vibrate) navigator.vibrate(ms);
    };

    const isTxtFile = (file) => file && typeof file.name === 'string' && file.name.toLowerCase().endsWith('.txt');
    const getFileKey = (file) => [file.name, file.size, file.lastModified].join('::');

    function updateSelectedFileInfo() {
        selectedDirSpan.textContent = selectedFiles.length > 0
            ? `已选择 ${selectedFiles.length} 个 TXT 文件`
            : '未选择文件';
    }

    function deleteFileByIndex(index) {
        if (!Number.isInteger(index) || index < 0 || index >= selectedFiles.length) return;
        selectedFiles.splice(index, 1);
        renderFileList();
        updateSelectedFileInfo();
    }

    function sanitizeFileName(name) {
        const trimmed = (name ?? '').trim();
        const fallback = 'mango';
        const safe = (trimmed || fallback).replace(/[\\/:*?"<>|]+/g, '_');
        return safe || fallback;
    }

    async function readFileBuffer(file) {
        if (typeof file.arrayBuffer === 'function') return await file.arrayBuffer();
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    }

    function decodeText(buffer, encoding) {
        return new TextDecoder(encoding, { fatal: true }).decode(buffer);
    }

    async function readFileText(file, encodingMode) {
        const buffer = await readFileBuffer(file);
        const encodings = encodingMode === 'auto'
            ? ['utf-8', 'gb18030', 'big5']
            : [encodingMode];

        if (typeof TextDecoder === 'function') {
            let lastError = null;
            for (const encoding of encodings) {
                try {
                    return decodeText(buffer, encoding);
                } catch (error) {
                    lastError = error;
                }
            }

            throw lastError ?? new Error('Unsupported text encoding');
        }

        if (encodingMode !== 'auto' && encodingMode !== 'utf-8') {
            throw new Error(`Current browser does not support ${encodingMode}`);
        }

        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file, 'utf-8');
        });
    }

    function renderFileList() {
        fileListUl.innerHTML = '';
        selectedFiles.forEach((file, index) => {
            const li = document.createElement('li');
            li.draggable = true;
            li.dataset.index = String(index);
            li.setAttribute('role', 'listitem');

            const fileInfoDiv = document.createElement('div');
            fileInfoDiv.className = 'file-info';

            const fileNameSpan = document.createElement('span');
            fileNameSpan.textContent = file.name;
            fileInfoDiv.appendChild(fileNameSpan);

            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'delete-file-button';
            deleteButton.dataset.action = 'delete';
            deleteButton.dataset.index = String(index);
            deleteButton.setAttribute('aria-label', `删除 ${file.name}`);
            deleteButton.textContent = '删除';

            li.appendChild(fileInfoDiv);
            li.appendChild(deleteButton);
            fileListUl.appendChild(li);
        });
    }

    function reorderFiles(srcIndex, targetIndex) {
        if (!Number.isInteger(srcIndex) || !Number.isInteger(targetIndex)) return;
        if (srcIndex === targetIndex) return;
        if (srcIndex < 0 || targetIndex < 0) return;
        if (srcIndex >= selectedFiles.length || targetIndex >= selectedFiles.length) return;

        const [moved] = selectedFiles.splice(srcIndex, 1);
        selectedFiles.splice(targetIndex, 0, moved);
        renderFileList();
    }

    // 文件选择：追加 + 去重（按文件名）
    fileInput.addEventListener('change', (event) => {
        const incoming = Array.from(event.target.files).filter(isTxtFile);
        const existingKeys = new Set(selectedFiles.map(getFileKey));
        for (const file of incoming) {
            const fileKey = getFileKey(file);
            if (!existingKeys.has(fileKey)) {
                selectedFiles.push(file);
                existingKeys.add(fileKey);
            }
        }

        renderFileList();
        updateSelectedFileInfo();
        event.target.value = '';
    });

    // 删除按钮（事件委托，避免重复绑定）
    fileListUl.addEventListener('click', (event) => {
        const deleteButton = event.target.closest('[data-action="delete"]');
        if (!deleteButton || !fileListUl.contains(deleteButton)) return;
        deleteFileByIndex(Number(deleteButton.dataset.index));
        vibrate();
    });

    // 桌面端拖拽排序（事件委托）
    fileListUl.addEventListener('dragstart', (event) => {
        const li = event.target.closest('li');
        if (!li || !fileListUl.contains(li)) return;
        const srcIndex = Number(li.dataset.index);
        if (!Number.isInteger(srcIndex)) return;

        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(srcIndex));
        li.classList.add('dragging');
    });

    fileListUl.addEventListener('dragover', (event) => {
        const li = event.target.closest('li');
        if (!li || !fileListUl.contains(li)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        li.classList.add('dragover');
    });

    fileListUl.addEventListener('dragleave', (event) => {
        const li = event.target.closest('li');
        if (!li || !fileListUl.contains(li)) return;
        li.classList.remove('dragover');
    });

    fileListUl.addEventListener('drop', (event) => {
        const li = event.target.closest('li');
        if (!li || !fileListUl.contains(li)) return;
        event.preventDefault();

        const srcIndex = Number(event.dataTransfer.getData('text/plain'));
        const targetIndex = Number(li.dataset.index);

        if (Number.isInteger(srcIndex) && Number.isInteger(targetIndex)) {
            reorderFiles(srcIndex, targetIndex);
        }

        li.classList.remove('dragover');
    });

    fileListUl.addEventListener('dragend', () => {
        fileListUl.querySelectorAll('li').forEach((item) => {
            item.classList.remove('dragging');
            item.classList.remove('dragover');
        });
    });

    // 移动端：双击删除 + 拖动排序（事件委托）
    const touchState = {
        startX: 0,
        startY: 0,
        moving: false,
        item: null,
        startIndex: -1,
        overIndex: -1,
    };

    function clearTouchHints() {
        fileListUl.querySelectorAll('.touch-over').forEach((el) => el.classList.remove('touch-over'));
        if (touchState.item) touchState.item.classList.remove('touch-dragging');
    }

    fileListUl.addEventListener('touchstart', (event) => {
        const li = event.target.closest('li');
        if (!li || !fileListUl.contains(li)) return;

        if (event.target.closest('[data-action="delete"]')) return;

        const touch = event.touches[0];
        touchState.startX = touch.clientX;
        touchState.startY = touch.clientY;
        touchState.moving = false;
        touchState.item = li;
        touchState.startIndex = Number(li.dataset.index);
        touchState.overIndex = -1;
    }, { passive: true });

    fileListUl.addEventListener('touchmove', (event) => {
        if (!touchState.item) return;

        const touch = event.touches[0];
        const dx = touch.clientX - touchState.startX;
        const dy = touch.clientY - touchState.startY;

        if (!touchState.moving && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
            touchState.moving = true;
            touchState.item.classList.add('touch-dragging');
        }

        if (!touchState.moving) return;

        // 阻止页面滚动/默认行为（需要 passive:false）
        event.preventDefault();

        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const overLi = el ? el.closest('#fileList li') : null;

        clearTouchHints();
        touchState.item.classList.add('touch-dragging');

        if (overLi && overLi !== touchState.item && fileListUl.contains(overLi)) {
            overLi.classList.add('touch-over');
            touchState.overIndex = Number(overLi.dataset.index);
        } else {
            touchState.overIndex = -1;
        }
    }, { passive: false });

    fileListUl.addEventListener('touchend', (event) => {
        if (!touchState.item) return;

        if (touchState.moving) {
            event.preventDefault();
            const srcIndex = touchState.startIndex;
            const targetIndex = touchState.overIndex;
            clearTouchHints();

            if (Number.isInteger(srcIndex) && Number.isInteger(targetIndex) && targetIndex >= 0) {
                reorderFiles(srcIndex, targetIndex);
            }
        }

        touchState.item = null;
        touchState.startIndex = -1;
        touchState.overIndex = -1;
        touchState.moving = false;
    }, { passive: false });

    clearAllButton.addEventListener('click', () => {
        selectedFiles = [];
        renderFileList();
        updateSelectedFileInfo();
    });

    mergeButton.addEventListener('click', async () => {
        if (selectedFiles.length === 0) {
            alert('请先选择 TXT 文件！');
            return;
        }

        const mergedFileName = sanitizeFileName(mergedFileNameInput.value);
        const parts = [];

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            try {
                const content = await readFileText(file, fileEncodingSelect.value);
                const title = file.name.replace(/\.txt$/i, '');
                parts.push(`第${i + 1}章 ${title}\n`);
                parts.push(content);
                parts.push('\n\n');
            } catch (error) {
                console.error(`Error reading file ${file.name}:`, error);
                alert(`读取文件 ${file.name} 时出错，请检查控制台。`);
                return;
            }
        }

        const blob = new Blob(parts, { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${mergedFileName}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    renderFileList();
    updateSelectedFileInfo();
});