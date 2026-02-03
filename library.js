document.addEventListener('DOMContentLoaded', () => {
    loadAssets();
    setupViewToggle();
});

function setupViewToggle() {
    const grid = document.getElementById('grid');
    const btnGrid = document.getElementById('viewGrid');
    const btnList = document.getElementById('viewList');

    // Load saved preference
    chrome.storage.local.get(['viewMode'], (result) => {
        if (result.viewMode === 'list') {
            setListView();
        }
    });

    btnGrid.addEventListener('click', () => {
        grid.classList.remove('list-view');
        btnGrid.classList.add('active');
        btnList.classList.remove('active');
        chrome.storage.local.set({ viewMode: 'grid' });
    });

    btnList.addEventListener('click', () => {
        setListView();
        chrome.storage.local.set({ viewMode: 'list' });
    });

    function setListView() {
        grid.classList.add('list-view');
        btnList.classList.add('active');
        btnGrid.classList.remove('active');
    }
}

function loadAssets() {
    chrome.storage.local.get(['assets'], (result) => {
        const grid = document.getElementById('grid');
        grid.innerHTML = ''; // Clear current
        const assets = result.assets || [];

        if (assets.length === 0) {
            grid.innerHTML = '<p style="text-align:center; width:100%;">No assets saved yet.</p>';
            return;
        }

        assets.forEach((asset, index) => {
            const card = document.createElement('div');
            card.className = 'card';

            const priceHtml = asset.price ? `
            <span class="price-tag">
                ${asset.originalPrice ? `<span class="price-original">${asset.originalPrice}</span>` : ''}
                ${asset.price}
            </span>` : '';

            const filesHtml = (asset.files && asset.files.length > 0) ?
                `<span class="files-tag">${asset.files.length} Files</span>` : '';

            card.innerHTML = `
        <img src="${asset.img}" loading="lazy">
        <div class="card-content">
          <h3 class="card-title" title="${asset.title}">${asset.title}</h3>
          <div class="card-meta">
            ${priceHtml}
            ${filesHtml}
          </div>
          <div class="btn-group">
            <a href="${asset.url}" target="_blank" class="btn btn-visit">Visit</a>
            <div class="btn btn-delete" data-url="${asset.url}">Remove</div>
          </div>
        </div>
      `;

            grid.appendChild(card);
        });

        // Add delete listeners
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                deleteAsset(e.target.dataset.url);
            });
        });
    });
}

function deleteAsset(url) {
    chrome.storage.local.get(['assets'], (result) => {
        const newAssets = result.assets.filter(a => a.url !== url);
        chrome.storage.local.set({ assets: newAssets }, loadAssets);
    });
}