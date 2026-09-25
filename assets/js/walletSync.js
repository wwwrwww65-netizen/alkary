/**
 * ==============================================================================
 * Alkary Net - Resilient Multi-Tier Cards Wallet & Cross-Modem Sync Engine
 * محرك حفظ ومزامنة حافظة الكروت فائق الصمود وحمايتها عند تغيير المودم أو الراوتر
 * ==============================================================================
 * يحمي كروت المشتركين من الضياع عبر 5 طبقات تخزين متزامنة:
 * 1. التخزين المحلي المتعدد (localStorage: primary + redundant backup mirrors)
 * 2. تخزين الجلسة (sessionStorage)
 * 3. قاعدة بيانات المتصفح الدائمة (IndexedDB) المقاومة لمسح الذاكرة المؤقتة
 * 4. كوكيز المتصفح المعمرة (Persistent Long-Lived Cookies: 10 سنوات بدلاً من 3 أيام)
 * 5. المزامنة السحابية مع سيرفر/راوتر الشبكة (/api/wallet)
 * 6. جسر الاسترداد التلقائي بين المودمات المختلفة (Cross-Modem Sync Bridge)
 * 7. نظام النسخ الاحتياطي والاستيراد اليدوي الفوري
 */

(function(window, document) {
    'use strict';

    var STORAGE_KEY = 'alkary_vouchers';
    var BACKUP_KEY = 'alkary_vouchers_backup';
    var MIRROR_KEY = 'alkary_saved_wallet';
    var COOKIE_KEY = 'alkary_cards_wallet';
    var DEVICE_KEY = 'alkary_device_id';
    var DB_NAME = 'AlkaryNetWalletDB';
    var DB_STORE = 'saved_cards';
    var MAX_CARDS = 25;

    // Common Hotspot / Modem IPs to bridge for cross-modem recovery
    var KNOWN_MODEM_IPS = [
        '192.168.88.1',   // MikroTik default
        '192.168.1.1',    // Standard router default
        '192.168.0.1',    // TP-Link / D-Link
        '10.0.0.1',       // Enterprise / Ubiquiti
        '10.5.50.1',      // MikroTik custom hotspot pool
        '172.16.0.1',     // Hotspot pool
        'alkary.net'      // Network domain
    ];

    var dbInstance = null;

    var AlkaryWallet = {
        deviceId: '',
        cards: [],
        initialized: false,

        // Initialize engine
        init: function() {
            if (this.initialized) return;
            this.initialized = true;

            this.deviceId = this.getOrCreateDeviceId();
            this.initIndexedDB();
            this.loadAndReconcile();

            // Setup cross-origin message listener
            this.setupMessageListener();

            // Run async cloud sync and cross-modem auto-recovery if needed
            var self = this;
            setTimeout(function() {
                self.syncWithServer();
                if (self.cards.length === 0) {
                    self.tryCrossModemAutoRecovery();
                }
            }, 300);
        },

        // 1. Device ID Management
        getOrCreateDeviceId: function() {
            var id = '';
            try {
                id = localStorage.getItem(DEVICE_KEY) || '';
            } catch(e) {}

            if (!id) {
                var m = document.cookie.match(new RegExp('(?:^|;\\s*)' + DEVICE_KEY + '=([^;]+)'));
                if (m) id = decodeURIComponent(m[1]);
            }

            if (!id) {
                id = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
            }

            try {
                localStorage.setItem(DEVICE_KEY, id);
            } catch(e) {}
            this.setCookie(DEVICE_KEY, id, 3650);
            return id;
        },

        // 2. Cookie Helper with 10-Year Expiry & Cross-Subnet compatibility
        setCookie: function(name, value, days) {
            try {
                var d = new Date();
                d.setTime(d.getTime() + ((days || 3650) * 24 * 60 * 60 * 1000));
                var expires = 'expires=' + d.toUTCString();
                document.cookie = name + '=' + encodeURIComponent(value) + ';' + expires + ';path=/;SameSite=Lax';
            } catch(e) {}
        },

        getCookie: function(name) {
            try {
                var m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
                return m ? decodeURIComponent(m[1]) : '';
            } catch(e) {
                return '';
            }
        },

        // 3. IndexedDB Initialization for indestructible persistence
        initIndexedDB: function() {
            if (!('indexedDB' in window)) return;
            try {
                var req = window.indexedDB.open(DB_NAME, 1);
                req.onupgradeneeded = function(e) {
                    var db = e.target.result;
                    if (!db.objectStoreNames.contains(DB_STORE)) {
                        db.createObjectStore(DB_STORE, { keyPath: 'code' });
                    }
                };
                req.onsuccess = function(e) {
                    dbInstance = e.target.result;
                    AlkaryWallet.readFromIndexedDB();
                };
                req.onerror = function() {};
            } catch(e) {}
        },

        readFromIndexedDB: function() {
            if (!dbInstance) return;
            try {
                var tx = dbInstance.transaction(DB_STORE, 'readonly');
                var store = tx.objectStore(DB_STORE);
                var req = store.getAll();
                req.onsuccess = function() {
                    var items = req.result || [];
                    var idbCards = items.map(function(item) { return item.code; }).filter(Boolean);
                    if (idbCards.length > 0) {
                        AlkaryWallet.mergeCards(idbCards, true);
                    }
                };
            } catch(e) {}
        },

        saveToIndexedDB: function(cards) {
            if (!dbInstance) return;
            try {
                var tx = dbInstance.transaction(DB_STORE, 'readwrite');
                var store = tx.objectStore(DB_STORE);
                store.clear();
                cards.forEach(function(code) {
                    store.put({ code: code, savedAt: Date.now() });
                });
            } catch(e) {}
        },

        // 4. Multi-Tier Load & Reconcile
        loadAndReconcile: function() {
            var gathered = [];

            // Tier A: Primary localStorage
            try {
                var primary = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
                if (Array.isArray(primary)) gathered = gathered.concat(primary);
            } catch(e) {}

            // Tier B: Backup localStorage mirrors
            try {
                var bk1 = JSON.parse(localStorage.getItem(BACKUP_KEY) || '[]');
                if (Array.isArray(bk1)) gathered = gathered.concat(bk1);
                var bk2 = JSON.parse(localStorage.getItem(MIRROR_KEY) || '[]');
                if (Array.isArray(bk2)) gathered = gathered.concat(bk2);
            } catch(e) {}

            // Tier C: Active voucher stored in localStorage or sessionStorage
            try {
                var act1 = localStorage.getItem('alkary_active_voucher');
                if (act1) gathered.push(act1);
                var act2 = sessionStorage.getItem('alkary_active_voucher');
                if (act2) gathered.push(act2);
                var act3 = localStorage.getItem('alkary_active_user');
                if (act3) gathered.push(act3);
            } catch(e) {}

            // Tier D: Persistent Cookies
            try {
                var cookieCards = this.getCookie(COOKIE_KEY);
                if (cookieCards) {
                    var parsed = JSON.parse(cookieCards);
                    if (Array.isArray(parsed)) gathered = gathered.concat(parsed);
                }
                var unameCookie = this.getCookie('uname') || this.getCookie('username');
                if (unameCookie && unameCookie !== '100') gathered.push(unameCookie);
            } catch(e) {}

            // Deduplicate & clean
            var cleanCards = [];
            gathered.forEach(function(code) {
                var c = String(code || '').trim();
                if (c && c !== '100' && c.indexOf('$(') === -1 && cleanCards.indexOf(c) === -1) {
                    cleanCards.push(c);
                }
            });

            this.cards = cleanCards.slice(0, MAX_CARDS);
            this.persistAllTiers(this.cards);
            this.updateUI();
        },

        // Persist cards list to all 5 local & cookie tiers simultaneously
        persistAllTiers: function(cards) {
            var json = JSON.stringify(cards);
            try { localStorage.setItem(STORAGE_KEY, json); } catch(e) {}
            try { localStorage.setItem(BACKUP_KEY, json); } catch(e) {}
            try { localStorage.setItem(MIRROR_KEY, json); } catch(e) {}
            try { sessionStorage.setItem(STORAGE_KEY, json); } catch(e) {}
            this.setCookie(COOKIE_KEY, json, 3650);

            // Also keep uname in cookie for backwards compatibility
            if (cards.length > 0) {
                this.setCookie('uname', cards[0], 3650);
            }

            this.saveToIndexedDB(cards);
        },

        // Merge new cards into the collection
        mergeCards: function(newCards, shouldNotify) {
            if (!Array.isArray(newCards) || newCards.length === 0) return;
            var current = this.cards.slice();
            var addedCount = 0;

            newCards.forEach(function(c) {
                var code = String(c || '').trim();
                if (code && code !== '100' && code.indexOf('$(') === -1 && current.indexOf(code) === -1) {
                    current.unshift(code);
                    addedCount++;
                }
            });

            if (addedCount > 0) {
                this.cards = current.slice(0, MAX_CARDS);
                this.persistAllTiers(this.cards);
                this.syncWithServer();
                this.updateUI();

                if (shouldNotify) {
                    this.showToast('تمت استعادة ' + addedCount + ' كرت تلقائياً إلى حافظة الكروت بنجاح! ✅', 'success');
                }
            }
        },

        // Save a single voucher (called on form submit or login)
        saveCard: function(code) {
            var c = String(code || '').trim();
            if (!c || c === '100' || c.indexOf('$(') !== -1) return;

            try {
                localStorage.setItem('alkary_active_voucher', c);
                localStorage.setItem('alkary_active_user', c);
                sessionStorage.setItem('alkary_active_voucher', c);
            } catch(e) {}

            var list = this.cards.slice();
            var idx = list.indexOf(c);
            if (idx !== -1) {
                list.splice(idx, 1);
            }
            list.unshift(c);
            this.cards = list.slice(0, MAX_CARDS);
            this.persistAllTiers(this.cards);
            this.syncWithServer();
            this.updateUI();
        },

        // Delete a single voucher
        removeCard: function(code) {
            var c = String(code || '').trim();
            if (!c) return;

            var list = this.cards.filter(function(item) {
                return item !== c;
            });
            this.cards = list;
            this.persistAllTiers(this.cards);

            // Delete from server
            try {
                fetch('/api/wallet/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ card: c, deviceId: this.deviceId })
                }).catch(function() {});
            } catch(e) {}

            this.updateUI();
            this.showToast('تم حذف الكرت من الحافظة', 'info');
        },

        // Clear all saved vouchers
        clearAll: function() {
            if (!confirm('هل أنت متأكد من مسح جميع الكروت المحفوظة من هذا الجهاز؟')) {
                return;
            }
            this.cards = [];
            this.persistAllTiers([]);

            try {
                fetch('/api/wallet/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ clearAll: true, deviceId: this.deviceId })
                }).catch(function() {});
            } catch(e) {}

            this.updateUI();
            this.showToast('تم مسح سجل الكروت بالكامل', 'info');
        },

        // 5. Server-Side Persistence Sync (/api/wallet)
        syncWithServer: function() {
            var self = this;
            try {
                // First GET server cards to merge any stored cards on the network/modem
                fetch('/api/wallet', {
                    method: 'GET',
                    headers: {
                        'x-client-device-id': self.deviceId
                    }
                })
                .then(function(res) {
                    if (res.ok) return res.json();
                    return null;
                })
                .then(function(data) {
                    if (data && data.success && Array.isArray(data.cards)) {
                        self.mergeCards(data.cards, self.cards.length === 0 && data.cards.length > 0);
                    }
                    // Then POST any local cards to server so server stays up to date
                    if (self.cards.length > 0) {
                        fetch('/api/wallet', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                deviceId: self.deviceId,
                                cards: self.cards
                            })
                        }).catch(function() {});
                    }
                })
                .catch(function() {});
            } catch(e) {}
        },

        // 6. Cross-Modem / Cross-Origin Auto Recovery Bridge
        // When user changed modem, the IP origin changed (e.g. 192.168.88.1 -> 192.168.1.1).
        // This attempts to fetch cards from known previous modem IPs via lightweight hidden bridge.
        tryCrossModemAutoRecovery: function() {
            var self = this;
            var currentHost = window.location.hostname;

            KNOWN_MODEM_IPS.forEach(function(ip) {
                if (ip === currentHost) return; // skip current host
                self.probeModemBridge(ip);
            });
        },

        probeModemBridge: function(targetIp) {
            var self = this;
            var bridgeUrl = 'http://' + targetIp + '/assets/sync-bridge.html';

            var iframe = document.createElement('iframe');
            iframe.style.position = 'absolute';
            iframe.style.width = '1px';
            iframe.style.height = '1px';
            iframe.style.opacity = '0';
            iframe.style.pointerEvents = 'none';
            iframe.src = bridgeUrl;

            var cleanup = function() {
                if (iframe.parentNode) {
                    iframe.parentNode.removeChild(iframe);
                }
            };

            // Remove iframe after 3.5s timeout if no response
            setTimeout(cleanup, 3500);

            try {
                document.body.appendChild(iframe);
            } catch(e) {}
        },

        // Setup postMessage listener for cross-modem bridge responses
        setupMessageListener: function() {
            var self = this;
            window.addEventListener('message', function(e) {
                if (e.data && e.data.type === 'ALKARY_SYNC_RESPONSE') {
                    if (Array.isArray(e.data.cards) && e.data.cards.length > 0) {
                        self.mergeCards(e.data.cards, true);
                    }
                }
            });
        },

        // Manual Recovery from Specific Custom IP or URL
        restoreFromCustomModemIp: function(customIp) {
            var ip = (customIp || '').trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
            if (!ip) {
                alert('يرجى كتابة عنوان آيبي المودم السابق (مثلاً: 192.168.88.1)');
                return;
            }
            this.showToast('جاري البحث عن كروت في المودم: ' + ip + ' ...', 'info');
            this.probeModemBridge(ip);

            var self = this;
            setTimeout(function() {
                if (self.cards.length === 0) {
                    self.showToast('لم نتمكن من الوصول للمودم السابق تلقائياً، يمكنك استيراد الكروت باللصق المباشر', 'warning');
                }
            }, 3000);
        },

        // 7. Backup Export & Import (نسخ احتياطي واستعادة فورية)
        copyAllCardsText: function() {
            if (this.cards.length === 0) {
                this.showToast('لا توجد كروت محفوظة لنسخها حالياً', 'warning');
                return;
            }

            var text = 'كروت شبكة الكاري نت المحفوظة:\n' + this.cards.join('\n');
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                var self = this;
                navigator.clipboard.writeText(text).then(function() {
                    self.showToast('تم نسخ جميع الكروت المحفوظة إلى الحافظة بنجاح! 📋', 'success');
                }).catch(function() {
                    self.fallbackCopyText(text);
                });
            } else {
                this.fallbackCopyText(text);
            }
        },

        fallbackCopyText: function(text) {
            try {
                var ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                this.showToast('تم نسخ الكروت بنجاح! 📋', 'success');
            } catch(e) {
                alert('انسخ الكروت يدوياً:\n\n' + text);
            }
        },

        importCardsFromText: function(rawText) {
            if (!rawText || !rawText.trim()) {
                alert('يرجى لصق أرقام الكروت أو كود النسخ الاحتياطي في المربع.');
                return;
            }

            // Extract numbers / alphanumeric voucher codes (separated by newlines, commas, spaces)
            var matches = rawText.match(/[a-zA-Z0-9_\-]{3,30}/g) || [];
            var validCards = [];

            // Filter out system words
            var stopWords = ['http', 'https', 'net', 'wifi', 'alkary', 'voucher', 'card', 'cards', 'true', 'false', 'null'];
            matches.forEach(function(code) {
                var clean = code.trim();
                if (clean && clean.length >= 3 && stopWords.indexOf(clean.toLowerCase()) === -1) {
                    if (validCards.indexOf(clean) === -1) {
                        validCards.push(clean);
                    }
                }
            });

            if (validCards.length === 0) {
                alert('لم يتم العثور على أرقام كروت صالحة في النص المدخل.');
                return;
            }

            var prevLen = this.cards.length;
            this.mergeCards(validCards, false);
            var addedCount = this.cards.length - prevLen;

            this.showToast('تم استيراد وحفظ ' + validCards.length + ' كرت بنجاح في الحافظة! ✅', 'success');
            return true;
        },

        // 8. Modern UI Rendering & Badges
        updateUI: function() {
            var list = this.cards;

            // Update badge counts in all places: #history-count, .history-count-badge
            var elCount = document.getElementById('history-count');
            if (elCount) {
                elCount.innerText = '(' + list.length + ')';
            }
            document.querySelectorAll('.js-wallet-count').forEach(function(el) {
                el.innerText = list.length;
            });

            // If history modal is currently visible, re-render list
            var container = document.getElementById('history-list');
            if (container) {
                this.renderHistoryList(container);
            }
        },

        renderHistoryList: function(container) {
            var list = this.cards;
            var activeCard = '';
            try {
                activeCard = localStorage.getItem('alkary_active_voucher') || '';
            } catch(e) {}

            if (list.length === 0) {
                container.innerHTML = 
                    '<div style="color: #ffffff; text-align: center; padding: 20px 14px; background: rgba(255,255,255,0.04); border: 1px dashed rgba(245, 215, 127, 0.3); border-radius: 14px;">' +
                        '<i class="fa fa-info-circle" style="font-size: 24px; color: #F5D77F; margin-bottom: 8px; display: block;"></i>' +
                        '<div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">لا توجد كروت محفوظة حالياً في هذا المتصفح</div>' +
                        '<div style="font-size: 12px; color: #F5D77F; line-height: 1.5;">إذا كنت قد غيرت المودم مؤخراً، يمكنك استعادة كروتك فوراً عبر زر "استعادة أو استيراد كروت" بالأسفل.</div>' +
                    '</div>';
                return;
            }

            var html = '';
            list.forEach(function(code, idx) {
                var isActive = (code === activeCard);
                var activeBadge = isActive ? '<span style="background: rgba(0, 230, 118, 0.2); color: #00e676; border: 1px solid rgba(0, 230, 118, 0.4); font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 6px; margin-right: 6px;"><i class="fa fa-check-circle" style="margin-left: 3px;"></i>الكرت النشط</span>' : '';

                html += 
                    '<div class="wallet-card-item" style="background: linear-gradient(135deg, rgba(30, 5, 14, 0.85) 0%, rgba(55, 4, 18, 0.75) 100%); border: 1px solid rgba(245, 215, 127, 0.35); padding: 12px 14px; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); transition: all 0.2s ease;">' +
                        '<div style="display: flex; flex-direction: column; min-width: 0; flex: 1;">' +
                            '<div style="display: flex; align-items: center; gap: 4px; margin-bottom: 3px;">' +
                                '<span style="font-weight: 800; color: #F5D77F; font-size: 16px; letter-spacing: 1px; font-family: monospace, sans-serif;">' +
                                    '<i class="fa fa-ticket" style="margin-left: 6px; color: #ffd700;"></i>' + code +
                                '</span>' +
                                activeBadge +
                            '</div>' +
                            '<div style="font-size: 10.5px; color: rgba(255,255,255,0.7); display: flex; align-items: center; gap: 4px;">' +
                                '<i class="fa fa-shield" style="color: #00e676; font-size: 9px;"></i>' +
                                '<span>محفوظ بأمان في ذاكرة المتصفح والسيرفر</span>' +
                            '</div>' +
                        '</div>' +
                        '<div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">' +
                            '<button type="button" title="نسخ رقم الكرت" onclick="window.AlkaryWallet.copySingleCard(\'' + code + '\')" style="background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.2); width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;">' +
                                '<i class="fa fa-copy" style="font-size: 13px;"></i>' +
                            '</button>' +
                            '<button type="button" title="استخدام هذا الكرت لتسجيل الدخول" onclick="window.AlkaryWallet.useVoucher(\'' + code + '\')" style="background: linear-gradient(135deg, #ffd700 0%, #f5d77f 100%); color: #1a0108; border: none; padding: 7px 12px; border-radius: 8px; font-weight: 800; cursor: pointer; font-size: 12px; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 8px rgba(245, 215, 127, 0.4);">' +
                                '<i class="fa fa-arrow-down"></i><span>استخدام</span>' +
                            '</button>' +
                            '<button type="button" title="حذف هذا الكرت" onclick="window.AlkaryWallet.removeCard(\'' + code + '\')" style="background: rgba(255, 60, 60, 0.15); color: #ff6b6b; border: 1px solid rgba(255, 60, 60, 0.3); width: 28px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer;">' +
                                '<i class="fa fa-trash-o" style="font-size: 13px;"></i>' +
                            '</button>' +
                        '</div>' +
                    '</div>';
            });

            container.innerHTML = html;
        },

        useVoucher: function(code) {
            var unameField = document.getElementById('uname');
            if (unameField) {
                unameField.value = code;
                if (typeof window.copyTextValue === 'function') {
                    window.copyTextValue();
                }
                unameField.blur();
            }
            if (typeof window.closeModal === 'function') {
                window.closeModal('history-modal');
            }
            this.showToast('تم اختيار الكرت: ' + code, 'success');
        },

        copySingleCard: function(code) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                var self = this;
                navigator.clipboard.writeText(code).then(function() {
                    self.showToast('تم نسخ الكرت: ' + code + ' 📋', 'success');
                });
            } else {
                this.fallbackCopyText(code);
            }
        },

        // Toast feedback notification
        showToast: function(msg, type) {
            var id = 'alkary-wallet-toast';
            var toast = document.getElementById(id);
            if (!toast) {
                toast = document.createElement('div');
                toast.id = id;
                toast.style.position = 'fixed';
                toast.style.top = '18px';
                toast.style.left = '50%';
                toast.style.transform = 'translateX(-50%)';
                toast.style.zIndex = '99999';
                toast.style.padding = '10px 18px';
                toast.style.borderRadius = '12px';
                toast.style.fontSize = '13px';
                toast.style.fontWeight = '700';
                toast.style.textAlign = 'center';
                toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.6)';
                toast.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                toast.style.maxWidth = '90%';
                document.body.appendChild(toast);
            }

            if (type === 'success') {
                toast.style.background = 'linear-gradient(135deg, #08331f 0%, #0e5c38 100%)';
                toast.style.border = '1px solid #00e676';
                toast.style.color = '#ffffff';
            } else if (type === 'warning') {
                toast.style.background = 'linear-gradient(135deg, #422900 0%, #704700 100%)';
                toast.style.border = '1px solid #ffb300';
                toast.style.color = '#ffffff';
            } else {
                toast.style.background = 'linear-gradient(135deg, #370412 0%, #52071c 100%)';
                toast.style.border = '1px solid #f5d77f';
                toast.style.color = '#f5d77f';
            }

            toast.innerHTML = msg;
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';

            clearTimeout(this._toastTimer);
            this._toastTimer = setTimeout(function() {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(-50%) translateY(-10px)';
            }, 3200);
        }
    };

    // Expose to window
    window.AlkaryWallet = AlkaryWallet;

    // Bridge with existing legacy global functions to guarantee 100% backward compatibility
    window.saveVoucherToStorage = function(code) {
        AlkaryWallet.saveCard(code);
    };

    window.updateHistoryCount = function() {
        AlkaryWallet.updateUI();
    };

    window.loadHistoryUI = function() {
        var container = document.getElementById('history-list');
        if (container) AlkaryWallet.renderHistoryList(container);
    };

    window.useVoucher = function(code) {
        AlkaryWallet.useVoucher(code);
    };

    window.clearVoucherHistory = function() {
        AlkaryWallet.clearAll();
    };

    // Auto initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            AlkaryWallet.init();
        });
    } else {
        AlkaryWallet.init();
    }

})(window, document);
