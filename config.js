/**
 * ====================================================================
 *                 إعدادات شبكة الكاري نت اللاسلكية
 *                   HOTSPOT CONFIGURATION FILE
 * ====================================================================
 * يمكنك تعديل أي قيمة في هذا الملف لتتحدث فورياً في جميع صفحات المنظومة:
 * (صفحة تسجيل الدخول، صفحة الحالة، صفحة الخروج، الحظر، النوافذ، الإعلانات)
 * دون الحاجة لتعديل أي كود HTML أو CSS.
 */

window.HOTSPOT_CONFIG = {
  // 1. هوية الشبكة
  network: {
    name: "شبكة الكاري نت اللاسلكية",
    subtitle: "منظومة توزيع إنترنت فائق السرعة عبر شبكات الأقمار الصناعية ستاربينك وكروت ميكروتك الذكية",
    welcomeTitle: "أهلاً بك في شبكة الكاري نت اللاسلكية",
    footerCopyright: "جميع الحقوق محفوظة © شبكة الكاري نت اللاسلكية",
    logoPath: "assets/img/logo.svg"
  },

  // 2. أرقام التواصل والدعم الفني
  contact: {
    phone: "778898651",            // رقم الاتصال المباشر
    phoneDisplay: "778898651",      // الشكل المعروض للرقم
    phoneSecondary: "778311135",    // رقم اتصال إضافي
    whatsapp: "967778311135",      // رقم الواتساب مع الرمز الدولي
    whatsappDisplay: "778311135",  // الشكل المعروض للواتساب
    supportText: "خدمة العملاء والدعم الفني: 778311135 - 778898651"
  },

  // 3. الشريط الإخباري المتحرك
  newsTicker: {
    enabled: true,                  // true لتفعيل الشريط، false لإخفائه
    badgeText: "جديد الأخبار",
    headline: "أهلاً وسهلاً بكم في شبكة الكاري نت اللاسلكية • تصفح سريع واستقرار ممتاز • باقات مرنة تناسب جميع الاحتياجات • احتفظ بمعلومات الدخول حتى انتهاء المدة • نشكركم على اختياركم لنا.",
    scrollDurationSeconds: 18       // سرعة حركة الشريط بالثواني (كلما قل الرقم كان أسرع، مثلاً: 12 سريع، 18 متوسط، 28 هادئ)
  },

  // 4. التذكير والموعظة اليومية
  dailyReminder: {
    enabled: true,                  // true لتفعيل الصندوق، false لإخفائه
    title: "تذكير وموعظة",
    quote: "« استخدم الإنترنت فيما ينفعك .. واحذر أن تجعل الله أهون الناظرين إليك »",
    source: ""
  },

  // 5. قسم الشكاوى والمقترحات
  complaints: {
    enabled: true,
    title: "خدمة العملاء والشكاوى",
    description: "نسعد بخدمتكم وتلقي ملاحظاتكم ومقترحاتكم على مدار 24 ساعة لتحسين الخدمة.",
    whatsappMessage: "السلام عليكم، أريد تقديم ملاحظة/استفسار بخصوص خدمة شبكة الكاري نت:"
  },

  // 6. سيرفر السينما والبث المباشر للمباريات (يظهر في تسجيل الدخول وصفحة الحالة)
  liveCinema: {
    enabled: true,                  // true لإظهار الكرت، false لإخفائه تماماً
    title: "بث المباريات والسينما",
    badge: "LIVE HD",
    subtitle: "بث رياضي مباشر • سينما ومسلسلات 4K",
    buttonText: "مشاهدة",
    url: "http://live.alkary.net"   // رابط سيرفر البث المباشر
  },

  // 7. باقات وأسعار الكروت (تتحكم في نافذة الأسعار في كل الصفحات)
  packages: [
    {
      name: "باقة 200 ريال",
      badge: "",
      details: "10 ساعات • صلاحية 24 ساعة • 1.5GB",
      price: "200 ر.ي"
    },
    {
      name: "باقة 500 ريال",
      badge: "",
      details: "35 ساعة (يوم و 11 ساعة) • صلاحية 10 أيام • 3GB",
      price: "500 ر.ي"
    },
    {
      name: "باقة 1000 ريال",
      badge: "الأكثر طلباً",
      details: "160 ساعة (6 أيام و 16 ساعة) • صلاحية 10 أيام • 6GB",
      price: "1000 ر.ي"
    },
    {
      name: "باقة 2500 ريال",
      badge: "الشهرية الفائقة",
      details: "شهر كامل • صلاحية 30 يوم • 15GB",
      price: "2500 ر.ي"
    },
    {
      name: "باقة 5000 ريال",
      badge: "الشهرية الفائقة",
      details: "شهر كامل • صلاحية 30 يوم • 40GB",
      price: "5000 ر.ي"
    }
  ],

  // 8. سرعات التصفح وتحديد السرعة (تستطيع إضافة أو حذف أو تعديل أو تعيين الافتراضية)
  speeds: [
    {
      id: "turbo",
      name: "سرعة قوية",
      value: "100M/100M",
      label: "⚡ سرعة قوية (100M/100M)",
      desc: "100M/100M (افتراضي)",
      icon: "fa-bolt",
      isDefault: true              // السرعة المحددة تلقائياً عند فتح الصفحة
    },
    {
      id: "eco",
      name: "سرعة ضعيفة",
      value: "512K/512K",
      label: "سرعة ضعيفة (512K/512K)",
      desc: "512K/512K",
      icon: "fa-leaf",
      isDefault: false
    }
  ],

  // 9. نقاط البيع ومراكز بيع الكروت المعتمدة (تتحكم في نافذة نقاط البيع)
  pointsOfSale: {
    enabled: true,
    title: "مراكز البيع المعتمدة:",
    description: "كروت شبكة الكاري نت متوفرة لدى جميع البقالات والمحلات التجارية في نطاق تغطية الشبكة.",
    adminTitle: "للإدارة والاستفسار وطلب نقاط بيع:",
    phones: "778898651 - 778311135"
  }
};

