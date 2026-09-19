// ==UserScript==
// @name         HTN.ultra – Hacker-Logo 600 × 150 mit PC-Name
// @namespace    tweeks.io
// @version      1.2.0
// @description  Ersetzt das HTN.ultra-Logo durch ein 600 × 150 Pixel großes eigenes Logo und zeigt den ausgewählten PC-Namen im Hacker-Stil an.
// @author       Tweeks
// @match        https://www.htnultra.de/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const LOGO_URL = 'https://htnultratools.nrdv.net/addons/logo.png';

    function selectedPcName() {
        const computerLink = document.querySelector('#navi a[href*="game.php?m=pcs"]');
        if (!computerLink) return '';

        const text = computerLink.textContent.replace(/\s+/g, ' ').trim();
        // In der Navigation lautet der Eintrag normalerweise: Computer IP-Adresse (PC-Name).
        const name = text.match(/\(([^)]+)\)\s*$/);
        return name ? name[1].trim() : text.replace(/^Computer\s*/i, '').trim();
    }

    function replaceHeaderLogo() {
        const logo = document.querySelector('div.header > h1 > a > img');
        if (!logo || logo.dataset.htnCustomLogo === 'true') return;

        const logoLink = logo.closest('a');
        const heading = logo.closest('h1');
        if (!logoLink || !heading) return;

        const pcName = selectedPcName();
        logo.src = LOGO_URL;
        logo.alt = 'HTN.ultra Tools';
        logo.removeAttribute('align');
        logo.dataset.htnCustomLogo = 'true';
        logoLink.classList.add('htn-custom-logo-link');
        heading.classList.add('htn-custom-logo-header');

        if (pcName) {
            const label = document.createElement('span');
            label.className = 'htn-custom-logo-pc-name';
            label.textContent = pcName;
            logoLink.append(label);
        }
    }

    const style = document.createElement('style');
    style.textContent = `
        .header > h1.htn-custom-logo-header {
            position: relative;
            font-size: 0;
        }
        .header > h1 .htn-custom-logo-link {
            position: absolute;
            top: 10px;
            left: 30px;
            display: inline-block;
            line-height: 0;
            text-decoration: none;
        }
        .header > h1 .htn-custom-logo-link > img {
            display: block;
            width: 600px;
            height: 150px;
            object-fit: fill;
        }
        .header > h1 .htn-custom-logo-pc-name {
            position: absolute;
            right: 80px;
            bottom: 45px;
            max-width: calc(100% - 16px);
            overflow: hidden;
            color: #39ff14;
            font-family: "Lucida Console", "Courier New", monospace;
            font-size: 50px;
            font-weight: bold;
            letter-spacing: 1px;
            line-height: 1.2;
            text-align: right;
            text-overflow: ellipsis;
            white-space: nowrap;
            text-shadow: 0 0 3px #062b08, 0 0 7px #16a80d, 1px 1px 2px #000;
        }
    `;
    document.head.append(style);

    replaceHeaderLogo();
})();
