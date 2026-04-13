(function() {
    const API_BASE = 'http://localhost:8080/api';

    let knowledgeItems = [];
    let currentPage = 1;
    let pageSize = 10;
    let totalItems = 0;
    let searchKeyword = '';
    let currentTags = [];
    let editTags = [];
    let deleteTargetId = null;

    const knowledgeTableBody = document.getElementById('knowledgeTableBody');
    const pagination = document.getElementById('pagination');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const manualForm = document.getElementById('manualForm');
    const tagInput = document.getElementById('tagInput');
    const tagList = document.getElementById('tagList');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    const toast = document.getElementById('toast');

    const detailModal = document.getElementById('detailModal');
    const editModal = document.getElementById('editModal');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');

    function generateId() {
        return 'item-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    function formatTime(date) {
        const pad = n => n.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }

    function showToast(message, type = 'info') {
        toast.textContent = message;
        toast.className = 'toast show ' + type;
        setTimeout(() => {
            toast.className = 'toast';
        }, 3000);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function loadKnowledgeItems() {
        fetch(API_BASE + '/knowledge/items?page=' + (currentPage - 1) + '&size=' + pageSize + (searchKeyword ? '&keyword=' + encodeURIComponent(searchKeyword) : ''))
            .then(res => res.json())
            .then(data => {
                if (data.code === 200) {
                    knowledgeItems = data.data.items.map(item => ({
                        id: item.id,
                        title: item.title,
                        content: item.contentPreview,
                        contentFull: item.contentPreview,
                        tags: item.tags ? item.tags.split(',') : [],
                        source: item.source,
                        createTime: item.createdAt
                    }));
                    totalItems = data.data.total;
                    renderTable();
                    renderPagination();
                }
            })
            .catch(err => {
                console.error('Failed to load knowledge items:', err);
                showToast('加载知识库失败', 'error');
            });
    }

    function renderTable() {
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        const pageItems = knowledgeItems.slice(start, end);

        if (pageItems.length === 0) {
            knowledgeTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 32px; color: #999;">
                        暂无数据
                    </td>
                </tr>
            `;
            return;
        }

        knowledgeTableBody.innerHTML = pageItems.map(item => `
            <tr>
                <td>${escapeHtml(item.title)}</td>
                <td>${item.tags.map(t => `<span style="display: inline-block; padding: 2px 8px; background: #e3f2fd; border-radius: 4px; margin: 2px; font-size: 12px;">${escapeHtml(t)}</span>`).join('')}</td>
                <td>${escapeHtml(item.source)}</td>
                <td>${item.createTime}</td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn view" data-id="${item.id}">查看</button>
                        <button class="action-btn edit" data-id="${item.id}">编辑</button>
                        <button class="action-btn delete" data-id="${item.id}">删除</button>
                    </div>
                </td>
            </tr>
        `).join('');

        knowledgeTableBody.querySelectorAll('.action-btn.view').forEach(btn => {
            btn.addEventListener('click', () => showDetail(btn.dataset.id));
        });
        knowledgeTableBody.querySelectorAll('.action-btn.edit').forEach(btn => {
            btn.addEventListener('click', () => showEdit(btn.dataset.id));
        });
        knowledgeTableBody.querySelectorAll('.action-btn.delete').forEach(btn => {
            btn.addEventListener('click', () => showDeleteConfirm(btn.dataset.id));
        });
    }

    function renderPagination() {
        const totalPages = Math.ceil(totalItems / pageSize);
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = `
            <button ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">上一页</button>
            <span>第 ${currentPage} / ${totalPages} 页</span>
            <button ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">下一页</button>
        `;
        pagination.innerHTML = html;

        pagination.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!btn.disabled) {
                    currentPage = parseInt(btn.dataset.page);
                    renderTable();
                    renderPagination();
                }
            });
        });
    }

    function showDetail(id) {
        fetch(API_BASE + '/knowledge/items/' + id)
            .then(res => res.json())
            .then(data => {
                if (data.code === 200) {
                    const item = data.data;
                    const content = document.getElementById('detailContent');
                    content.innerHTML = `
                        <span class="label">标题</span>
                        <div class="content">${escapeHtml(item.title)}</div>
                        <span class="label">标签</span>
                        <div class="content">${(item.tags || '').split(',').map(t => `<span style="display: inline-block; padding: 2px 8px; background: #e3f2fd; border-radius: 4px; margin: 2px; font-size: 12px;">${escapeHtml(t)}</span>`).join('')}</div>
                        <span class="label">来源</span>
                        <div class="content">${escapeHtml(item.source)}</div>
                        <span class="label">创建时间</span>
                        <div class="content">${item.createdAt}</div>
                        <span class="label">内容</span>
                        <div class="content">${escapeHtml(item.contentPreview || '')}</div>
                    `;
                    detailModal.classList.add('show');
                } else {
                    showToast('获取详情失败', 'error');
                }
            })
            .catch(err => {
                console.error('Failed to load detail:', err);
                showToast('获取详情失败', 'error');
            });
    }

    function hideDetail() {
        detailModal.classList.remove('show');
    }

    function showEdit(id) {
        const item = knowledgeItems.find(i => i.id === id);
        if (!item) return;

        document.getElementById('editItemId').value = item.id;
        document.getElementById('editTitle').value = item.title;
        document.getElementById('editContent').value = item.content;
        editTags = [...item.tags];
        renderEditTags();
        editModal.classList.add('show');
    }

    function hideEdit() {
        editModal.classList.remove('show');
        editTags = [];
        renderEditTags();
    }

    function renderTags() {
        tagList.innerHTML = currentTags.map(tag => `
            <span style="display: inline-block; padding: 4px 8px; background: #4a90e2; color: white; border-radius: 4px; font-size: 12px;">
                ${escapeHtml(tag)} <span style="cursor: pointer; margin-left: 4px;" data-tag="${escapeHtml(tag)}">&times;</span>
            </span>
        `).join('');

        tagList.querySelectorAll('span span').forEach(btn => {
            btn.addEventListener('click', () => {
                currentTags = currentTags.filter(t => t !== btn.dataset.tag);
                renderTags();
            });
        });
    }

    function renderEditTags() {
        const editTagList = document.getElementById('editTagList');
        editTagList.innerHTML = editTags.map(tag => `
            <span style="display: inline-block; padding: 4px 8px; background: #4a90e2; color: white; border-radius: 4px; font-size: 12px;">
                ${escapeHtml(tag)} <span style="cursor: pointer; margin-left: 4px;" data-tag="${escapeHtml(tag)}">&times;</span>
            </span>
        `).join('');

        editTagList.querySelectorAll('span span').forEach(btn => {
            btn.addEventListener('click', () => {
                editTags = editTags.filter(t => t !== btn.dataset.tag);
                renderEditTags();
            });
        });
    }

    function showDeleteConfirm(id) {
        deleteTargetId = id;
        deleteConfirmModal.classList.add('show');
    }

    function hideDeleteConfirm() {
        deleteConfirmModal.classList.remove('show');
        deleteTargetId = null;
    }

    function addKnowledgeItem(title, content, tags, source) {
        const newItem = {
            id: generateId(),
            title: title,
            content: content,
            tags: tags,
            source: source,
            createTime: formatTime(new Date())
        };
        knowledgeItems.unshift(newItem);
        totalItems = knowledgeItems.length;
        currentPage = 1;
        renderTable();
        renderPagination();
        return newItem;
    }

    function updateKnowledgeItem(id, title, content, tags) {
        fetch(API_BASE + '/knowledge/items/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                content: content,
                tags: tags.join(',')
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.code === 200) {
                loadKnowledgeItems();
                return true;
            } else {
                showToast(data.message || '更新失败', 'error');
                return false;
            }
        })
        .catch(err => {
            console.error('Failed to update knowledge item:', err);
            showToast('更新知识条目失败', 'error');
            return false;
        });
    }

    function deleteKnowledgeItem(id) {
        fetch(API_BASE + '/knowledge/items/' + id, { method: 'DELETE' })
            .then(res => res.json())
            .then(data => {
                if (data.code === 200) {
                    knowledgeItems = knowledgeItems.filter(i => i.id !== id);
                    totalItems--;

                    const totalPages = Math.ceil(totalItems / pageSize);
                    if (currentPage > totalPages) {
                        currentPage = Math.max(1, totalPages);
                    }

                    renderTable();
                    renderPagination();
                    showToast('知识条目已删除', 'success');
                } else {
                    showToast(data.message || '删除失败', 'error');
                }
            })
            .catch(err => {
                console.error('Failed to delete knowledge item:', err);
                showToast('删除知识条目失败', 'error');
            });
    }

    function uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        uploadProgress.style.display = 'block';
        progressBar.style.width = '0%';

        fetch(API_BASE + '/knowledge/upload', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.code === 200) {
                uploadProgress.style.display = 'none';
                progressBar.style.width = '0%';
                loadKnowledgeItems();
                showToast('文件上传成功', 'success');
            } else {
                uploadProgress.style.display = 'none';
                progressBar.style.width = '0%';
                showToast(data.message || '上传失败', 'error');
            }
        })
        .catch(err => {
            console.error('Upload failed:', err);
            uploadProgress.style.display = 'none';
            progressBar.style.width = '0%';
            showToast('文件上传失败', 'error');
        });
    }

    function simulateFileUpload(files) {
        const file = files[0];
        if (!file) return;
        uploadFile(file);
    }

    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    manualForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('itemTitle').value.trim();
        const content = document.getElementById('itemContent').value.trim();

        if (!title || !content) {
            showToast('请填写标题和内容', 'error');
            return;
        }

        fetch(API_BASE + '/knowledge/manual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                content: content,
                tags: currentTags.join(',')
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.code === 200) {
                manualForm.reset();
                currentTags = [];
                renderTags();
                loadKnowledgeItems();
                showToast('知识条目添加成功', 'success');
            } else {
                showToast(data.message || '添加失败', 'error');
            }
        })
        .catch(err => {
            console.error('Failed to add knowledge item:', err);
            showToast('添加知识条目失败', 'error');
        });
    });

    tagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const tag = tagInput.value.trim();
            if (tag && !currentTags.includes(tag)) {
                currentTags.push(tag);
                renderTags();
            }
            tagInput.value = '';
        }
    });

    document.getElementById('editTagInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const tag = e.target.value.trim();
            if (tag && !editTags.includes(tag)) {
                editTags.push(tag);
                renderEditTags();
            }
            e.target.value = '';
        }
    });

    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        simulateFileUpload(files);
    });

    fileInput.addEventListener('change', () => {
        simulateFileUpload(fileInput.files);
    });

    document.getElementById('searchBtn').addEventListener('click', () => {
        searchKeyword = searchInput.value.trim();
        currentPage = 1;
        loadKnowledgeItems();
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('searchBtn').click();
        }
    });

    document.getElementById('closeDetailModal').addEventListener('click', hideDetail);
    detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) hideDetail();
    });

    document.getElementById('closeEditModal').addEventListener('click', hideEdit);
    document.getElementById('cancelEditBtn').addEventListener('click', hideEdit);
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) hideEdit();
    });

    document.getElementById('editForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('editItemId').value;
        const title = document.getElementById('editTitle').value.trim();
        const content = document.getElementById('editContent').value.trim();

        if (!title || !content) {
            showToast('请填写标题和内容', 'error');
            return;
        }

        updateKnowledgeItem(id, title, content, [...editTags]);
        hideEdit();
        showToast('知识条目更新成功', 'success');
    });

    document.getElementById('closeDeleteModal').addEventListener('click', hideDeleteConfirm);
    document.getElementById('cancelDeleteBtn').addEventListener('click', hideDeleteConfirm);
    document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
        if (deleteTargetId) {
            deleteKnowledgeItem(deleteTargetId);
            hideDeleteConfirm();
            showToast('知识条目已删除', 'success');
        }
    });
    deleteConfirmModal.addEventListener('click', (e) => {
        if (e.target === deleteConfirmModal) hideDeleteConfirm();
    });

    loadKnowledgeItems();
})();