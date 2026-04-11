(function() {
    const API_BASE = '/api';

    const mockKnowledgeItems = [
        {
            id: 'item-001',
            title: 'Spring Boot 集成 Spring AI 指南',
            content: 'Spring Boot 集成 Spring AI 的步骤如下：\n\n1. 在 pom.xml 中添加依赖\n2. 配置 Ollama 连接信息\n3. 创建 ChatClient Bean\n4. 配置 VectorStore 和 ChatMemory\n5. 实现 RAG 流程\n\n这个集成可以让应用具备 AI 对话和检索增强生成能力。',
            tags: ['Spring', 'AI', '集成'],
            source: '手动录入',
            createTime: '2026-04-10 14:30:00'
        },
        {
            id: 'item-002',
            title: 'RAG 技术原理解析',
            content: 'RAG（Retrieval-Augmented Generation）是一种混合 AI 技术，结合了检索系统和生成模型的优势。\n\n核心原理：\n1. 检索阶段：从知识库中检索与问题相关的文档片段\n2. 增强阶段：将检索结果作为上下文添加到提示词\n3. 生成阶段：LLM 基于增强后的提示词生成回答\n\n优势：\n- 解决 LLM 知识时效性问题\n- 减少幻觉，提高准确性\n- 可追溯答案来源\n- 支持领域知识定制',
            tags: ['RAG', '原理', 'AI'],
            source: '手动录入',
            createTime: '2026-04-09 10:15:00'
        },
        {
            id: 'item-003',
            title: 'ChromaDB 向量数据库简介',
            content: 'ChromaDB 是一个开源的向量数据库，专为 AI 应用设计。\n\n主要特点：\n1. 轻量级，易于部署\n2. 支持多种嵌入模型\n3. 提供 Python 和 JavaScript SDK\n4. 支持元数据过滤\n5. 可以本地或分布式部署\n\n适用场景：\n- AI 原型开发\n- 小规模向量检索\n- 语义搜索应用\n- RAG 系统的知识库',
            tags: ['ChromaDB', '向量数据库'],
            source: 'document:vector-intro.pdf',
            createTime: '2026-04-08 16:45:00'
        },
        {
            id: 'item-004',
            title: 'Ollama 本地 LLM 运行指南',
            content: 'Ollama 是一个本地运行大语言模型的平台。\n\n支持模型：\n- Llama 2\n- Mistral\n- Code Llama\n- 等多种开源模型\n\n使用方法：\n1. 安装 Ollama\n2. 拉取模型：ollama pull llama2\n3. 运行模型：ollama run llama2\n4. 通过 API 调用\n\n优势：\n- 隐私保护，数据不出本地\n- 无需云服务费用\n- 支持 GPU 加速',
            tags: ['Ollama', 'LLM', '本地部署'],
            source: 'document:ollama-guide.pdf',
            createTime: '2026-04-07 09:20:00'
        },
        {
            id: 'item-005',
            title: '文本分割策略最佳实践',
            content: '在 RAG 系统中，文本分割是影响检索效果的关键步骤。\n\n常见策略：\n1. 固定长度分割\n   - 优点：简单快速\n   - 缺点：可能打断语义单元\n\n2. 句子级别分割\n   - 按句子边界分割\n   - 保持语义完整性\n\n3. 语义分割\n   - 使用模型识别语义单元\n   - 效果最好但复杂度高\n\n4. 递归字符分割\n   - 尝试多种分隔符\n   - 平衡效果和性能\n\n建议根据具体文档类型选择合适的策略。',
            tags: ['文本分割', 'RAG', '最佳实践'],
            source: '手动录入',
            createTime: '2026-04-06 11:00:00'
        },
        {
            id: 'item-006',
            title: 'Apache Tika 文档解析使用指南',
            content: 'Apache Tika 是一个内容分析工具，支持多种文档格式。\n\n支持的格式：\n- PDF\n- Microsoft Office (Word, Excel, PowerPoint)\n- HTML\n- TXT\n- 图像（OCR）\n- 邮件\n- 音频/视频元数据\n\n使用示例：\n\nParser parser = new AutoDetectParser();\nContentHandler handler = new BodyContentHandler();\nMetadata metadata = new Metadata();\nparser.parse(inputStream, handler, metadata, new ParseContext());\nString content = handler.toString();\n\n优势：\n- 统一接口\n- 自动检测格式\n- 提取元数据\n- 支持海量格式',
            tags: ['Apache Tika', '文档解析'],
            source: 'document:tika-tutorial.pdf',
            createTime: '2026-04-05 14:30:00'
        }
    ];

    let knowledgeItems = [];
    let currentPage = 1;
    let pageSize = 5;
    let totalItems = 0;
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
        knowledgeItems = [...mockKnowledgeItems];
        totalItems = knowledgeItems.length;
        renderTable();
        renderPagination();
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
        const item = knowledgeItems.find(i => i.id === id);
        if (!item) return;

        const content = document.getElementById('detailContent');
        content.innerHTML = `
            <span class="label">标题</span>
            <div class="content">${escapeHtml(item.title)}</div>
            <span class="label">标签</span>
            <div class="content">${item.tags.map(t => `<span style="display: inline-block; padding: 2px 8px; background: #e3f2fd; border-radius: 4px; margin: 2px; font-size: 12px;">${escapeHtml(t)}</span>`).join('')}</div>
            <span class="label">来源</span>
            <div class="content">${escapeHtml(item.source)}</div>
            <span class="label">创建时间</span>
            <div class="content">${item.createTime}</div>
            <span class="label">内容</span>
            <div class="content">${escapeHtml(item.content)}</div>
        `;
        detailModal.classList.add('show');
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
        const item = knowledgeItems.find(i => i.id === id);
        if (item) {
            item.title = title;
            item.content = content;
            item.tags = tags;
            renderTable();
        }
    }

    function deleteKnowledgeItem(id) {
        knowledgeItems = knowledgeItems.filter(i => i.id !== id);
        totalItems = knowledgeItems.length;

        const totalPages = Math.ceil(totalItems / pageSize);
        if (currentPage > totalPages) {
            currentPage = Math.max(1, totalPages);
        }

        renderTable();
        renderPagination();
    }

    function simulateFileUpload(files) {
        const file = files[0];
        if (!file) return;

        uploadProgress.style.display = 'block';
        progressBar.style.width = '0%';

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);

                setTimeout(() => {
                    uploadProgress.style.display = 'none';
                    progressBar.style.width = '0%';

                    addKnowledgeItem(
                        '文档: ' + file.name,
                        `已成功解析文档内容。这是 ${file.name} 的文本内容预览。在实际应用中，这里会显示 Apache Tika 提取的实际文本内容。\n\n文件大小: ${(file.size / 1024).toFixed(2)} KB\n文件类型: ${file.type || 'unknown'}`,
                        ['文档上传', file.name.split('.').pop().toUpperCase()],
                        `document:${file.name}`
                    );

                    showToast('文件上传成功', 'success');
                }, 500);
            }
            progressBar.style.width = progress + '%';
        }, 200);
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

        addKnowledgeItem(title, content, [...currentTags], '手动录入');
        manualForm.reset();
        currentTags = [];
        renderTags();
        showToast('知识条目添加成功', 'success');
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
        const keyword = searchInput.value.trim().toLowerCase();
        if (keyword) {
            const filtered = mockKnowledgeItems.filter(item =>
                item.title.toLowerCase().includes(keyword) ||
                item.content.toLowerCase().includes(keyword) ||
                item.tags.some(t => t.toLowerCase().includes(keyword))
            );
            knowledgeItems = filtered;
            totalItems = filtered.length;
            currentPage = 1;
            renderTable();
            renderPagination();
            showToast(`找到 ${totalItems} 条相关结果`, 'success');
        } else {
            loadKnowledgeItems();
        }
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