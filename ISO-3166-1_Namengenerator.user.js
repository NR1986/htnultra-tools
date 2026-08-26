// ==UserScript==
// @name         HTN.ultra – PC-Namen aus Länder-IP und letztem IP-Oktett
// @version      1.5.1
// @description  Setzt ISO-3166-2-Ländercodes direkt gefolgt vom letzten Oktett der HTN-IP-Adresse in PC-Namen und zeigt einen Ausführungslog an.
// @author       NinoRossi
// @match        https://www.htnultra.de/game.php*
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  'use strict';

  const scriptVersion = '1.5.1';

  /* Subnetz-Auswahl von HTN.ultra: 10.47.<Subnetz>.<Host>.
     Wichtig: Subnetz 61 ist Indien; dessen ISO-3166-1-Alpha-2-Code ist IN. */
  const subnetCountries = Object.freeze({
    47: ['Deutschland', 'DE'], 48: ['Antarktis', 'AQ'], 49: ['Argentinien', 'AR'],
    51: ['Österreich', 'AT'], 52: ['Brasilien', 'BR'], 53: ['China', 'CN'],
    55: ['Ägypten', 'EG'], 56: ['Großbritannien', 'GB'], 57: ['Finnland', 'FI'],
    58: ['Frankreich', 'FR'], 59: ['Griechenland', 'GR'], 60: ['Grönland', 'GL'],
    61: ['Indien', 'IN'], 62: ['Irak', 'IQ'], 63: ['Iran', 'IR'], 64: ['Irland', 'IE'],
    65: ['Island', 'IS'], 66: ['Italien', 'IT'], 67: ['Japan', 'JP'], 68: ['Kanada', 'CA'],
    70: ['Libyen', 'LY'], 71: ['Madagaskar', 'MG'], 72: ['Mexiko', 'MX'],
    73: ['Namibia', 'NA'], 74: ['Neuseeland', 'NZ'], 76: ['Pakistan', 'PK'],
    77: ['Peru', 'PE'], 78: ['Portugal', 'PT'], 80: ['Russland', 'RU'],
    81: ['Saudi-Arabien', 'SA'], 82: ['Schweden', 'SE'], 83: ['Schweiz', 'CH'],
    84: ['Spanien', 'ES'], 85: ['Südafrika', 'ZA'], 86: ['Thailand', 'TH'],
    87: ['Türkei', 'TR'], 91: ['Vietnam', 'VN'], 92: ['Afghanistan', 'AF'],
    99: ['Kuba', 'CU'], 101: ['Nordkorea', 'KP'], 102: ['USA', 'US'],
    103: ['Australien', 'AU'], 151: ['Sierra Leone', 'SL'], 152: ['Katar', 'QA'],
    153: ['Vanuatu', 'VU'], 166: ['Monaco', 'MC'], 230: ['Antigua und Barbuda', 'AG'],
    112: ['Quest', 'QU'], 222: ['Myth', 'MY'], 235: ['Atlantis', 'IO'], 254: ['Marlboro Country', 'CB']
  });
  const unsupportedSubnets = Object.freeze({
    112: 'Quest', 222: 'Myth', 235: 'Atlantis', 254: 'Marlboro Country'
  });
  const renameFormSelector = 'form[action*="a=renamepcs"]';

  function isRenamePage() {
    return new URL(location.href).searchParams.get('a') === 'renamepclist';
  }

  function parseIp(text) {
    const match = /^10\.47\.(\d{1,3})\.(\d{1,3})$/.exec(text.trim());
    if (!match) return null;
    const subnet = Number(match[1]);
    const host = Number(match[2]);
    return host <= 255 ? { subnet, host, country: subnetCountries[subnet] } : null;
  }

  function renameComputers() {
    const form = document.querySelector(renameFormSelector);
    if (!isRenamePage() || !form) {
      alert('Bitte öffne zuerst die HTN-Seite „Computer umbenennen“.');
      return;
    }

    let changed = 0;
    const skipped = [];
    form.querySelectorAll('tr').forEach((row) => {
      const input = row.querySelector('input[name^="pc"]');
      const ip = row.cells[0]?.textContent || '';
      const details = parseIp(ip);
      if (!input) return;
      if (!details?.country) {
        if (details && unsupportedSubnets[details.subnet]) {
          skipped.push(ip.trim() + ' (' + unsupportedSubnets[details.subnet] + ': kein ISO-Code)');
        } else if (ip.trim()) {
          skipped.push(ip.trim());
        }
        return;
      }

      const [country, iso] = details.country;
      // Die Hostnummer immer dreistellig speichern, z. B. GR1 als GR001.
      const paddedHost = String(details.host).padStart(3, '0');
      input.value = iso + paddedHost;
      input.title = country + ' – ISO ' + iso + ', Host ' + paddedHost;
      input.classList.add('htn-subnet-renamed');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      changed += 1;
    });

    let message = changed + ' PC-Namen mit ISO-Ländercode und dreistelliger Hostnummer gefüllt.';
    if (skipped.length) message += '\nÜbersprungen: ' + skipped.join(', ') + '.';
    alert(message + '\nBitte speichere die Änderungen anschließend mit dem Formular-Button.');
  }

  function addInterface() {
    if (!isRenamePage() || document.querySelector('#htn-subnet-rename')) return;
    const form = document.querySelector(renameFormSelector);
    if (!form) return;
    const controls = document.createElement('p');
    controls.id = 'htn-subnet-rename';
    controls.innerHTML = '<button type="button" id="htn-subnet-rename-button">ISO-Namen aus Länder-IP einsetzen</button><small id="htn-subnet-rename-version">Version ' + scriptVersion + '</small>';
    form.insertAdjacentElement('beforebegin', controls);
    controls.querySelector('#htn-subnet-rename-button').addEventListener('click', renameComputers);
  }

  const style = document.createElement('style');
  style.textContent = '#htn-subnet-rename button{margin:2px;padding:4px 8px;cursor:pointer}#htn-subnet-rename-version{display:block;margin:0 2px;font-size:9px;line-height:1.1;color:#777}.htn-subnet-renamed{outline:1px solid #278a27}';
  document.head.appendChild(style);
  addInterface();
  GM_registerMenuCommand('HTN: ISO-Namen aus Länder-IP einsetzen', renameComputers);
})();
