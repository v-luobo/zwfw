document.addEventListener('DOMContentLoaded', function() {
    // 初始化关闭所有主事项
    document.querySelectorAll('.main-item-header').forEach(header => {
        header.nextElementSibling.style.maxHeight = '0px';
        header.querySelector('.arrow').classList.remove('rotate');
    });
    
    loadData();
    
    // 添加刷新按钮的点击事件
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('refresh-button')) {
            loadData();
        }
        
        // 添加导航按钮点击事件
        if (e.target && e.target.classList.contains('nav-button')) {
            const action = e.target.dataset.action;
            if (action === 'back') {
                window.history.back();
            } else if (action === 'forward') {
                window.history.forward();
            }
        }
    });
});

// 添加导航按钮
function setupNavigation() {
    const navContainer = document.createElement('div');
    navContainer.className = 'nav-buttons';
    
    const backButton = document.createElement('button');
    backButton.className = 'nav-button';
    backButton.textContent = '返回';
    backButton.dataset.action = 'back';
    
    const forwardButton = document.createElement('button');
    forwardButton.className = 'nav-button';
    forwardButton.textContent = '前进';
    forwardButton.dataset.action = 'forward';
    
    navContainer.appendChild(backButton);
    navContainer.appendChild(forwardButton);
    document.body.appendChild(navContainer);
}

function loadData() {
    try {
        // 使用全局变量中的数据
        if (typeof bszlData !== 'undefined') {
            // 保存原始数据
            window.originalData = bszlData;
            // 渲染数据
            renderData(bszlData);
            // 设置搜索功能
            setupSearch();
        } else {
            throw new Error('未找到数据');
        }
    } catch (error) {
        console.error('加载数据失败:', error);
        document.getElementById('dataContainer').innerHTML = 
            `<div class="no-results">
                <p>加载数据失败: ${error.message}</p>
                <button class="refresh-button">点击刷新重试</button>
            </div>`;
    }
}

function renderData(data) {
    const container = document.getElementById('dataContainer');
    container.innerHTML = '';
    
    data.forEach(dept => {
        const deptElement = document.createElement('div');
        deptElement.className = 'department';
        
        // 部门标题
        const deptHeader = document.createElement('div');
        deptHeader.className = 'department-header';
        deptHeader.innerHTML = `
            <span>${dept.department}</span>
            <span class="arrow">▼</span>
        `;
        
        // 部门内容容器
        const deptContent = document.createElement('div');
        deptContent.className = 'department-content';
        
        // 添加主事项
        dept.items.forEach(mainItem => {
            const mainItemElement = document.createElement('div');
            mainItemElement.className = 'main-item';
            
            // 判断是否为"未分类"
            const isUncategorized = mainItem.main_item === '未分类';
            
            if (isUncategorized) {
                // 如果是未分类，直接将子项添加到部门内容容器中
                mainItem.sub_items.forEach(subItem => {
                    const subItemElement = document.createElement('div');
                    subItemElement.className = 'sub-item uncategorized-item';
                    
                    let subItemContent = `<span>${subItem.name}</span>`;
                    
                    subItemElement.innerHTML = subItemContent;
                    subItemElement.dataset.link = subItem.link || '';
                    subItemElement.dataset.qrcode = subItem.qrcode || '';
                    subItemElement.dataset.name = subItem.name || '';
                    
                    // 添加点击事件，显示二维码
                    subItemElement.addEventListener('click', function() {
                        showQRCode(this.dataset.link, this.dataset.name);
                    });
                    
                    deptContent.appendChild(subItemElement);
                });
            } else {
                // 主事项标题
                const mainItemHeader = document.createElement('div');
                mainItemHeader.className = 'main-item-header';
                mainItemHeader.innerHTML = `
                    <span>${mainItem.main_item}</span>
                    <span class="arrow">▼</span>
                `;
                mainItemElement.appendChild(mainItemHeader);
                
                // 点击主事项标题展开/折叠
                mainItemHeader.addEventListener('click', function() {
                    toggleMainItem(this);
                });
                
                // 主事项内容容器
                const mainItemContent = document.createElement('div');
                mainItemContent.className = 'main-item-content';
                
                // 添加子事项
                mainItem.sub_items.forEach(subItem => {
                    const subItemElement = document.createElement('div');
                    subItemElement.className = 'sub-item';
                    
                    let subItemContent = `<span>${subItem.name}</span>`;
                    
                    subItemElement.innerHTML = subItemContent;
                    subItemElement.dataset.link = subItem.link || '';
                    subItemElement.dataset.qrcode = subItem.qrcode || '';
                    subItemElement.dataset.name = subItem.name || '';
                    
                    // 添加点击事件，显示二维码
                    subItemElement.addEventListener('click', function() {
                        showQRCode(this.dataset.link, this.dataset.name);
                    });
                    
                    mainItemContent.appendChild(subItemElement);
                });
                
                mainItemElement.appendChild(mainItemContent);
                deptContent.appendChild(mainItemElement);
            }
        });
        
        deptElement.appendChild(deptHeader);
        deptElement.appendChild(deptContent);
        container.appendChild(deptElement);
        
        // 点击部门标题展开/折叠
        deptHeader.addEventListener('click', function() {
            toggleDepartment(this);
        });
    });
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.trim().toLowerCase();
        
        if (searchTerm === '') {
            // 如果搜索框为空，显示原始数据
            renderData(window.originalData);
            document.getElementById('noResults').classList.add('hidden');
            return;
        }
        
        // 过滤数据
        const filteredData = filterData(window.originalData, searchTerm);
        
        if (filteredData.length === 0) {
            // 没有结果
            document.getElementById('dataContainer').innerHTML = '';
            document.getElementById('noResults').classList.remove('hidden');
        } else {
            // 显示过滤后的结果
            document.getElementById('noResults').classList.add('hidden');
            renderData(filteredData);
            
            // 高亮匹配的文本
            highlightSearchTerm(searchTerm);
            
            // 自动展开包含搜索结果的部门和主事项
            expandSearchResults();
        }
    });
}

