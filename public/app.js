const API_URL = 'http://localhost:3000/api';

// Pega os elementos de resultado
const registerResultDiv = document.getElementById('register-result');
const signResultDiv = document.getElementById('sign-result');
const verifyResultDiv = document.getElementById('verify-result');
const listResultDiv = document.getElementById('list-result');
const mySignaturesCard = document.getElementById('my-signatures-card');

// ===== NOVA FUNÇÃO PARA COPIAR TEXTO =====
function copyToClipboard(text, element) {
    // Usa document.execCommand como alternativa para ambientes seguros (como iframes)
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        // Feedback para o usuário
        if (element) {
            const originalIcon = element.innerHTML;
            element.innerHTML = '<i class="fas fa-check text-green-400"></i>';
            setTimeout(() => {
                element.innerHTML = originalIcon;
            }, 2000); // Reset after 2 seconds
        }
    } catch (err) {
        console.error('Erro ao copiar texto: ', err);
    }
    document.body.removeChild(textArea);
}
// ===========================================

function toggleMySignaturesCard() {
    mySignaturesCard.classList.toggle('hidden');
}

function hideAllResults() {
    registerResultDiv.classList.add('hidden');
    signResultDiv.classList.add('hidden');
    verifyResultDiv.classList.add('hidden');
    listResultDiv.classList.add('hidden');
}

async function handleResponse(response) {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro desconhecido do servidor.');
        return data;
    } else {
        const text = await response.text();
        console.error("Resposta inesperada do servidor (não é JSON):", text);
        throw new Error('Ocorreu um erro inesperado no servidor. Verifique o console do terminal do Node.js.');
    }
}

async function registerUser() {
    hideAllResults();
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    try {
        const data = await handleResponse(await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        }));
        registerResultDiv.classList.remove('hidden');
        registerResultDiv.className = 'mt-4 p-4 rounded-lg text-sm bg-green-100 text-green-800 border border-green-200 flex justify-between items-center';
        registerResultDiv.innerHTML = `
            <span>✅ Usuário criado! <strong>Seu User ID é: ${data.userId}</strong></span>
            <button onclick="copyToClipboard('${data.userId}', this)" class="copy-btn">
                <i class="fas fa-copy mr-1"></i> Copiar ID
            </button>`;
    } catch (err) {
        registerResultDiv.classList.remove('hidden');
        registerResultDiv.className = 'mt-4 p-4 rounded-lg text-sm bg-red-100 text-red-800 border border-red-200';
        registerResultDiv.innerText = `❌ Erro: ${err.message}`;
    }
}

async function signText() {
    hideAllResults();
    const userId = document.getElementById('sign-userid').value;
    const textToSign = document.getElementById('text-to-sign').value;
    try {
        const data = await handleResponse(await fetch(`${API_URL}/sign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: parseInt(userId), textToSign })
        }));
        signResultDiv.classList.remove('hidden');
        signResultDiv.className = 'mt-4 p-4 rounded-lg text-sm bg-green-100 text-green-800 border border-green-200 flex justify-between items-center';
        signResultDiv.innerHTML = `
            <span>✅ Texto assinado! <strong>ID da Assinatura:</strong> ${data.signatureId.substring(0,15)}...</span>
            <button onclick="copyToClipboard('${data.signatureId}', this)" class="copy-btn">
                <i class="fas fa-copy mr-1"></i> Copiar ID
            </button>`;
    } catch (err) {
        signResultDiv.classList.remove('hidden');
        signResultDiv.className = 'mt-4 p-4 rounded-lg text-sm bg-red-100 text-red-800 border border-red-200';
        signResultDiv.innerText = `❌ Erro: ${err.message}`;
    }
}

async function verifySignature() {
    hideAllResults();
    const signatureId = document.getElementById('verify-id').value;
    if (!signatureId) return;
    try {
        const data = await handleResponse(await fetch(`${API_URL}/verify/${signatureId}`));
        verifyResultDiv.classList.remove('hidden');
        if (data.status === 'VÁLIDA') {
            const localDate = new Date(data.signed_at + 'Z').toLocaleString('pt-BR');
            verifyResultDiv.className = 'mt-4 p-4 rounded-lg text-sm bg-green-100 text-green-800 border border-green-200';
            verifyResultDiv.innerHTML = `<strong>✅ Assinatura VÁLIDA</strong><br>Signatário: ${data.signatory}<br>Data: ${localDate}`;
        } else {
            verifyResultDiv.className = 'mt-4 p-4 rounded-lg text-sm bg-red-100 text-red-800 border border-red-200';
            verifyResultDiv.innerText = '❌ Assinatura INVÁLIDA';
        }
    } catch (err) {
        verifyResultDiv.classList.remove('hidden');
        verifyResultDiv.className = 'mt-4 p-4 rounded-lg text-sm bg-red-100 text-red-800 border border-red-200';
        verifyResultDiv.innerText = `❌ Erro: ${err.message}`;
    }
}

async function listUserSignatures() {
    registerResultDiv.classList.add('hidden');
    signResultDiv.classList.add('hidden');
    verifyResultDiv.classList.add('hidden');

    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;
    
    try {
        const signatures = await handleResponse(await fetch(`${API_URL}/user/signatures`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        }));

        listResultDiv.classList.remove('hidden');
        
        if (signatures.length === 0) {
            listResultDiv.className = 'mt-4 p-4 rounded-lg text-sm bg-blue-100 text-blue-800 border border-blue-200';
            listResultDiv.innerHTML = `<p class="text-center">Nenhuma assinatura encontrada para este usuário.</p>`;
            return;
        }

        let tableHTML = `<table class="signatures-table"><thead><tr><th>Texto Original</th><th>ID da Assinatura</th><th>Data</th></tr></thead><tbody>`;

        signatures.forEach(sig => {
            const shortText = sig.original_text.length > 30 ? sig.original_text.substring(0, 30) + '...' : sig.original_text;
            const localDate = new Date(sig.created_at + 'Z').toLocaleString('pt-BR');
            tableHTML += `<tr>
                            <td class="text-slate-300">${shortText}</td>
                            <td class="flex items-center">
                                <span>${sig.id.substring(0, 8)}...</span>
                                <button onclick="copyToClipboard('${sig.id}', this)" class="copy-btn-table" title="Copiar ID Completo">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </td>
                            <td>${localDate}</td>
                          </tr>`;
        });

        tableHTML += `</tbody></table>`;
        listResultDiv.className = 'mt-4';
        listResultDiv.innerHTML = tableHTML;

    } catch (err) {
        listResultDiv.classList.remove('hidden');
        listResultDiv.className = 'mt-4 p-4 rounded-lg text-sm bg-red-100 text-red-800 border border-red-200';
        listResultDiv.innerText = `❌ Erro: ${err.message}`;
    }
}
