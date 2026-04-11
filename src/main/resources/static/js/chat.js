(function() {
    const API_BASE = '/api';

    let conversations = [];
    let currentConversationId = null;
    let messages = {};
    let deleteTargetId = null;

    const conversationList = document.getElementById('conversationList');
    const messageContainer = document.getElementById('messageContainer');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const newChatBtn = document.getElementById('newChatBtn');
    const chatTitle = document.getElementById('chatTitle');
    const emptyState = document.getElementById('emptyState');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const toast = document.getElementById('toast');

    const mockConversations = [
        {
            id: 'conv-001',
            title: 'Java Spring Boot 相关问题',
            updateTime: '2026-04-11 10:30:00'
        },
        {
            id: 'conv-002',
            title: 'RAG 技术原理探讨',
            updateTime: '2026-04-10 15:20:00'
        },
        {
            id: 'conv-003',
            title: '向量数据库选择',
            updateTime: '2026-04-09 09:15:00'
        }
    ];

    const mockMessages = {
        'conv-001': [
            { role: 'user', content: 'Spring Boot 如何集成 Spring AI？' },
            { role: 'assistant', content: 'Spring Boot 集成 Spring AI 主要包含以下步骤：\n\n1. 添加依赖：在 pom.xml 中添加 spring-ai-starter-bom 和相关依赖\n2. 配置 Ollama：在 application.yml 中配置 Ollama 连接信息\n3. 创建 ChatClient：注入 ChatClient Bean 进行对话\n4. 实现 RAG 流程：配置 VectorStore 和 QuestionAnswerAdvisor' }
        ],
        'conv-002': [
            { role: 'user', content: '什么是 RAG？' },
            { role: 'assistant', content: 'RAG（Retrieval-Augmented Generation）是一种结合检索和生成的技术架构。它通过以下方式提升大语言模型的效果：\n\n1. 从外部知识库检索相关信息\n2. 将检索结果作为上下文输入给 LLM\n3. LLM 基于上下文生成更准确的答案\n\n这样可以解决 LLM 知识过时、幻觉等问题。' }
        ],
        'conv-003': [
            { role: 'user', content: 'ChromaDB 和 Milvus 有什么区别？' },
            { role: 'assistant', content: 'ChromaDB 和 Milvus 都是向量数据库，但有一些区别：\n\nChromaDB：\n- 轻量级，易于部署和使用\n- 适合中小规模数据\n- 提供 embedded 模式\n\nMilvus：\n- 分布式架构，支持大规模数据\n- 更高的性能和扩展性\n- 适合企业级应用\n\n对于 Demo 项目，ChromaDB 是更好的选择。' }
        ]
    };

    const mockStreamingResponses = [
        '这是一个模拟的流式响应。RAG（检索增强生成）是一种非常实用的技术...',
        'Spring Boot 是 Java 生态中最流行的框架之一，它简化了企业级应用开发...',
        '向量数据库通过将文本转换为向量表示，实现高效的相似度搜索...',
        'Ollama 是一个本地运行的 LLM 平台，支持多种开源模型...',
        'Chromadb 是一个轻量级的向量数据库，非常适合快速原型开发...'
    ];

    function generateId() {
        return 'conv-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
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

    function loadConversations() {
        conversations = [...mockConversations];
        renderConversationList();
    }

    function renderConversationList() {
        conversationList.innerHTML = '';
        conversations.forEach(conv => {
            const item = document.createElement('div');
            item.className = 'conversation-item' + (conv.id === currentConversationId ? ' active' : '');
            item.innerHTML = `
                <span class="title">${conv.title}</span>
                <button class="delete-btn" data-id="${conv.id}">删除</button>
            `;
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-btn')) {
                    switchConversation(conv.id);
                }
            });
            item.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                showDeleteConfirm(conv.id);
            });
            conversationList.appendChild(item);
        });
    }

    function switchConversation(id) {
        currentConversationId = id;
        const conv = conversations.find(c => c.id === id);
        chatTitle.textContent = conv ? conv.title : '新会话';
        loadMessages(id);
        renderConversationList();
    }

    function loadMessages(conversationId) {
        messages[conversationId] = mockMessages[conversationId] || [];
        renderMessages();
    }

    function renderMessages() {
        if (!currentConversationId) {
            messageContainer.innerHTML = `
                <div class="empty-state">
                    <div class="icon">💬</div>
                    <p>开始对话吧！发送消息开始聊天</p>
                </div>
            `;
            return;
        }

        const msgs = messages[currentConversationId] || [];
        if (msgs.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        messageContainer.innerHTML = msgs.map(msg => `
            <div class="message ${msg.role}">${escapeHtml(msg.content)}</div>
        `).join('');

        messageContainer.scrollTop = messageContainer.scrollHeight;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function createNewConversation() {
        const id = generateId();
        const now = new Date();
        const newConv = {
            id: id,
            title: '新会话',
            updateTime: formatTime(now)
        };
        conversations.unshift(newConv);
        messages[id] = [];
        currentConversationId = id;
        chatTitle.textContent = '新会话';
        renderConversationList();
        renderMessages();
        messageInput.focus();
    }

    function showDeleteConfirm(id) {
        deleteTargetId = id;
        deleteConfirmModal.classList.add('show');
    }

    function hideDeleteConfirm() {
        deleteConfirmModal.classList.remove('show');
        deleteTargetId = null;
    }

    function deleteConversation() {
        if (!deleteTargetId) return;

        conversations = conversations.filter(c => c.id !== deleteTargetId);
        delete messages[deleteTargetId];

        if (currentConversationId === deleteTargetId) {
            currentConversationId = conversations.length > 0 ? conversations[0].id : null;
            if (currentConversationId) {
                switchConversation(currentConversationId);
            } else {
                chatTitle.textContent = '新会话';
                renderMessages();
            }
        }

        renderConversationList();
        hideDeleteConfirm();
        showToast('会话已删除', 'success');
    }

    async function sendMessage() {
        const content = messageInput.value.trim();
        if (!content) return;

        if (!currentConversationId) {
            createNewConversation();
        }

        const userMsg = { role: 'user', content: content };
        if (!messages[currentConversationId]) {
            messages[currentConversationId] = [];
        }
        messages[currentConversationId].push(userMsg);

        const conv = conversations.find(c => c.id === currentConversationId);
        if (conv && conv.title === '新会话') {
            conv.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
            chatTitle.textContent = conv.title;
        }
        conv.updateTime = formatTime(new Date());

        renderMessages();
        messageInput.value = '';
        messageInput.style.height = 'auto';

        sendBtn.disabled = true;

        const typingMsg = document.createElement('div');
        typingMsg.className = 'message assistant typing';
        typingMsg.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
        messageContainer.appendChild(typingMsg);
        messageContainer.scrollTop = messageContainer.scrollHeight;

        await simulateStreamingResponse(content, typingMsg);

        sendBtn.disabled = false;
        messageInput.focus();
    }

    async function simulateStreamingResponse(userMessage, typingElement) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        let responseText = '';
        if (userMessage.includes('Spring') || userMessage.includes('Java')) {
            responseText = 'Spring Boot 是一个非常强大的框架。要集成 Spring AI，你需要：\n\n1. 在 pom.xml 中添加 Spring AI 依赖\n2. 配置 Ollama 或其他 LLM 提供者\n3. 创建 ChatClient Bean\n4. 配置 VectorStore 用于检索\n\n这是一个典型的 RAG 应用架构。';
        } else if (userMessage.includes('RAG') || userMessage.includes('检索')) {
            responseText = 'RAG（Retrieval-Augmented Generation）是一种将检索系统与生成模型相结合的技术。它的主要优势包括：\n\n1. 解决 LLM 知识过时的问题\n2. 减少幻觉，提高答案准确性\n3. 支持最新信息的整合\n4. 可以追溯答案来源\n\n典型的 RAG 流程包括：文档加载 → 文本分割 → 向量化 → 存储到向量数据库 → 检索相关片段 → 增强提示词 → 生成回答。';
        } else if (userMessage.includes('向量') || userMessage.includes('数据库')) {
            responseText = '向量数据库是专门用于存储和检索向量嵌入的数据库。常见的向量数据库包括：\n\n1. ChromaDB - 轻量级，易用性好\n2. Milvus - 分布式架构，适合大规模数据\n3. Pinecone - 云原生，托管服务\n4. Weaviate - 支持混合检索\n\nChromaDB 是一个很好的选择，特别适合开发阶段和小型项目。';
        } else {
            responseText = mockStreamingResponses[Math.floor(Math.random() * mockStreamingResponses.length)];
        }

        typingElement.remove();

        const assistantMsg = { role: 'assistant', content: '' };
        messages[currentConversationId].push(assistantMsg);

        const msgElement = document.createElement('div');
        msgElement.className = 'message assistant';
        messageContainer.appendChild(msgElement);

        for (let i = 0; i < responseText.length; i++) {
            assistantMsg.content += responseText[i];
            msgElement.textContent = assistantMsg.content;
            messageContainer.scrollTop = messageContainer.scrollHeight;
            await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 30));
        }
    }

    function autoResizeTextarea() {
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
    }

    newChatBtn.addEventListener('click', createNewConversation);
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    messageInput.addEventListener('input', autoResizeTextarea);

    document.getElementById('toKnowledgeBtn').addEventListener('click', () => {
        window.location.href = 'knowledge.html';
    });
    document.getElementById('headerToKnowledgeBtn').addEventListener('click', () => {
        window.location.href = 'knowledge.html';
    });

    document.getElementById('closeDeleteModal').addEventListener('click', hideDeleteConfirm);
    document.getElementById('cancelDeleteBtn').addEventListener('click', hideDeleteConfirm);
    document.getElementById('confirmDeleteBtn').addEventListener('click', deleteConversation);
    deleteConfirmModal.addEventListener('click', (e) => {
        if (e.target === deleteConfirmModal) {
            hideDeleteConfirm();
        }
    });

    loadConversations();
    if (conversations.length > 0) {
        switchConversation(conversations[0].id);
    }
})();