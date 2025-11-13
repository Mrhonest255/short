// Global variables
let currentShortCode = '';

// Form submission handler
document.getElementById('shortenForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const originalUrl = document.getElementById('originalUrl').value;
    const customAlias = document.getElementById('customAlias').value;
    const password = document.getElementById('password').value;
    const expiresIn = document.getElementById('expiresIn').value;

    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<span class="loading"></span> Creating...';
    submitButton.disabled = true;

    try {
        const response = await fetch('/api/shorten', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: originalUrl,
                customAlias: customAlias || undefined,
                password: password || undefined,
                expiresIn: expiresIn ? parseInt(expiresIn) : undefined,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            currentShortCode = data.shortCode;
            displayResult(data);
            showNotification('URL shortened successfully! 🎉', 'success');
            e.target.reset();
        } else {
            showNotification(data.error || 'Failed to shorten URL', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Network error. Please try again.', 'error');
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
});

// Display result
function displayResult(data) {
    const resultCard = document.getElementById('result');
    const shortUrlInput = document.getElementById('shortUrl');
    const qrCodeImg = document.getElementById('qrCode');

    shortUrlInput.value = data.shortUrl;
    
    // Load QR code
    fetch(data.qrCode)
        .then(res => res.json())
        .then(qrData => {
            qrCodeImg.src = qrData.qrCode;
        })
        .catch(err => {
            console.error('Failed to load QR code:', err);
        });

    resultCard.style.display = 'block';
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Re-attach event listeners for the newly displayed buttons
    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
        copyBtn.onclick = copyToClipboard;
    }

    const downloadQRBtn = document.getElementById('downloadQRBtn');
    if (downloadQRBtn) {
        downloadQRBtn.onclick = downloadQR;
    }

    const viewStatsBtn = document.getElementById('viewStatsBtn');
    if (viewStatsBtn) {
        viewStatsBtn.onclick = viewStats;
    }
}

// Copy to clipboard
function copyToClipboard() {
    const shortUrlInput = document.getElementById('shortUrl');
    shortUrlInput.select();
    document.execCommand('copy');
    
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '✓ Copied!';
    
    setTimeout(() => {
        btn.innerHTML = originalText;
    }, 2000);
    
    showNotification('URL copied to clipboard! 📋', 'success');
}

// Download QR code
function downloadQR() {
    const qrCodeImg = document.getElementById('qrCode');
    const link = document.createElement('a');
    link.download = `qr-${currentShortCode}.png`;
    link.href = qrCodeImg.src;
    link.click();
    
    showNotification('QR code downloaded! 💾', 'success');
}

// View statistics
async function viewStats() {
    const statsCard = document.getElementById('stats');
    const statsContent = document.getElementById('statsContent');
    
    statsContent.innerHTML = '<div class="loading"></div> Loading statistics...';
    statsCard.style.display = 'block';
    statsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    try {
        const response = await fetch(`/api/stats/${currentShortCode}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        const data = await response.json();

        if (response.ok) {
            displayStats(data);
        } else {
            statsContent.innerHTML = `<p style="color: var(--danger-color);">${data.error}</p>`;
        }
    } catch (error) {
        console.error('Error:', error);
        statsContent.innerHTML = '<p style="color: var(--danger-color);">Failed to load statistics</p>';
    }
}

// Display statistics
function displayStats(data) {
    const statsContent = document.getElementById('statsContent');
    
    const createdDate = new Date(data.createdAt).toLocaleString();
    const lastAccessedDate = data.lastAccessed ? new Date(data.lastAccessed).toLocaleString() : 'Never';
    const expiresDate = data.expiresAt ? new Date(data.expiresAt).toLocaleString() : 'Never';

    let html = `
        <div class="stat-item">
            <span class="stat-label">Original URL:</span>
            <span class="stat-value">${truncateUrl(data.originalUrl, 40)}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Short Code:</span>
            <span class="stat-value">${data.shortCode}</span>
        </div>
        ${data.customAlias ? `
        <div class="stat-item">
            <span class="stat-label">Custom Alias:</span>
            <span class="stat-value">${data.customAlias}</span>
        </div>
        ` : ''}
        <div class="stat-item">
            <span class="stat-label">Total Clicks:</span>
            <span class="stat-value">${data.clickCount}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Created:</span>
            <span class="stat-value">${createdDate}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Last Accessed:</span>
            <span class="stat-value">${lastAccessedDate}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Expires:</span>
            <span class="stat-value">${expiresDate}</span>
        </div>
    `;

    if (data.recentClicks && data.recentClicks.length > 0) {
        html += `
            <div class="click-history">
                <h3>Recent Clicks</h3>
                ${data.recentClicks.slice(0, 10).map(click => `
                    <div class="click-item">
                        ${new Date(click.clicked_at).toLocaleString()}
                        ${click.referer ? ` - From: ${truncateUrl(click.referer, 30)}` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    statsContent.innerHTML = html;
}

// Hide statistics
function hideStats() {
    const statsCard = document.getElementById('stats');
    statsCard.style.display = 'none';
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type === 'error' ? 'error' : ''}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Truncate URL helper
function truncateUrl(url, maxLength) {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Add smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Add event listeners for buttons
    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', copyToClipboard);
    }

    const downloadQRBtn = document.getElementById('downloadQRBtn');
    if (downloadQRBtn) {
        downloadQRBtn.addEventListener('click', downloadQR);
    }

    const viewStatsBtn = document.getElementById('viewStatsBtn');
    if (viewStatsBtn) {
        viewStatsBtn.addEventListener('click', viewStats);
    }

    const closeStatsBtn = document.getElementById('closeStatsBtn');
    if (closeStatsBtn) {
        closeStatsBtn.addEventListener('click', hideStats);
    }
});
