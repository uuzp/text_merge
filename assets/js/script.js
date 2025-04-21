document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const selectedDirSpan = document.getElementById('selectedDir');
    const fileListUl = document.getElementById('fileList');
    const mergedFileNameInput = document.getElementById('mergedFileName');
    const mergeButton = document.getElementById('mergeButton');
    const clearAllButton = document.getElementById('clearAllButton');
    const deleteSelectedButton = document.getElementById('deleteSelectedButton');

    let selectedFiles = []; // Array to store File objects

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

            const fileInfoDiv = document.createElement('div');
            fileInfoDiv.classList.add('file-info');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.classList.add('file-checkbox');
            fileInfoDiv.appendChild(checkbox);

            const fileNameSpan = document.createElement('span');
            fileNameSpan.textContent = file.name;
            fileInfoDiv.appendChild(fileNameSpan);

            const deleteButton = document.createElement('button');
            deleteButton.textContent = '删除';
            deleteButton.classList.add('delete-button');
            deleteButton.addEventListener('click', () => {
                deleteFileByIndex(index);
            });

            li.appendChild(fileInfoDiv);
            li.appendChild(deleteButton);
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
    }

    function handleDragOver(e) {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';
        if (this !== dragSrcEl) {
             this.classList.add('dragover');
        }
    }

     function handleDragLeave() {
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
        listItems.forEach(item => {
            item.classList.remove('dragging');
             item.classList.remove('dragover');
        });
    }

    // Update the selected file count display
    function updateSelectedFileInfo() {
        if (selectedFiles.length > 0) {
            selectedDirSpan.textContent = `已选择 ${selectedFiles.length} 个 TXT 文件`;
        } else {
            selectedDirSpan.textContent = '未选择文件';
        }
    }

    // Handle clear all button click
    clearAllButton.addEventListener('click', () => {
        selectedFiles = [];
        displayFileList();
        updateSelectedFileInfo();
    });

    // Handle delete selected button click
    deleteSelectedButton.addEventListener('click', () => {
        const checkboxes = fileListUl.querySelectorAll('.file-checkbox');
        const filesToDeleteIndices = [];
        checkboxes.forEach((checkbox, index) => {
            if (checkbox.checked) {
                filesToDeleteIndices.push(index);
            }
        });

        // Remove files from selectedFiles array in reverse order to avoid index issues
        for (let i = filesToDeleteIndices.length - 1; i >= 0; i--) {
            selectedFiles.splice(filesToDeleteIndices[i], 1);
        }

        displayFileList();
        updateSelectedFileInfo();
    });

    // Function to delete a single file by its current index in the displayed list
    function deleteFileByIndex(index) {
        selectedFiles.splice(index, 1);
        displayFileList();
        updateSelectedFileInfo();
    }


    // Handle merge button click
    mergeButton.addEventListener('click', async () => {
        if (selectedFiles.length === 0) {
            alert('请先选择 TXT 文件！');
            return;
        }

        const mergedFileName = mergedFileNameInput.value.trim() || 'merged_file';
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