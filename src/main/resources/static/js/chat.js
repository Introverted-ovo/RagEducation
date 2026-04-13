(function() {
    const API_BASE = 'http://localhost:8080/api';

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
        fetch(API_BASE + '/conversations')
            .then(res => res.json())
            .then(data => {
                conversations = data.map(conv => ({
                    id: conv.conversationId,
                    title: conv.title || '新会话',
                    updateTime: conv.updateTime || ''
                }));
                Promise.all(conversations.map(conv =>
                    fetch(API_BASE + '/conversations/' + conv.id + '/messages')
                        .then(res => res.json())
                        .then(data => {
                            messages[conv.id] = data.map(msg => ({
                                role: msg.role,
                                content: msg.content
                            }));
                        })
                        .catch(() => {
                            messages[conv.id] = [];
                        })
                )).then(() => {
                    renderConversationList();
                    if (conversations.length > 0) {
                        switchConversation(conversations[0].id);
                    }
                });
            })
            .catch(err => {
                console.error('Failed to load conversations:', err);
                showToast('加载会话列表失败', 'error');
            });
    }

    function renderConversationList() {
        conversationList.innerHTML = '';
        conversations.forEach(conv => {
            let displayTitle = conv.title;
            if (displayTitle === '新会话' && messages[conv.id] && messages[conv.id].length > 0) {
                displayTitle = messages[conv.id][0].content.substring(0, 30) + (messages[conv.id][0].content.length > 30 ? '...' : '');
            }
            const item = document.createElement('div');
            item.className = 'conversation-item' + (conv.id === currentConversationId ? ' active' : '');
            item.innerHTML = `
                <span class="title">${escapeHtml(displayTitle)}</span>
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
        messages[id] = [];
        emptyState.style.display = 'block';
        messageContainer.innerHTML = '';
        loadMessages(id);
        renderConversationList();
    }

    function loadMessages(conversationId) {
        fetch(API_BASE + '/conversations/' + conversationId + '/messages')
            .then(res => res.json())
            .then(data => {
                messages[conversationId] = data.map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));
                renderMessages();
                renderConversationList();
            })
            .catch(err => {
                console.error('Failed to load messages:', err);
                messages[conversationId] = [];
                renderMessages();
                renderConversationList();
            });
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
        fetch(API_BASE + '/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: '新会话' })
        })
        .then(res => res.json())
        .then(data => {
            const id = data.conversationId;
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
        })
        .catch(err => {
            console.error('Failed to create conversation:', err);
            showToast('创建会话失败', 'error');
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

    function deleteConversation() {
        if (!deleteTargetId) return;

        fetch(API_BASE + '/conversations/' + deleteTargetId, { method: 'DELETE' })
            .then(() => {
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
            })
            .catch(err => {
                console.error('Failed to delete conversation:', err);
                showToast('删除会话失败', 'error');
            });
    }

    async function sendMessage() {
        const content = messageInput.value.trim();
        if (!content) return;

        if (!currentConversationId) {
            await createNewConversationAsync();
        }

        const userMsg = { role: 'user', content: content };
        if (!messages[currentConversationId]) {
            messages[currentConversationId] = [];
        }
        messages[currentConversationId].push(userMsg);

        const conv = conversations.find(c => c.id === currentConversationId);
        if (conv && conv.title === '新会话') {
            const newTitle = content.substring(0, 30) + (content.length > 30 ? '...' : '');
            conv.title = newTitle;
            chatTitle.textContent = newTitle;
            fetch(API_BASE + '/conversations/' + currentConversationId, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle })
            });
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

        await fetchStreamingResponse(content, typingMsg);

        sendBtn.disabled = false;
        messageInput.focus();
    }

    function createNewConversationAsync() {
        return fetch(API_BASE + '/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: '新会话' })
        })
        .then(res => res.json())
        .then(data => {
            const id = data.conversationId;
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
        });
    }

    async function fetchStreamingResponse(userMessage, typingElement) {
        typingElement.remove();

        const assistantMsg = { role: 'assistant', content: '' };
        messages[currentConversationId].push(assistantMsg);

        const msgElement = document.createElement('div');
        msgElement.className = 'message assistant';
        messageContainer.appendChild(msgElement);

        try {
            const response = await fetch(API_BASE + '/chat/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    conversationId: currentConversationId
                })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                assistantMsg.content += chunk;
                msgElement.textContent = assistantMsg.content;
                messageContainer.scrollTop = messageContainer.scrollHeight;
            }
        } catch (err) {
            console.error('Streaming error:', err);
            msgElement.textContent = '抱歉，发生了错误，请重试。';
            showToast('消息发送失败', 'error');
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