// ====================================================================
//            محرك المزامنة الفوري الخالي من أي وميض (Zero-FOUC Engine)
// ====================================================================
(function applyCriticalStylesInstantly() {
  var cfg = window.HOTSPOT_CONFIG || {};
  var css = '';
  if (cfg.liveCinema && cfg.liveCinema.enabled === false) {
    css += '.cfg-cinema-card, #cfg-cinema-card { display: none !important; }\n';
  }
  if (cfg.newsTicker && cfg.newsTicker.enabled === false) {
    css += '.cfg-ticker-card, #cfg-ticker-card { display: none !important; }\n';
  }
  if (cfg.dailyReminder && cfg.dailyReminder.enabled === false) {
    css += '.cfg-reminder-card, #cfg-reminder-card { display: none !important; }\n';
  }
  if (cfg.pointsOfSale && cfg.pointsOfSale.enabled === false) {
    css += '.cfg-pos-card, #cfg-pos-card { display: none !important; }\n';
  }
  if (css) {
    var styleEl = document.getElementById('cfg-instant-sync-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'cfg-instant-sync-style';
      (document.head || document.documentElement).appendChild(styleEl);
    }
    styleEl.textContent = css;
  }
})();

(function applyConfigToPage() {
  function apply() {
    var cfg = window.HOTSPOT_CONFIG;
    if (!cfg) return;

    // تحديث نمط الإخفاء الفوري
    var css = '';
    if (cfg.liveCinema && cfg.liveCinema.enabled === false) {
      css += '.cfg-cinema-card, #cfg-cinema-card { display: none !important; }\n';
    }
    if (cfg.newsTicker && cfg.newsTicker.enabled === false) {
      css += '.cfg-ticker-card, #cfg-ticker-card { display: none !important; }\n';
    }
    if (cfg.dailyReminder && cfg.dailyReminder.enabled === false) {
      css += '.cfg-reminder-card, #cfg-reminder-card { display: none !important; }\n';
    }
    var instantStyle = document.getElementById('cfg-instant-sync-style');
    if (instantStyle) {
      instantStyle.textContent = css;
    }

    // 1. مزامنة هوية واسم الشبكة في كل الصفحات
    document.querySelectorAll('[data-cfg="network.name"]').forEach(function(el) {
      if (el.textContent !== cfg.network.name) {
        el.textContent = cfg.network.name;
      }
    });
    document.querySelectorAll('[data-cfg="network.subtitle"]').forEach(function(el) {
      if (el.textContent !== cfg.network.subtitle) {
        el.textContent = cfg.network.subtitle;
      }
    });
    document.querySelectorAll('[data-cfg="network.footerCopyright"]').forEach(function(el) {
      if (el.textContent !== cfg.network.footerCopyright) {
        el.textContent = cfg.network.footerCopyright;
      }
    });

    // 2. تحديث عناوين النوافذ والصفحات في المتصفح
    if (document.title && cfg.network.name && document.title.indexOf('شبكة') !== -1) {
      var currentPart = document.title.split('|')[1] || '';
      if (currentPart) {
        document.title = cfg.network.name + ' | ' + currentPart.trim();
      }
    }

    // 3. أرقام الاتصال والواتساب والدعم الفني
    document.querySelectorAll('[data-cfg="contact.supportText"]').forEach(function(el) {
      el.textContent = cfg.contact.supportText;
    });

    document.querySelectorAll('[data-cfg="contact.phone"]').forEach(function(el) {
      el.textContent = cfg.contact.phoneDisplay || cfg.contact.phone;
      var anchor = el.tagName === 'A' ? el : el.closest('a');
      if (anchor) {
        anchor.href = "tel:" + cfg.contact.phone;
      }
    });

    document.querySelectorAll('[data-cfg="contact.whatsapp"]').forEach(function(el) {
      el.textContent = cfg.contact.whatsappDisplay || cfg.contact.whatsapp;
      var anchor = el.tagName === 'A' ? el : el.closest('a');
      if (anchor) {
        var msg = encodeURIComponent(cfg.complaints.whatsappMessage || "السلام عليكم");
        anchor.href = "https://wa.me/" + cfg.contact.whatsapp + "?text=" + msg;
      }
    });

    // 4. الشريط الإخباري
    var tickerCard = document.getElementById('cfg-ticker-card');
    if (tickerCard) {
      if (cfg.newsTicker && cfg.newsTicker.enabled === false) {
        tickerCard.style.display = 'none';
      } else {
        tickerCard.style.display = '';
        var tickerTextEl = document.getElementById('cfg-ticker-text');
        if (tickerTextEl && cfg.newsTicker) {
          tickerTextEl.textContent = cfg.newsTicker.headline;
        }
        var tickerBadgeEl = document.getElementById('cfg-ticker-badge');
        if (tickerBadgeEl && cfg.newsTicker) {
          tickerBadgeEl.textContent = cfg.newsTicker.badgeText || "جديد الأخبار";
        }
        var marqueeContent = tickerCard.querySelector('.marquee-content');
        if (marqueeContent && cfg.newsTicker && cfg.newsTicker.scrollDurationSeconds) {
          marqueeContent.style.animationDuration = cfg.newsTicker.scrollDurationSeconds + 's';
        }
      }
    }

    // 5. التذكير والموعظة اليومية
    var reminderCard = document.getElementById('cfg-reminder-card');
    if (reminderCard) {
      if (cfg.dailyReminder && cfg.dailyReminder.enabled === false) {
        reminderCard.style.display = 'none';
      } else {
        reminderCard.style.display = '';
        var reminderQuoteEl = document.getElementById('cfg-reminder-quote');
        if (reminderQuoteEl && cfg.dailyReminder) {
          reminderQuoteEl.textContent = cfg.dailyReminder.quote;
        }
        var reminderTitleEl = document.getElementById('cfg-reminder-title');
        if (reminderTitleEl && cfg.dailyReminder && cfg.dailyReminder.title) {
          reminderTitleEl.textContent = cfg.dailyReminder.title;
        }
      }
    }

    // 6. سيرفر السينما والبث المباشر (إخفاء/إظهار وتحديث الرابط)
    var cinemaCards = document.querySelectorAll('.cfg-cinema-card, #cfg-cinema-card');
    cinemaCards.forEach(function(card) {
      if (cfg.liveCinema && cfg.liveCinema.enabled === false) {
        card.style.display = 'none';
      } else {
        card.style.display = '';
        var cinemaBtn = card.querySelector('.service-action-btn') || card.querySelector('a');
        if (cinemaBtn && cfg.liveCinema && cfg.liveCinema.url) {
          cinemaBtn.href = cfg.liveCinema.url;
          var btnText = cinemaBtn.querySelector('span');
          if (btnText && cfg.liveCinema.buttonText) {
            btnText.textContent = cfg.liveCinema.buttonText;
          }
        }
        var cinemaTitleEl = card.querySelector('.service-title') || card.querySelector('.service-title-row span:not(.sports-badge-tag)');
        if (cinemaTitleEl && cfg.liveCinema.title) {
          cinemaTitleEl.textContent = cfg.liveCinema.title;
        }
        var cinemaDescEl = card.querySelector('.service-desc span');
        if (cinemaDescEl && cfg.liveCinema.subtitle) {
          cinemaDescEl.textContent = cfg.liveCinema.subtitle;
        }
      }
    });

    // 7. توليد قائمة الأسعار والباقات ديناميكياً
    var pricesContainers = document.querySelectorAll('.cfg-packages-container');
    if (pricesContainers.length > 0 && Array.isArray(cfg.packages)) {
      pricesContainers.forEach(function(container) {
        var html = '';
        cfg.packages.forEach(function(pkg) {
          var titleWithBadge = pkg.name + (pkg.badge ? ' (' + pkg.badge + ')' : '');
          html += '<div class="modal-price-item">' +
                    '<div class="mpi-right">' +
                      '<span class="mpi-title">' + titleWithBadge + '</span>' +
                      '<span class="mpi-details">' + (pkg.details || '') + '</span>' +
                    '</div>' +
                    '<span class="mpi-price">' + (pkg.price || '').replace(/ /g, '&nbsp;') + '</span>' +
                  '</div>';
        });
        container.innerHTML = html;
      });
    }

    // 8. توليد نقاط البيع ديناميكياً
    var posContainers = document.querySelectorAll('.cfg-pos-container');
    if (posContainers.length > 0 && cfg.pointsOfSale) {
      posContainers.forEach(function(container) {
        var html = '';
        if (Array.isArray(cfg.pointsOfSale)) {
          cfg.pointsOfSale.forEach(function(pos) {
            var icon = pos.isMain ? 'fa-star' : 'fa-map-marker';
            var iconColor = pos.isMain ? '#FFD54F' : '#00e676';
            var badgeHtml = pos.isMain ? '<span style="font-size: 10px; background: rgba(255, 213, 79, 0.2); color: #FFD54F; padding: 2px 6px; border-radius: 6px; margin-right: 6px;">المركز الرئيسي</span>' : '';
            
            html += '<div class="pos-item" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">' +
                      '<div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">' +
                        '<div style="width: 34px; height: 34px; border-radius: 10px; background: rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">' +
                          '<i class="fa ' + icon + '" style="color: ' + iconColor + '; font-size: 14px;"></i>' +
                        '</div>' +
                        '<div style="display: flex; flex-direction: column; min-width: 0;">' +
                          '<div style="font-size: 13.5px; font-weight: 800; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + pos.name + badgeHtml + '</div>' +
                          '<div style="font-size: 11px; color: #F5D77F; margin-top: 2px;">' + pos.location + '</div>' +
                        '</div>' +
                      '</div>' +
                      (pos.phone ? '<a href="tel:' + pos.phone + '" style="padding: 6px 12px; background: rgba(0, 230, 118, 0.15); border: 1px solid rgba(0, 230, 118, 0.4); color: #00e676; border-radius: 8px; font-size: 11.5px; font-weight: 700; text-decoration: none; flex-shrink: 0; display: inline-flex; align-items: center; gap: 5px;"><i class="fa fa-phone"></i><span>اتصال</span></a>' : '') +
                    '</div>';
          });
        } else {
          // عرض كرت الموزعين ومراكز البيع المعتمدة مع صندوق الإدارة والاستفسار
          var pos = cfg.pointsOfSale;
          html += '<div style="background: rgba(0, 180, 255, 0.08); border: 1px solid #00d2ff; padding: 14px 12px; border-radius: 12px; margin-bottom: 12px; text-align: right;">' +
                    '<div style="font-weight: 800; color: #ffffff; font-size: 14px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">' +
                      '<i class="fa fa-shopping-cart" style="color: #00d2ff; font-size: 15px;"></i>' +
                      '<span>' + (pos.title || 'مراكز البيع المعتمدة:') + '</span>' +
                    '</div>' +
                    '<div style="color: #ffffff; font-size: 13px; line-height: 1.6; font-weight: 500;">' + (pos.description || '') + '</div>' +
                  '</div>' +
                  '<div style="background: rgba(255, 215, 0, 0.08); border: 1px solid #ffd700; padding: 14px 12px; border-radius: 12px; text-align: center;">' +
                    '<div style="font-weight: 800; color: #FFE082; font-size: 13.5px; margin-bottom: 6px; display: flex; align-items: center; justify-content: center; gap: 6px;">' +
                      '<i class="fa fa-phone" style="color: #ffd700; font-size: 14px;"></i>' +
                      '<span>' + (pos.adminTitle || 'للإدارة والاستفسار وطلب نقاط بيع:') + '</span>' +
                    '</div>' +
                    '<div style="color: #ffffff; font-weight: 900; font-size: 15px; direction: ltr; letter-spacing: 0.5px;">' + (pos.phones || '') + '</div>' +
                  '</div>';
        }
        container.innerHTML = html;
      });
    }

    // 9. توليد محدد السرعات ديناميكياً في صفحة تسجيل الدخول
    var speedGrid = document.getElementById('cfg-speeds-grid');
    if (speedGrid && Array.isArray(cfg.speeds) && cfg.speeds.length > 0) {
      var speedHtml = '';
      var defaultSpeedVal = '';
      var defaultSpeedLabel = '';

      cfg.speeds.forEach(function(sp, idx) {
        var isDefault = sp.isDefault || (idx === 0 && !cfg.speeds.some(function(s){ return s.isDefault; }));
        if (isDefault) {
          defaultSpeedVal = sp.value;
          defaultSpeedLabel = sp.label || sp.name;
        }
        var activeClass = isDefault ? 'active-turbo' : '';
        var iconClass = sp.icon || 'fa-bolt';

        speedHtml += '<div class="speed-btn ' + activeClass + '" id="btn-speed-' + (sp.id || idx) + '" onclick="setSpeedProfile(\'' + sp.value + '\', \'' + (sp.label || sp.name) + '\', this, ' + (isDefault ? 'true' : 'false') + ')">' +
                       '<span class="s-title"><i class="fa ' + iconClass + '" style="margin-left: 4px;"></i>' + sp.name + '</span>' +
                       '<span class="s-profile">' + (sp.desc || sp.value) + '</span>' +
                     '</div>';
      });
      speedGrid.innerHTML = speedHtml;

      // ضبط الحقل المخفي والاسم المعروض
      var sendinSpeed = document.getElementById('sendin_speed');
      if (sendinSpeed && defaultSpeedVal) {
        sendinSpeed.value = defaultSpeedVal;
      }
      var sendinDomain = document.getElementById('sendin_domain');
      if (sendinDomain && defaultSpeedVal) {
        sendinDomain.value = defaultSpeedVal;
      }
      var selectedProfile = document.getElementById('selected_profile');
      if (selectedProfile && defaultSpeedVal) {
        selectedProfile.value = defaultSpeedVal;
      }
      var selectedSpeed = document.getElementById('selected_speed');
      if (selectedSpeed && defaultSpeedVal) {
        selectedSpeed.value = defaultSpeedVal;
      }
      var displayProfile = document.getElementById('display-profile-name');
      if (displayProfile && defaultSpeedLabel) {
        displayProfile.textContent = defaultSpeedLabel;
      }
    }
  }

  // تطبيق فوري
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }

  // نافذة عامة لإعادة التطبيق عند أي تعديل فوري
  window.refreshHotspotConfig = apply;
})();