function filterData(data, searchTerm) {
    // 将搜索词拆分为单个字符
    const keywords = searchTerm.split('').filter(char => char.trim().length > 0);
    
    return data.filter(dept => {
        // 创建部门的副本
        const deptCopy = { ...dept, items: [] };
        
        // 过滤主事项
        dept.items.forEach(mainItem => {
            // 创建主事项的副本
            const mainItemCopy = { ...mainItem, sub_items: [] };
            
            // 检查主事项名称是否包含所有关键字
            const mainItemText = mainItem.main_item.toLowerCase();
            const mainItemMatches = keywords.every(keyword => mainItemText.includes(keyword));
            
            // 过滤子事项 - 包含所有关键字的事项
            const filteredSubItems = mainItem.sub_items.filter(subItem => {
                const subItemText = subItem.name.toLowerCase();
                return keywords.every(keyword => subItemText.includes(keyword));
            });
            
            // 如果主事项名称包含所有关键字，保留所有子事项
            if (mainItemMatches) {
                mainItemCopy.sub_items = mainItem.sub_items;
                mainItemCopy.matchesKeyword = true; // 标记主事项匹配关键词
                deptCopy.items.push(mainItemCopy);
            }
            // 如果有子事项包含所有关键字，只保留匹配的子事项
            else if (filteredSubItems.length > 0) {
                mainItemCopy.sub_items = filteredSubItems;
                deptCopy.items.push(mainItemCopy);
            }
        });
        
        return deptCopy.items.length > 0;
    });
}

