document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const selectedDirSpan = document.getElementById('selectedDir');
    const fileListUl = document.getElementById('fileList');
    const mergedFileNameInput = document.getElementById('mergedFileName');
    const mergeButton = document.getElementById('mergeButton');
    const clearAllButton = document.getElementById('clearAllButton');    let selectedFiles = []; // Array to store File objects

    // 移动端变量
    let touchStartY = 0;
    let touchStartX = 0;
    let touchItem = null;
    let touchItemIndex = -1;
    let isTouchMoving = false;
    let currentTouch = null;
    let touchStartTime = 0;

    // 震动反馈函数
    function vibrate() {
        if (navigator.vibrate) {
            navigator.vibrate(50); // 震动50毫秒
        }
    }

    // Function to delete a single file by its current index in the displayed list
    function deleteFileByIndex(index) {
        selectedFiles.splice(index, 1);
        displayFileList();
        updateSelectedFileInfo();
    }

    // Update the selected file count display
    function updateSelectedFileInfo() {
        if (selectedFiles.length > 0) {
            selectedDirSpan.textContent = `已选择 ${selectedFiles.length} 个 TXT 文件`;
        } else {
            selectedDirSpan.textContent = '未选择文件';
        }
    }    // 移动端触摸开始事件
    function handleTouchStart(e) {
        const touch = e.touches[0];
        const target = e.currentTarget;
        touchStartTime = Date.now();
        touchStartY = touch.clientY;
        touchStartX = touch.clientX;
        touchItem = target;
        touchItemIndex = Array.from(fileListUl.children).indexOf(target);
        isTouchMoving = false;
        currentTouch = touch;
        
        // 禁止点击链接的默认行为
        target.addEventListener('click', function clickHandler(event) {
            if (isTouchMoving) {
                event.preventDefault();
                event.stopPropagation();
                target.removeEventListener('click', clickHandler);
            }
        }, { once: true });

        // 记录上次点击时间，用于检测双击
        const now = Date.now();
        const lastTap = target.dataset.lastTap ? parseInt(target.dataset.lastTap) : 0;
        const timeDiff = now - lastTap;

        // 如果是双击（时间间隔小于300ms），则删除文件
        if (timeDiff < 300 && timeDiff > 0) {
            e.preventDefault();
            e.stopPropagation();
            const index = parseInt(target.dataset.index);
            deleteFileByIndex(index);
            vibrate();
            target.dataset.lastTap = 0; // 重置，避免连续多次触发
        } else {
            target.dataset.lastTap = now;
        }
    }    // 移动端触摸移动事件
    function handleTouchMove(e) {
        if (!touchItem) return;
        
        // 始终阻止默认行为，防止导航
        e.preventDefault(); 
        e.stopPropagation();
        
        const touch = e.touches[0];
        const moveY = touch.clientY - touchStartY;
        const moveX = touch.clientX - touchStartX;
        
        // 判断是否为拖动意图（移动超过10像素）
        if (Math.abs(moveY) > 10 || Math.abs(moveX) > 10) {
            isTouchMoving = true;
            
            // 添加拖动样式
            touchItem.classList.add('touch-dragging');
            
            // 查找目标位置
            const items = Array.from(fileListUl.children);
            const itemHeight = touchItem.offsetHeight;
            const touchY = touch.clientY;
            
            // 计算当前触摸位置在哪个元素上方
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item === touchItem) continue;
                
                const rect = item.getBoundingClientRect();
                const itemMiddle = rect.top + rect.height / 2;
                
                // 如果触摸点在某个项目的中间线之上或之下
                if ((i < touchItemIndex && touchY < itemMiddle) || 
                    (i > touchItemIndex && touchY > itemMiddle)) {
                    item.classList.add('touch-over');
                } else {
                    item.classList.remove('touch-over');
                }
            }
        }
    }    // 移动端触摸结束事件
    function handleTouchEnd(e) {
        if (!touchItem) return;
        
        // 如果是拖拽动作，阻止默认行为（防止点击导航）
        if (isTouchMoving) {
            e.preventDefault();
            e.stopPropagation();
            
            const items = Array.from(fileListUl.children);
            const touchOverItem = fileListUl.querySelector('.touch-over');
            
            if (touchOverItem) {
                const targetIndex = items.indexOf(touchOverItem);
                const [movedItem] = selectedFiles.splice(touchItemIndex, 1);
                selectedFiles.splice(targetIndex, 0, movedItem);
                displayFileList();
            }
            
            // 清除所有样式类
            items.forEach(item => {
                item.classList.remove('touch-dragging');
                item.classList.remove('touch-over');
            });
        }
        
        // 重置变量
        touchItem = null;
        touchItemIndex = -1;
        isTouchMoving = false;
        currentTouch = null;
    }

    // Handle file selection
    fileInput.addEventListener('change', (event) => {
        // Add newly selected files to the existing list, filtering duplicates by name
        const newFiles = Array.from(event.target.files).filter(file => file.name.endsWith('.txt'));
        newFiles.forEach(newFile => {
            if (!selectedFiles.some(existingFile => existingFile.name === newFile.name)) {
                selectedFiles.push(newFile);
            }
        });

        displayFileList();
        updateSelectedFileInfo();
        // Clear the file input value so selecting the same file(s) again triggers the change event
        event.target.value = '';
    });
      // Display files in the list
    function displayFileList() {
        fileListUl.innerHTML = ''; // Clear current list
        selectedFiles.forEach((file, index) => {
            const li = document.createElement('li');
            li.setAttribute('draggable', true);
            li.dataset.index = index;
            li.style.userSelect = 'none'; // 防止文本选择
            li.setAttribute('role', 'listitem'); // 设置正确的ARIA角色
            
            // 确保不会被当作链接处理
            li.onclick = function(e) { 
                // 只处理普通点击，不处理拖动后的点击
                if (!isTouchMoving) return;
                e.preventDefault();
            };

            const fileInfoDiv = document.createElement('div');
            fileInfoDiv.classList.add('file-info');

            const fileNameSpan = document.createElement('span');
            fileNameSpan.textContent = file.name;
            fileInfoDiv.appendChild(fileNameSpan);

            // 添加右键点击删除功能
            li.addEventListener('contextmenu', (e) => {
                e.preventDefault(); // 阻止默认的右键菜单
                deleteFileByIndex(index);
            });
            
            // 添加双击删除功能（桌面端）
            li.addEventListener('dblclick', () => {
                deleteFileByIndex(index);
                vibrate(); // 触发震动反馈（移动端）
            });

            // 移动端触摸事件 - 用于双击和拖拽
            li.addEventListener('touchstart', handleTouchStart);
            li.addEventListener('touchmove', handleTouchMove);
            li.addEventListener('touchend', handleTouchEnd);

            li.appendChild(fileInfoDiv);
            fileListUl.appendChild(li);
        });
        addDragDropListeners();
    }

    // Add drag and drop listeners to list items
    function addDragDropListeners() {
        const listItems = fileListUl.querySelectorAll('li');
        listItems.forEach(item => {
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('dragleave', handleDragLeave);
            item.addEventListener('drop', handleDrop);
            item.addEventListener('dragend', handleDragEnd);
        });
    }

    let dragSrcEl = null;

    function handleDragStart(e) {
        dragSrcEl = this;
        e.dataTransfer.effectAllowed = 'move';
        // Store the index of the dragged item in the original selectedFiles array
        const srcIndex = Array.from(fileListUl.children).indexOf(this);
        e.dataTransfer.setData('text/plain', srcIndex);
        this.classList.add('dragging');
    }    function handleDragOver(e) {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';
        if (this !== dragSrcEl) {
            this.classList.add('dragover');
        }
    }function handleDragLeave() {
        this.classList.remove('dragover');
    }

    function handleDrop(e) {
        e.stopPropagation(); // Prevent default action (opening as link for some browsers)

        if (dragSrcEl !== this) {
            const srcIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
            const targetIndex = Array.from(fileListUl.children).indexOf(this);

            // Reorder the selectedFiles array based on the original index
            const [draggedItem] = selectedFiles.splice(srcIndex, 1);
            selectedFiles.splice(targetIndex, 0, draggedItem);

            // Re-render the list to reflect the new order
            displayFileList();
        }
        this.classList.remove('dragover');
        return false;
    }

    function handleDragEnd() {
        const listItems = fileListUl.querySelectorAll('li');
        listItems.forEach(item => {            item.classList.remove('dragging');
            item.classList.remove('dragover');
        });
    }    // Handle clear all button click
    clearAllButton.addEventListener('click', () => {
        selectedFiles = [];
        displayFileList();
        updateSelectedFileInfo();
    });

    // Handle merge button click
    mergeButton.addEventListener('click', async () => {
        if (selectedFiles.length === 0) {
            alert('请先选择 TXT 文件！');
            return;
        }

        const mergedFileName = mergedFileNameInput.value.trim() || 'mango';
        let mergedContent = '';
        let chapterCount = 1;

        for (const file of selectedFiles) {
            try {
                const content = await readFileContent(file);
                const fileNameWithoutExt = file.name.replace(/\.txt$/, '');
                mergedContent += `第${chapterCount}章 ${fileNameWithoutExt}\n`;
                mergedContent += content + "\n\n";
                chapterCount++;
            } catch (error) {
                console.error(`Error reading file ${file.name}:`, error);
                alert(`读取文件 ${file.name} 时出错，请检查控制台。`);
                return; // Stop merging if any file read fails
            }
        }

        // Create a Blob and trigger download
        const blob = new Blob([mergedContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${mergedFileName}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Clean up the URL object
    });

    // Function to read file content using FileReader
    function readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file, 'utf-8');
        });
    }
});