// ==UserScript==
// @name         HTN.ultra – PC-Credits an eigenen Cluster überweisen
// @namespace    tweeks.io
// @version      2.0
// @description  Fügt einen Link hinzu, der auf der Überweisungsseite den eigenen Cluster und alle Credits des PCs vorausfüllt.
// @author       Tweeks
// @match        *://www.htnultra.de/game.php*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const pageUrl = new URL(window.location.href);
    const module = pageUrl.searchParams.get('m');
    const transferMarker = 'tm_cluster_transfer';

    function setInputValue(input, value) {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function readCredits() {
        const balance = document.querySelector('#computer-transfer-start p');
        if (!balance) return null;

        const match = balance.textContent.match(/Geld\s*:\s*([\d.\s]+)/i);
        if (!match) return null;

        const credits = match[1].replace(/\D/g, '');
        return credits || null;
    }

    function readOwnClusterCode() {
        const clusterFrame = document.querySelector('.clusterinfo iframe');
        if (!clusterFrame) return null;

        try {
            const frameText = clusterFrame.contentDocument && clusterFrame.contentDocument.body
                ? clusterFrame.contentDocument.body.textContent
                : '';
            const match = frameText.match(/Cluster\s*:\s*[^\[]*\[\s*([^\]\r\n]+?)\s*\]/i);
            return match ? match[1].trim() : null;
        } catch (_) {
            return null;
        }
    }

    function fillTransferForm() {
        const form = document.querySelector('#computer-transfer-start form[name="frm"]');
        if (!form || form.dataset.tmClusterPrefilled === 'true') return;

        const clusterRadio = form.querySelector('input[name="reciptype"][value="cluster"]');
        const clusterCode = form.querySelector('input[name="clustercode"]');
        const creditsInput = form.querySelector('input[name="credits"]');
        const credits = readCredits();
        const ownClusterCode = readOwnClusterCode();

        if (!clusterRadio || !clusterCode || !creditsInput || !credits || !ownClusterCode) return;

        clusterRadio.checked = true;
        clusterRadio.dispatchEvent(new Event('change', { bubbles: true }));
        setInputValue(clusterCode, ownClusterCode);
        setInputValue(creditsInput, credits);
        form.dataset.tmClusterPrefilled = 'true';
    }

    if (module === 'pc') {
        const computer = document.querySelector('#computer');
        if (!computer) return;

        const transferUrl = new URL('game.php', window.location.href);
        transferUrl.searchParams.set('m', 'transferform');
        transferUrl.searchParams.set(transferMarker, '1');

        const sid = pageUrl.searchParams.get('sid');
        if (sid) transferUrl.searchParams.set('sid', sid);

        let transferLink = computer.querySelector('.submenu a[href*="m=transferform"]');
        if (transferLink) {
            transferLink.href = transferUrl.href;
            transferLink.textContent = 'Credits an Cluster überweisen';
            transferLink.title = 'Öffnet die Überweisung mit Cluster und gesamtem PC-Guthaben';
        } else {
            const submenu = computer.querySelector('.submenu');
            if (!submenu) return;

            const paragraph = submenu.querySelector('p') || submenu.appendChild(document.createElement('p'));
            const separator = document.createTextNode(paragraph.textContent.trim() ? ' | ' : '');
            transferLink = document.createElement('a');
            transferLink.href = transferUrl.href;
            transferLink.textContent = 'Credits an Cluster überweisen';
            transferLink.title = 'Öffnet die Überweisung mit Cluster und gesamtem PC-Guthaben';
            paragraph.append(separator, transferLink);
        }

        transferLink.classList.add('tm-cluster-transfer-link');

        const style = document.createElement('style');
        style.textContent = '#computer .submenu .tm-cluster-transfer-link { font-weight: bold; }';
        document.head.appendChild(style);
        return;
    }

    if (module === 'transferform' && pageUrl.searchParams.get(transferMarker) === '1') {
        const clusterFrame = document.querySelector('.clusterinfo iframe');
        fillTransferForm();
        if (clusterFrame) clusterFrame.addEventListener('load', fillTransferForm, { once: true });
    }
})();