function highlightSearchTerm(searchTerm) {
    // 将搜索词拆分为单个字符
    const keywords = searchTerm.split('').filter(char => char.trim().length > 0);
    
    // 高亮子事项
    const subItems = document.querySelectorAll('.sub-item');
    
    subItems.forEach(item => {
        let itemContent = item.textContent;
        
        // 检查是否包含所有关键字
        const containsAllKeywords = keywords.every(keyword => 
            itemContent.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (containsAllKeywords) {
            // 为每个关键字添加高亮
            if (item.querySelector('a')) {
                // 如果是链接
                const link = item.querySelector('a');
                let linkText = link.textContent;
                let linkHTML = linkText;
                
                // 为每个关键字添加高亮
                keywords.forEach(keyword => {
                    // 使用正则表达式匹配关键字（不区分大小写）
                    const regex = new RegExp(keyword, 'gi');
                    linkHTML = linkHTML.replace(regex, match => `<span class="highlight">${match}</span>`);
                });
                
                link.innerHTML = linkHTML;
            } else {
                // 如果是普通文本
                let newHTML = itemContent;
                
                // 为每个关键字添加高亮
                keywords.forEach(keyword => {
                    // 使用正则表达式匹配关键字（不区分大小写）
                    const regex = new RegExp(keyword, 'gi');
                    newHTML = newHTML.replace(regex, match => `<span class="highlight">${match}</span>`);
                });
                
                item.innerHTML = newHTML;
            }
        }
    });
    
    // 高亮主事项
    const mainItemHeaders = document.querySelectorAll('.main-item-header');
    
    mainItemHeaders.forEach(header => {
        const span = header.querySelector('span:first-child');
        if (!span) return;
        
        const text = span.textContent;
        
        // 检查是否包含所有关键字
        const containsAllKeywords = keywords.every(keyword => 
            text.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (containsAllKeywords) {
            let spanHTML = text;
            
            // 为每个关键字添加高亮
            keywords.forEach(keyword => {
                // 使用正则表达式匹配关键字（不区分大小写）
                const regex = new RegExp(keyword, 'gi');
                spanHTML = spanHTML.replace(regex, match => `<span class="highlight">${match}</span>`);
            });
            
            span.innerHTML = spanHTML;
            
            // 标记主事项包含关键词
            header.closest('.main-item').classList.add('keyword-match');
        }
    });
}

function expandSearchResults() {
    // 展开所有包含搜索结果的部门
    const departments = document.querySelectorAll('.department');
    
    departments.forEach(dept => {
        // 重置所有部门的显示状态
        dept.style.display = '';
        
        const deptContent = dept.querySelector('.department-content');
        const deptHeader = dept.querySelector('.department-header');
        const arrow = deptHeader.querySelector('.arrow');
        
        // 检查是否包含匹配的子事项
        const hasMatchingSubItems = dept.querySelectorAll('.sub-item .highlight').length > 0;
        // 检查是否包含匹配的主事项
        const hasMatchingMainItems = dept.querySelectorAll('.main-item.keyword-match').length > 0;
        
        if (hasMatchingSubItems || hasMatchingMainItems) {
            // 展开部门
            arrow.classList.add('rotate');
            
            // 处理主事项
            const mainItems = dept.querySelectorAll('.main-item');
            let totalMainItemsHeight = 0;
            
            mainItems.forEach(mainItem => {
                // 重置所有主事项的显示状态
                mainItem.style.display = '';
                
                const mainItemContent = mainItem.querySelector('.main-item-content');
                const mainItemHeader = mainItem.querySelector('.main-item-header');
                
                if (mainItemHeader && mainItemContent) {
                    const mainItemArrow = mainItemHeader.querySelector('.arrow');
                    
                    // 检查主事项是否匹配关键词
                    const mainItemMatches = mainItem.classList.contains('keyword-match');
                    
                    // 检查主事项下是否有匹配的子事项
                    const hasMatchingSubItems = mainItem.querySelectorAll('.sub-item .highlight').length > 0;
                    
                    if (mainItemMatches || hasMatchingSubItems) {
                        // 展开主事项
                        mainItemContent.style.maxHeight = mainItemContent.scrollHeight + 'px';
                        mainItemArrow.classList.add('rotate');
                        
                        // 累加主事项内容高度
                        totalMainItemsHeight += mainItemContent.scrollHeight;
                        
                        // 处理子事项的显示/隐藏
                        const subItems = mainItem.querySelectorAll('.sub-item');
                        
                        // 先隐藏所有子事项
                        subItems.forEach(subItem => {
                            subItem.style.display = 'none';
                        });
                        
                        if (mainItemMatches) {
                            // 如果主事项匹配关键词，只显示匹配的子项
                            subItems.forEach(subItem => {
                                if (subItem.querySelector('.highlight')) {
                                    subItem.style.display = '';
                                }
                            });
                        } else if (hasMatchingSubItems) {
                            // 如果主事项不匹配但有子事项匹配，只显示匹配的子事项
                            subItems.forEach(subItem => {
                                if (subItem.querySelector('.highlight')) {
                                    subItem.style.display = '';
                                }
                                // 其他子事项保持隐藏状态
                            });
                        }
                        // 注意：这里不需要else分支，因为我们已经默认隐藏了所有子事项
                    } else {
                        // 如果主事项和子事项都不匹配关键词，隐藏整个主事项
                        mainItem.style.display = 'none';
                    }
                }
            });
            
            // 处理未分类子项
            const uncategorizedItems = dept.querySelectorAll('.uncategorized-item');
            uncategorizedItems.forEach(item => {
                if (!item.querySelector('.highlight')) {
                    item.style.display = 'none';
                } else {
                    item.style.display = '';
                }
            });
            
            // 设置部门内容的高度，确保能显示所有展开的主事项
            // 基础高度 + 所有展开的主事项高度 + 额外空间
            deptContent.style.maxHeight = (deptContent.scrollHeight + totalMainItemsHeight + 300) + 'px';
        } else {
            // 如果部门没有匹配项，隐藏整个部门
            dept.style.display = 'none';
        }
    });
    
    // 在所有展开/隐藏操作完成后，再次确保高度计算正确
    setTimeout(() => {
        const departments = document.querySelectorAll('.department');
        departments.forEach(dept => {
            if (dept.style.display !== 'none') {
                const deptContent = dept.querySelector('.department-content');
                if (deptContent && deptContent.style.maxHeight) {
                    // 重新计算部门内容高度
                    let totalHeight = deptContent.scrollHeight;
                    const mainItemContents = dept.querySelectorAll('.main-item-content[style*="max-height"]');
                    
                    mainItemContents.forEach(content => {
                        if (content.closest('.main-item').style.display !== 'none') {
                            totalHeight += content.scrollHeight;
                        }
                    });
                    
                    // 设置足够大的高度以确保所有内容可见
                    deptContent.style.maxHeight = (totalHeight + 300) + 'px';
                }
            }
        });
    }, 50); // 增加延迟时间，确保DOM更新完成
}


function toggleDepartment(header) {
    const deptContent = header.nextElementSibling;
    const arrow = header.querySelector('.arrow');
    if (deptContent.style.maxHeight) {
        deptContent.style.maxHeight = null;
        arrow.classList.remove('rotate');
    } else {
        // 计算所有展开主事项的总高度
        let totalHeight = deptContent.scrollHeight;
        const mainItems = deptContent.querySelectorAll('.main-item-content');
        mainItems.forEach(content => {
            if (content.style.maxHeight && content.style.maxHeight !== '0px') {
                totalHeight += content.scrollHeight;
            }
        });
        
        // 设置容器高度并添加滚动
        deptContent.style.maxHeight = `${totalHeight + 300}px`;
        deptContent.style.overflowY = 'auto';
        arrow.classList.add('rotate');
    }
}

function toggleMainItem(header) {
    const content = header.nextElementSibling;
    const arrow = header.querySelector('.arrow');
    
    if (content.style.maxHeight && content.style.maxHeight !== '0px') {
        content.style.maxHeight = '0px';
        arrow.classList.remove('rotate');
    } else {
        // 计算前5个子项的高度
        const visibleItems = 5;
        const items = content.querySelectorAll('.sub-item:not([style*="display: none"])');
        const itemHeight = items.length > 0 ? items[0].offsetHeight : 0;
        const maxVisibleHeight = itemHeight * visibleItems;
        
        // 设置容器最大高度并启用滚动
        content.style.maxHeight = `${Math.min(maxVisibleHeight, content.scrollHeight)}px`;
        arrow.classList.add('rotate');
    }
}

// 创建二维码模态框
function createQRCodeModal() {
    // 检查是否已存在模态框
    if (document.getElementById('qrcodeModal')) {
        return;
    }
    
    // 创建模态框容器
    const modalContainer = document.createElement('div');
    modalContainer.id = 'qrcodeModal';
    modalContainer.className = 'qrcode-modal';
    modalContainer.style.display = 'none';
    
    // 创建模态框内容
    const modalContent = document.createElement('div');
    modalContent.className = 'qrcode-modal-content';
    
    // 创建关闭按钮
    const closeButton = document.createElement('span');
    closeButton.className = 'qrcode-modal-close';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = function() {
        modalContainer.style.display = 'none';
    };
    
    // 创建标题
    const title = document.createElement('h3');
    title.id = 'qrcodeTitle';
    title.className = 'qrcode-title';
    
    // 创建二维码容器
    const qrcodeContainer = document.createElement('div');
    qrcodeContainer.id = 'qrcodeContainer';
    qrcodeContainer.className = 'qrcode-container';
    
    // 组装模态框
    modalContent.appendChild(closeButton);
    modalContent.appendChild(title);
    modalContent.appendChild(qrcodeContainer);
    modalContainer.appendChild(modalContent);
    
    // 添加点击模态框外部关闭功能
    modalContainer.onclick = function(event) {
        if (event.target === modalContainer) {
            modalContainer.style.display = 'none';
        }
    };
    
    // 添加到文档
    document.body.appendChild(modalContainer);
}

// 显示二维码
function showQRCode(link, name) {
    // 确保模态框已创建
    if (!document.getElementById('qrcodeModal')) {
        createQRCodeModal();
    }
    
    const modal = document.getElementById('qrcodeModal');
    const title = document.getElementById('qrcodeTitle');
    const qrcodeContainer = document.getElementById('qrcodeContainer');
    
    // 设置标题
    title.textContent = name;
    
    // 清空二维码容器
    qrcodeContainer.innerHTML = '';
    
    // 生成二维码
    if (link) {
        // 使用QRCode.js库生成二维码
        // 如果没有引入QRCode.js，则使用图片替代
        if (typeof QRCode === 'function') {
            new QRCode(qrcodeContainer, {
                text: link,
                width: 200,
                height: 200,
                errorCorrectionLevel: 'L' // 降低容错率，使用'L'(低)级别
            });
        } else {
            // 创建一个链接显示
            const linkElement = document.createElement('div');
            linkElement.className = 'qrcode-link';
            linkElement.innerHTML = `<p>链接地址：</p><a href="${link}" target="_blank">${link}</a>`;
            qrcodeContainer.appendChild(linkElement);
        }
    } else {
        qrcodeContainer.innerHTML = '<p>暂无链接信息</p>';
    }
    
    // 显示模态框
    modal.style.display = 'block';
}