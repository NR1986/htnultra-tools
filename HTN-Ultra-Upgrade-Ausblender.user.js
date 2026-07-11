// ==UserScript==
// @name         HTN Ultra Upgrade-Ausblender
// @namespace    tweeks.io
// @version      1.0.1
// @description  Blendet auf der HTN Ultra Upgradeliste die Upgrades Malware Kit, Trojaner, SDK und Remote Hijack aus; per Tweeks-Menü ein-/ausschaltbar.
// @author       NinoRossi
// @match        https://www.htnultra.de/game.php*
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @run-at       document-idle
//
// @updateURL    https://raw.githubusercontent.com/NR1986/htnultra-tools/main/HTN-Ultra-Upgrade-Ausblender.user.js
// @downloadURL  https://raw.githubusercontent.com/NR1986/htnultra-tools/main/HTN-Ultra-Upgrade-Ausblender.user.js
// @homepageURL  https://github.com/NR1986/htnultra-tools
// @supportURL   https://github.com/NR1986/htnultra-tools/issues
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY = 'htnultra_upgrade_ausblender_enabled';
    const HIDDEN_UPGRADE_NAMES = [
        'Malware Kit',
        'Trojaner',
        'SDK',
        'Remote Hijack'
    ];

    let menuCommandId = null;

    function isUpgradeListPage() {
        const params = new URLSearchParams(window.location.search);
        return params.get('m') === 'upgradelist' ||
            Boolean(document.querySelector('#computer-upgrades table'));
    }

    function isEnabled() {
        return localStorage.getItem(STORAGE_KEY) !== 'false';
    }

    function setEnabled(enabled) {
        localStorage.setItem(STORAGE_KEY, String(enabled));
    }

    function normalizeText(text) {
        return (text || '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    function rowShouldBeHidden(row) {
        const firstCell = row.querySelector('td:first-child');
        if (!firstCell) {
            return false;
        }

        const itemName = normalizeText(firstCell.textContent);

        return HIDDEN_UPGRADE_NAMES.some((name) =>
            itemName.includes(normalizeText(name))
        );
    }

    function applyUpgradeFilter() {
        if (!isUpgradeListPage()) {
            return;
        }

        const enabled = isEnabled();
        const rows = document.querySelectorAll(
            '#computer-upgrades table tr'
        );

        rows.forEach((row) => {
            if (!rowShouldBeHidden(row)) {
                return;
            }

            row.style.display = enabled ? 'none' : '';
            row.dataset.htnultraUpgradeHidden =
                enabled ? 'true' : 'false';
        });
    }

    function refreshMenuCommand() {
        if (
            menuCommandId !== null &&
            typeof GM_unregisterMenuCommand === 'function'
        ) {
            GM_unregisterMenuCommand(menuCommandId);
        }

        const label = isEnabled()
            ? 'Upgrade-Ausblender: deaktivieren'
            : 'Upgrade-Ausblender: aktivieren';

        menuCommandId = GM_registerMenuCommand(label, () => {
            setEnabled(!isEnabled());
            applyUpgradeFilter();
            refreshMenuCommand();
        });
    }

    function observeUpgradeTable() {
        const container = document.querySelector('#computer-upgrades');
        if (!container) {
            return;
        }

        const observer = new MutationObserver(() => {
            applyUpgradeFilter();
        });

        observer.observe(container, {
            childList: true,
            subtree: true
        });
    }

    applyUpgradeFilter();
    refreshMenuCommand();
    observeUpgradeTable();
})();
