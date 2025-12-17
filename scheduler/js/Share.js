let sharedTrip = [];
let last_date = "";

function openShareNotification(token) {
    const modal = document.getElementById('share-notification-modal');
    const tokenDisplay = document.getElementById('share-token-display');

    tokenDisplay.textContent = token || 'NO-TOKEN';
    modal.classList.remove('hidden');

    // Use a short timeout to allow the display property to apply before transitioning
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function closeShareNotification(keepTracking = false) {
    const modal = document.getElementById('share-notification-modal');
    modal.classList.remove('show');
    if (!keepTracking) {
        sharedTrip = [];
        last_date = "";
    }

    // 等待動畫結束後再隱藏元素
    // 此處時間應與 CSS transition duration 一致 (0.3s = 300ms)
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

function shareToken() {
    const tokenDisplay = document.getElementById('share-token-display');
    const token = tokenDisplay.textContent;

    shareText(token);
}

function copyShareToken() {
    const tokenDisplay = document.getElementById('share-token-display');
    const token = tokenDisplay.textContent;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(token).then(() => {
            showNotification(`已複製！`);
        }).catch(err => {
            console.error('Could not copy text: ', err);
            showNotification('複製失敗！');
        });
    } else {
        // Fallback for older browsers
        try {
            const textArea = document.createElement("textarea");
            textArea.value = token;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification(`已複製！`);
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
            showNotification('複製失敗！');
        }
    }
}

function shareTrip(dateString) {
    closeShareNotification(true);
    let schedule = createDayData(dateString);

    for (const trip of sharedTrip) {
        if (trip.date === dateString) {
            showNotification(`重複的行程！`);
            last_date = dateString;
            return;
        }
    }
    // console.log(last_date && isDayOffsetByOne(dateString, last_date));
    if (last_date && isDayOffsetByOne(dateString, last_date)) {
        sharedTrip.push(schedule);
        showNotification("正在串接分享碼");
        getToken(JSON.stringify(sharedTrip), token => {
            openShareNotification(token);
            showNotification(`已串接分享碼！`);
        });
    } else {
        sharedTrip = [schedule];
        showNotification("正在產生分享碼");
        getToken(JSON.stringify(sharedTrip), token => {
            openShareNotification(token);
            showNotification(`已產生分享碼！`);
        });
    }
    last_date = dateString;
}

let import_cache = undefined;

function readImportingTrips(link) {
    let data = link.split("\n");
    let progress = 0;
    let total = 0;
    import_cache = [];
    for (const line of data) {
        if (line.startsWith("API=")) {
            setAPIKey(line.substring(4));
            showNotification("成功設定API Key！");
        } else if (line.startsWith("GEMINI=")) {
            setGeminiApiKey(line.substring(7));
            showNotification("成功設定Gemini！");
        } else if (line.startsWith("OPENAI=")) {
            setOpenAIApiKey(line.substring(7));
            showNotification("成功設定OpenAI！");
        } else {
            total++;
            showNotification("讀取資料中...");
            getText(line, d => {
                let segment = parseDataFromJSON(JSON.parse(d));
                import_cache.push(...segment);
                progress++;
                if (progress === total) {
                    showNotification("資料讀取完畢！");
                    openImportWindow(import_cache);
                }
            });
        }
    }
}

function importTrips() {
    if (import_cache === undefined) return;
    for (const imp of import_cache) {
        let sim = createDayData(imp.date);
        sim.stops = imp.stops;
        updateDayBlock(sim);
    }
    import_cache = undefined;
    showNotification("已成功匯入資料");
}

// function getToken(text, handle) {
//     fetch("https://api.myjson.online/v2/records", {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//             "x-collection-access-token": "8c8b32d1-d15f-4bf9-a8be-fc2f862101ea",
//             "Accept": "*/*"
//         },
//         body: JSON.stringify({
//             collectionId: "608b69ea-bbda-4232-938b-feb3073f118e",
//             data: { text },
//             metadata: true
//         })
//     }).then(res => res.json()).then(data => {
//         handle(data.id);
//     });
// }

function getToken(text, handle) {
    fetch("https://hastebin.com/documents", {
        method: "POST",
        body: text,
        headers: {
            "Content-Type": "text/plain",
            "Authorization": 'Bearer 891f599a02cb82fc2323e189b9e69f37659a6c6f38e34ee87f0da664b6684f6df23db08a0809f2b8bdf069c57dfb5c68e799211d26aff58fefb082076917855f'
        }
    }).then(res => res.json()).then(data => {
        console.log(data)
        handle(data.key);
    });
}

// function getText(token, handle) {
//     fetch("https://api.myjson.online/v2/records/" + token, {
//         headers: { "x-collection-access-token": "8c8b32d1-d15f-4bf9-a8be-fc2f862101ea" }
//     }).then(res => res.json()).then(data => {
//         handle(data.data.text);
//     });
// }

function getText(token, handle) {
    fetch("https://hastebin.com/raw/" + token, {
        method: "GET",
        headers: {
            "Content-Type": "text/plain",
            "Authorization": 'Bearer 891f599a02cb82fc2323e189b9e69f37659a6c6f38e34ee87f0da664b6684f6df23db08a0809f2b8bdf069c57dfb5c68e799211d26aff58fefb082076917855f'
        }
    }).then(res => res.text()).then(data => {
        handle(data);
    });
}

function shareText(text) {
    if (navigator.share) {
        navigator.share({
            text: text
        }).catch(err => {
            console.warn("使用者取消或分享失敗：", err);
        });
    } else {
        showNotification("此瀏覽器不支援分享功能");
    }
}

// --- Image Export Functionality ---
/**
 * Main function to generate and pack the image for a given date.
 * @param {string} date - The date string in 'YYYY-MM-DD' format.
 */
async function packImage(date) {
    const tripData = createDayData(date);
    showNotification('正在產生圖片...');

    try {
        // 1. Create an off-screen container for rendering the landscape image
        const exportContainer = document.createElement('div');
        exportContainer.style.position = 'absolute';
        exportContainer.style.left = '-9999px';
        exportContainer.style.top = '0';
        exportContainer.style.width = '800px';
        exportContainer.style.height = 'auto';
        exportContainer.style.minHeight = '630px';
        exportContainer.style.backgroundColor = '#F9FAFB'; // bg-gray-50
        exportContainer.style.padding = '40px';
        exportContainer.style.fontFamily = 'sans-serif';
        exportContainer.style.boxSizing = 'border-box';
        document.body.appendChild(exportContainer);

        // 2. Clone the content into the export container with proper styling
        const dayOfWeek = formatDate(date); //new Date(date).toLocaleDateString('zh-TW', { weekday: 'long' });

        let contentHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #E5E7EB; padding-bottom: 16px; margin-bottom: 24px;">
                    <h1 style="font-size: 36px; font-weight: bold; color: #1F2937;">${formatDate(date)}</h1>
                </div>
                <div>
            `;

        if (tripData && tripData.stops.length > 0) {
            // MODIFIED: Changed to a standard list
            contentHTML += '<ul style="list-style: none; padding: 0;">';
            for (let i = 0; i < tripData.stops.length; i++) {
                let stop = tripData.stops[i];
                const hasTravelInfo = (i !== (tripData.stops.length - 1)) && (tripData.stops[i+1].distance || tripData.stops[i+1].duration);
                contentHTML += `
                        <li style="display: flex; align-items: flex-start; margin-bottom: 20px;">
                            <div style="text-align: right; width: 100px; margin-right: 20px; flex-shrink: 0;">
                                <p style="font-weight: bold; font-size: 18px; color: #EC4899;">${stop.time.replaceAll('-', '-\n')}</p>
                            </div>
                            <div style="border-left: 2px solid #D1D5DB; padding-left: 18px; flex-grow: 1;">
                                <h2 style="font-size: 22px; font-weight: bold; color: #111827;">${stop.image} ${stop.display_text}</h2>
                                <p style="font-size: 16px; color: #4B5563; margin-top: 4px; margin-bottom: 15px">${stop.description || ''}</p>
                                <div style="margin-bottom: 8px; font-size: 14px; color: #6B7280; display: flex; align-items: center; gap: 12px;">
                                ${hasTravelInfo ? `
                                    <span>${tripData.stops[i+1].distance ? `🚗 ${tripData.stops[i+1].distance}` : ''}</span>
                                    <span>${tripData.stops[i+1].duration ? `⏱️ ${tripData.stops[i+1].duration}` : ''}</span>
                                ` : ''}
                                </div>
                            </div>
                        </li>
                    `;
            }
            contentHTML += '</ul>';
        } else {
            contentHTML += `<p style="font-size: 20px; color: #6B7280; text-align: center; margin-top: 40px;">這天沒有安排行程。</p>`;
        }
        contentHTML += `</div>`;
        exportContainer.innerHTML = contentHTML;

        // 3. Use html2canvas to generate the image
        const canvas = await html2canvas(exportContainer, {
            useCORS: true,
            scale: 2, // Higher scale for better resolution
            backgroundColor: null // Use the container's background
        });

        // 4. Convert canvas to JPG data URL
        const imageDataUrl = canvas.toDataURL('image/png', 0.9);
        const blob = await (await fetch(imageDataUrl)).blob();

        // 5. Store the generated image data
        currentImage = {
            dataUrl: imageDataUrl,
            blob: blob,
            date: date
        };

        // 6. Clean up the off-screen container
        document.body.removeChild(exportContainer);

        // 7. Show the export modal with the preview
        const modal = document.getElementById('image-export-modal');
        const imgPreview = document.getElementById('exported-image-preview');
        imgPreview.src = imageDataUrl;
        modal.classList.remove('hidden');

    } catch (error) {
        showNotification('圖片產生失敗');
        console.log(error)
    }
}

function closeImageExportModal() {
    document.getElementById('image-export-modal').classList.add('hidden');
    // Clear message and image data
    document.getElementById('image-export-message').classList.add('hidden');
    document.getElementById('exported-image-preview').src = '';
    currentImage = { dataUrl: null, blob: null, date: null };
}

function showImageExportMessage(message, isError = false) {
    const msgEl = document.getElementById('image-export-message');
    msgEl.textContent = message;
    msgEl.style.color = isError ? '#DC2626' : '#059669'; // red-600 or green-600
    msgEl.classList.remove('hidden');
    setTimeout(() => msgEl.classList.add('hidden'), 3000);
}

async function shareCurrentImage() {
    if (!currentImage.blob) return;
    const file = new File([currentImage.blob], `行程-${currentImage.date}.png`, { type: 'image/png' });
    const shareData = {
        files: [file],
        title: `我的行程 - ${currentImage.date}`,
        text: `快來看看我 ${currentImage.date} 的精彩行程！`,
    };

    if (navigator.canShare && navigator.canShare(shareData)) {
        try {
            await navigator.share(shareData);
            showNotification('分享成功！');
        } catch (err) {
            if (err.name !== 'AbortError') {
                showNotification('分享失敗');
            }
        }
    } else {
        showNotification('您的瀏覽器不支援分享檔案功能。');
    }
}

async function copyCurrentImage() {
    if (!currentImage.blob) return;
    try {
        if (!navigator.clipboard.write) {
            throw new Error("Clipboard API not available.");
        }
        await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': currentImage.blob })
        ]);
        showNotification('圖片已複製！');
    } catch (err) {
        console.error('Copy failed:', err);
        showNotification('複製失敗');
    }
}

function downloadCurrentImage() {
    if (!currentImage.dataUrl) return;
    const link = document.createElement('a');
    link.href = currentImage.dataUrl;
    link.download = `行程-${currentImage.date}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('下載已開始！');
}