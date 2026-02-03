document.addEventListener('DOMContentLoaded', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const saveBtn = document.getElementById('saveBtn');
    const warning = document.getElementById('warning');

    if (tab.url && tab.url.includes('itch.io')) {
        // Check if it's a valid asset page (has .view_game_page)
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => !!document.querySelector('.view_game_page')
        }, (results) => {
            if (results && results[0] && results[0].result) {
                saveBtn.style.display = 'block';
                warning.style.display = 'none';
            } else {
                saveBtn.style.display = 'none';
                warning.style.display = 'block';
                warning.textContent = "Not an asset page";
            }
        });
    } else {
        saveBtn.style.display = 'none';
        warning.style.display = 'block';
        // warning.textContent is likely "Not an itch.io page" by default in HTML
    }
});

document.getElementById('openLib').addEventListener('click', () => {
    chrome.tabs.create({ url: 'library.html' });
});

document.getElementById('saveBtn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Execute script on the page to get details
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: getPageDetails,
    }, (results) => {
        if (results && results[0] && results[0].result) {
            saveData(results[0].result);
        }
    });
});

// This function runs INSIDE the web page
function getPageDetails() {
    const ogImage = document.querySelector('meta[property="og:image"]');
    const title = document.title.replace(' by ', ' | ').split('|')[0].trim(); // Cleaner title

    // Extract Price
    const priceEl = document.querySelector('.buy_message .dollars[itemprop="price"]');
    const originalPriceEl = document.querySelector('.buy_message .dollars.original_price');
    let price = priceEl ? priceEl.innerText : null;
    const originalPrice = originalPriceEl ? originalPriceEl.innerText : null;

    // Fallback: Check for minimum price on files (e.g. free demo + paid full version)
    if (!price) {
        const minPriceEl = document.querySelector('.file_price');
        if (minPriceEl) {
            price = 'From ' + minPriceEl.innerText;
        } else {
            price = 'Free';
        }
    }

    // Extract Files
    const files = [];
    document.querySelectorAll('.upload_name').forEach(el => {
        const name = el.querySelector('.name')?.textContent.trim();
        const size = el.querySelector('.file_size')?.textContent.trim();
        if (name) files.push({ name, size: size || '' });
    });

    return {
        title: title || document.title,
        url: window.location.href,
        img: ogImage ? ogImage.content : 'https://placehold.co/600x400?text=No+Preview',
        price,
        originalPrice,
        files
    };
}

// Save to Chrome Local Storage
function saveData(asset) {
    chrome.storage.local.get(['assets'], (result) => {
        const assets = result.assets || [];

        // Avoid duplicates
        if (!assets.some(a => a.url === asset.url)) {
            assets.unshift(asset); // Add to top of list
            chrome.storage.local.set({ assets: assets }, () => {
                const status = document.getElementById('status');
                status.textContent = "Saved!";
                setTimeout(() => status.textContent = "", 2000);
            });
        } else {
            document.getElementById('status').textContent = "Already saved!";
        }
    });
}