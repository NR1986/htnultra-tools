// ==UserScript==
// @name         HTN.ultra – PC-Namen aus Länder-IP und letztem IP-Oktett
// @version      1.4.0
// @description  Setzt ISO-3166-1-Ländercodes direkt gefolgt vom letzten Oktett der HTN-IP-Adresse in PC-Namen und zeigt einen Ausführungslog an.
// @author       NinoRossi
// @match        https://www.htnultra.de/game.php*
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  'use strict';

  /* HTN nutzt im dritten Oktett seiner Spiel-IP die internationale
     Telefon-Ländervorwahl, z. B. 10.47.61.x = +61 = Australien (AU). */
  const dialCodeToIso = Object.freeze({
    1: 'US', 7: 'RU', 20: 'EG', 27: 'ZA', 30: 'GR', 31: 'NL', 32: 'BE', 33: 'FR',
    34: 'ES', 36: 'HU', 39: 'IT', 40: 'RO', 41: 'CH', 43: 'AT', 44: 'GB', 45: 'DK',
    46: 'SE', 47: 'NO', 48: 'PL', 49: 'DE', 51: 'PE', 52: 'MX', 53: 'CU', 54: 'AR',
    55: 'BR', 56: 'CL', 57: 'CO', 58: 'VE', 60: 'MY', 61: 'AU', 62: 'ID', 63: 'PH',
    64: 'NZ', 65: 'SG', 66: 'TH', 81: 'JP', 82: 'KR', 84: 'VN', 86: 'CN', 90: 'TR',
    91: 'IN', 92: 'PK', 93: 'AF', 94: 'LK', 95: 'MM', 98: 'IR', 211: 'SS', 212: 'MA',
    213: 'DZ', 216: 'TN', 218: 'LY', 220: 'GM', 221: 'SN', 222: 'MR', 223: 'ML',
    224: 'GN', 225: 'CI', 226: 'BF', 227: 'NE', 228: 'TG', 229: 'BJ', 230: 'MU',
    231: 'LR', 232: 'SL', 233: 'GH', 234: 'NG', 235: 'TD', 236: 'CF', 237: 'CM',
    238: 'CV', 239: 'ST', 240: 'GQ', 241: 'GA', 242: 'CG', 243: 'CD', 244: 'AO',
    245: 'GW', 246: 'IO', 248: 'SC', 249: 'SD', 250: 'RW', 251: 'ET', 252: 'SO',
    253: 'DJ', 254: 'KE', 255: 'TZ', 256: 'UG', 257: 'BI', 258: 'MZ', 260: 'ZM',
    261: 'MG', 262: 'RE', 263: 'ZW', 264: 'NA', 265: 'MW', 266: 'LS', 267: 'BW',
    268: 'SZ', 269: 'KM', 291: 'ER', 297: 'AW', 298: 'FO', 299: 'GL', 350: 'GI',
    351: 'PT', 352: 'LU', 353: 'IE', 354: 'IS', 355: 'AL', 356: 'MT', 357: 'CY',
    358: 'FI', 359: 'BG', 370: 'LT', 371: 'LV', 372: 'EE', 373: 'MD', 374: 'AM',
    375: 'BY', 376: 'AD', 377: 'MC', 378: 'SM', 380: 'UA', 381: 'RS', 382: 'ME',
    383: 'XK', 385: 'HR', 386: 'SI', 387: 'BA', 389: 'MK', 420: 'CZ', 421: 'SK',
    423: 'LI', 500: 'FK', 501: 'BZ', 502: 'GT', 503: 'SV', 504: 'HN', 505: 'NI',
    506: 'CR', 507: 'PA', 508: 'PM', 509: 'HT', 590: 'GP', 591: 'BO', 592: 'GY',
    593: 'EC', 594: 'GF', 595: 'PY', 596: 'MQ', 597: 'SR', 598: 'UY', 599: 'CW',
    670: 'TL', 672: 'NF', 673: 'BN', 674: 'NR', 675: 'PG', 676: 'TO', 677: 'SB',
    678: 'VU', 679: 'FJ', 680: 'PW', 681: 'WF', 682: 'CK', 683: 'NU', 685: 'WS',
    686: 'KI', 687: 'NC', 688: 'TV', 689: 'PF', 690: 'TK', 691: 'FM', 692: 'MH',
    850: 'KP', 852: 'HK', 853: 'MO', 855: 'KH', 856: 'LA', 880: 'BD', 886: 'TW',
    960: 'MV', 961: 'LB', 962: 'JO', 963: 'SY', 964: 'IQ', 965: 'KW', 966: 'SA',
    967: 'YE', 968: 'OM', 970: 'PS', 971: 'AE', 972: 'IL', 973: 'BH', 974: 'QA',
    975: 'BT', 976: 'MN', 977: 'NP', 992: 'TJ', 993: 'TM', 994: 'AZ', 995: 'GE',
    996: 'KG', 998: 'UZ'
  });

  const logEntries = [];
  const renameFormSelector = 'form[action*="a=renamepcs"]';

  function addLog(message) {
    const time = new Date().toLocaleTimeString('de-DE');
    logEntries.push('[' + time + '] ' + message);
    const output = document.querySelector('#htn-iso-log-output');
    if (output) output.textContent = logEntries.join('\n');
  }

  function isRenamePage() {
    return new URL(location.href).searchParams.get('a') === 'renamepclist';
  }

  function showLog() {
    const modal = document.querySelector('#htn-iso-log-modal');
    if (!modal) return;
    document.querySelector('#htn-iso-log-output').textContent = logEntries.length
      ? logEntries.join('\n')
      : 'Noch keine Aktionen ausgeführt.';
    modal.hidden = false;
  }

  function applyCountryNames() {
    addLog('Umbenennung gestartet.');
    if (!isRenamePage()) {
      addLog('Abbruch: Dies ist nicht die Seite „Alle Computer umbenennen“.');
      alert('Bitte öffne zuerst die HTN-Seite „Computer umbenennen“. Über „Log anzeigen“ findest du Details.');
      return;
    }

    const form = document.querySelector(renameFormSelector);
    if (!form) {
      addLog('Abbruch: Das Formular für einzelne PC-Namen wurde nicht gefunden.');
      alert('Das PC-Formular wurde nicht gefunden. Bitte sieh im Log nach.');
      return;
    }

    const rows = form.querySelectorAll('tr');
    let changed = 0;
    let examined = 0;
    let unknown = 0;
    addLog(rows.length + ' Tabellenzeilen im PC-Formular gefunden.');

    rows.forEach((row) => {
      const input = row.querySelector('input[name^="pc"]');
      if (!input) return;
      examined += 1;
      const cells = row.querySelectorAll('td');
      const ip = cells[0] ? cells[0].textContent.trim() : '';
      const match = ip.match(/^10\.47\.(\d{1,3})\.(\d{1,3})$/);

      if (!match) {
        addLog('Übersprungen: Ungültige oder nicht lesbare IP „' + (ip || 'leer') + '“.');
        return;
      }

      const dialCode = Number(match[1]);
      const iso = dialCodeToIso[dialCode];
      if (!iso) {
        unknown += 1;
        addLog(ip + ': Keine ISO-Zuordnung für Ländercode ' + dialCode + '; Name blieb „' + input.value + '“.');
        return;
      }

      const lastOctet = Number(match[2]);
      const newValue = iso + String(lastOctet);
      const oldValue = input.value;
      input.value = newValue;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.style.outline = '1px solid #278a27';
      changed += 1;
      addLog(ip + ': Ländercode ' + dialCode + ' erkannt; „' + oldValue + '“ zu „' + newValue + '“ geändert.');
    });

    addLog('Fertig: ' + examined + ' PCs geprüft, ' + changed + ' Namen gesetzt, ' + unknown + ' ohne Zuordnung.');
    alert(changed + ' PC-Namen im Format ISO-Code plus letztes Oktett ohne Bindestrich (z. B. AU31) gefüllt. Prüfe die Werte und klicke anschließend selbst auf „Speichern“.');
  }

  function addInterface() {
    if (!isRenamePage() || document.querySelector('#htn-iso-controls')) return;
    const renameForm = document.querySelector(renameFormSelector);
    const heading = renameForm && renameForm.closest('#computer-rename')?.querySelector('h3');
    if (!heading) {
      addLog('Hinweis: Kein geeigneter Ort für die Script-Schaltflächen gefunden.');
      return;
    }

    const controls = document.createElement('p');
    controls.id = 'htn-iso-controls';
    controls.innerHTML = '<button type="button" id="htn-iso-apply">ISO-Code und letztes IP-Oktett ohne Bindestrich einsetzen</button> <button type="button" id="htn-iso-show-log">Log anzeigen</button>';
    heading.insertAdjacentElement('afterend', controls);

    const modal = document.createElement('div');
    modal.id = 'htn-iso-log-modal';
    modal.hidden = true;
    modal.innerHTML = '<div class="htn-iso-log-box" role="dialog" aria-modal="true" aria-labelledby="htn-iso-log-title"><button type="button" class="htn-iso-close" aria-label="Log schließen">Schließen</button><h2 id="htn-iso-log-title">HTN ISO-PC-Namen: Ausführungslog</h2><pre id="htn-iso-log-output"></pre></div>';
    document.body.appendChild(modal);

    document.querySelector('#htn-iso-apply').addEventListener('click', applyCountryNames);
    document.querySelector('#htn-iso-show-log').addEventListener('click', showLog);
    modal.querySelector('.htn-iso-close').addEventListener('click', () => { modal.hidden = true; });
    modal.addEventListener('click', (event) => { if (event.target === modal) modal.hidden = true; });
    addLog('Bedienelemente bereit. Klicke auf „ISO-Code und letztes IP-Oktett ohne Bindestrich einsetzen“, dann auf „Log anzeigen“ für Details.');
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = '#htn-iso-controls button { margin: 2px; padding: 4px 8px; cursor: pointer; } #htn-iso-log-modal { position: fixed; inset: 0; z-index: 10000; box-sizing: border-box; overflow: auto; padding: 40px 16px; background: rgba(0,0,0,.45); } #htn-iso-log-modal[hidden] { display: none; } .htn-iso-log-box { max-width: 760px; margin: 0 auto; padding: 20px; color: #111; background: #fff; border: 2px solid #555; box-shadow: 0 3px 12px #000; font: 14px Arial,sans-serif; } .htn-iso-log-box h2 { margin-top: 0; } .htn-iso-log-box pre { max-height: 60vh; overflow: auto; padding: 12px; white-space: pre-wrap; overflow-wrap: anywhere; background: #f3f3f3; border: 1px solid #bbb; } .htn-iso-close { float: right; padding: 5px 9px; cursor: pointer; }';
    document.head.appendChild(style);
  }

  injectStyles();
  addLog('Script geladen: ' + location.pathname + location.search);
  addInterface();
  GM_registerMenuCommand('HTN: ISO-Codes und letztes IP-Oktett ohne Bindestrich eintragen', applyCountryNames);
  GM_registerMenuCommand('HTN: Ausführungslog anzeigen', showLog);
})();
