// ==UserScript==
// @name         HTN.ultra Computerliste gruppieren und ausblenden
// @version      2.0.0
// @description  Erweitert die Liste aller Computer um mehr frei wählbare Gruppierungen, einklappbare Gruppen sowie Regeln und Buttons zum kompletten Ausblenden einzelner PCs oder ganzer Gruppen.
// @author       NinoRossi
// @match        https://www.htnultra.de/game.php*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const STORAGE_KEY = 'htnultra_pc_grouping_settings_v2';
  const OLD_STORAGE_KEY = 'htnultra_pc_grouping_settings_v1';

  const defaultSettings = {
    mode: 'none',
    customPattern: '',
    collapsed: false,
    showHidden: false,
    showHideColumn: true,
    hideRuleMode: 'none',
    hideRuleValue: '',
    hiddenPcIds: {},
    hiddenGroups: {}
  };

  const groupOptions = [
    ['none', 'Nicht gruppieren'],
    ['country', 'Land'],
    ['countrySubnet', 'Land + Subnetz'],
    ['subnet2', 'Subnetz / erste 2 IP-Blöcke'],
    ['subnet', 'Subnetz / erste 3 IP-Blöcke'],
    ['ipFirst', 'Erster IP-Block'],
    ['ipLastRange25', 'Letzter IP-Block in 25er-Schritten'],
    ['status', 'Status'],
    ['pointsExact', 'Punkte exakt'],
    ['points100', 'Punkte in 100er-Schritten'],
    ['points250', 'Punkte in 250er-Schritten'],
    ['points500', 'Punkte in 500er-Schritten'],
    ['points1000', 'Punkte in 1.000er-Schritten'],
    ['credits25k', 'Geld in 25.000er-Schritten'],
    ['credits50k', 'Geld in 50.000er-Schritten'],
    ['credits100k', 'Geld in 100.000er-Schritten'],
    ['credits250k', 'Geld in 250.000er-Schritten'],
    ['upgrade', 'Upgrade-Status'],
    ['upgradeCount', 'Anzahl laufender Upgrades'],
    ['upgradeHour', 'Upgrade-Endstunde'],
    ['attack', 'Angriff möglich'],
    ['hijack', 'Hijack-Status'],
    ['hijackLevel', 'Hijack-Level'],
    ['hijackCombined', 'Hijack-Status + Level'],
    ['os', 'Betriebssystem'],
    ['namePrefix', 'Namenspräfix'],
    ['nameNumber10', 'Namensnummer in 10er-Schritten'],
    ['pcNumber10', 'Listennummer in 10er-Schritten'],
    ['custom', 'Eigenes Suchmuster']
  ];

  const hideRuleOptions = [
    ['none', 'Nichts automatisch ausblenden'],
    ['name', 'Name enthält / RegExp'],
    ['country', 'Land enthält / RegExp'],
    ['ip', 'IP enthält / RegExp'],
    ['row', 'Ganze Zeile enthält / RegExp'],
    ['status', 'Status enthält / RegExp'],
    ['pointsBelow', 'Punkte kleiner als'],
    ['pointsAbove', 'Punkte größer als'],
    ['creditsBelow', 'Geld kleiner als'],
    ['creditsAbove', 'Geld größer als'],
    ['attackPossible', 'Angriff möglich'],
    ['attackNotPossible', 'Angriff nicht möglich'],
    ['hijackAvailable', 'Hijack verfügbar'],
    ['hijackUnavailable', 'Hijack nicht verfügbar/nicht ausgebaut'],
    ['upgradeRunning', 'Upgrade läuft'],
    ['noUpgrade', 'Kein Upgrade läuft'],
    ['statusOff', 'Status nicht An']
  ];

  const loadSettings = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem(OLD_STORAGE_KEY) || '{}');
      return Object.assign({}, defaultSettings, saved, {
        hiddenPcIds: Object.assign({}, saved.hiddenPcIds || {}),
        hiddenGroups: Object.assign({}, saved.hiddenGroups || {})
      });
    } catch (_) {
      return Object.assign({}, defaultSettings);
    }
  };

  const saveSettings = (settings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  };

  const normalize = (text) => (text || '').replace(/\s+/g, ' ').trim();
  const asNumber = (text) => Number(String(text || '').replace(/\./g, '').replace(/[^0-9,-]/g, '').replace(',', '.')) || 0;

  function init() {
    const list = Array.from(document.querySelectorAll('#computer-list')).find(el =>
      /Liste aller Computer/i.test(el.querySelector('h3')?.textContent || '') && el.querySelector('form table')
    );
    const title = list && list.querySelector(':scope > h3');
    const table = list && list.querySelector('form table');
    const tbody = table && table.tBodies && table.tBodies[0];
    if (!list || !title || !table || !tbody) return;

    list.querySelector('#htn-pc-group-controls')?.remove();
    tbody.querySelectorAll('tr.htn-pc-group-row').forEach(row => row.remove());

    const allRows = Array.from(tbody.rows);
    const headerRow = allRows.find(row => row.querySelector('th'));
    const dataRows = allRows.filter(row => row.querySelector('td') && !row.classList.contains('htn-pc-group-row'));
    if (!headerRow || dataRows.length === 0) return;

    const settings = loadSettings();
    injectStyles();
    ensureHideColumn(headerRow, dataRows, settings, null);

    const refresh = () => applyGrouping(tbody, headerRow, dataRows, settings, refresh);
    const controls = buildControls(settings, refresh);
    title.insertAdjacentElement('afterend', controls);
    applyGrouping(tbody, headerRow, dataRows, settings, refresh);
  }

  function buildControls(settings, onChange) {
    const box = document.createElement('div');
    box.id = 'htn-pc-group-controls';

    const groupLine = document.createElement('div');
    groupLine.className = 'htn-pc-control-line';

    const label = document.createElement('label');
    label.textContent = 'Gruppieren nach: ';

    const select = document.createElement('select');
    for (const [value, text] of groupOptions) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = text;
      select.appendChild(option);
    }
    select.value = settings.mode;

    const pattern = document.createElement('input');
    pattern.type = 'text';
    pattern.placeholder = 'RegExp, z. B. ^HM(\\d+) oder Japan|Ägypten';
    pattern.value = settings.customPattern;
    pattern.title = 'Bei eigenem Suchmuster wird die erste Treffergruppe verwendet. Ohne Klammer wird der ganze Treffer verwendet.';

    const collapseLabel = document.createElement('label');
    collapseLabel.className = 'htn-pc-checkbox-label';
    const collapsed = document.createElement('input');
    collapsed.type = 'checkbox';
    collapsed.checked = settings.collapsed;
    collapseLabel.append(collapsed, ' Gruppen einklappen');

    const hint = document.createElement('span');
    hint.className = 'htn-pc-group-hint';
    hint.textContent = ' Gruppenköpfe klappen ein/aus; Schaltfläche blendet eine ganze Gruppe aus.';

    label.appendChild(select);
    groupLine.append(label, pattern, collapseLabel, hint);

    const hideLine = document.createElement('div');
    hideLine.className = 'htn-pc-control-line';

    const hideLabel = document.createElement('label');
    hideLabel.textContent = 'Ausblenden: ';
    const hideSelect = document.createElement('select');
    for (const [value, text] of hideRuleOptions) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = text;
      hideSelect.appendChild(option);
    }
    hideSelect.value = settings.hideRuleMode;

    const hideValue = document.createElement('input');
    hideValue.type = 'text';
    hideValue.placeholder = 'Text, RegExp oder Zahl';
    hideValue.value = settings.hideRuleValue;
    hideValue.title = 'Für enthält/RegExp: Text oder regulärer Ausdruck. Für kleiner/größer: Grenzwert als Zahl.';

    const showHiddenLabel = document.createElement('label');
    showHiddenLabel.className = 'htn-pc-checkbox-label';
    const showHidden = document.createElement('input');
    showHidden.type = 'checkbox';
    showHidden.checked = settings.showHidden;
    showHiddenLabel.append(showHidden, ' Ausgeblendete anzeigen');

    const showColumnLabel = document.createElement('label');
    showColumnLabel.className = 'htn-pc-checkbox-label';
    const showColumn = document.createElement('input');
    showColumn.type = 'checkbox';
    showColumn.checked = settings.showHideColumn;
    showColumnLabel.append(showColumn, ' Einzel-Buttons anzeigen');

    const resetRows = document.createElement('button');
    resetRows.type = 'button';
    resetRows.textContent = 'Einzelausblendungen löschen';

    const resetGroups = document.createElement('button');
    resetGroups.type = 'button';
    resetGroups.textContent = 'Gruppenausblendungen löschen';

    hideLabel.appendChild(hideSelect);
    hideLine.append(hideLabel, hideValue, showHiddenLabel, showColumnLabel, resetRows, resetGroups);

    const updateVisibility = () => {
      pattern.style.display = select.value === 'custom' ? '' : 'none';
      const needsValue = ['name', 'country', 'ip', 'row', 'status', 'pointsBelow', 'pointsAbove', 'creditsBelow', 'creditsAbove'].includes(hideSelect.value);
      hideValue.style.display = needsValue ? '' : 'none';
      hideValue.placeholder = /points|credits/.test(hideSelect.value) ? 'Grenzwert, z. B. 1000' : 'Text oder RegExp';
    };

    select.addEventListener('change', () => {
      settings.mode = select.value;
      saveSettings(settings);
      updateVisibility();
      onChange();
    });
    pattern.addEventListener('input', () => {
      settings.customPattern = pattern.value;
      saveSettings(settings);
      onChange();
    });
    collapsed.addEventListener('change', () => {
      settings.collapsed = collapsed.checked;
      saveSettings(settings);
      onChange();
    });
    hideSelect.addEventListener('change', () => {
      settings.hideRuleMode = hideSelect.value;
      saveSettings(settings);
      updateVisibility();
      onChange();
    });
    hideValue.addEventListener('input', () => {
      settings.hideRuleValue = hideValue.value;
      saveSettings(settings);
      onChange();
    });
    showHidden.addEventListener('change', () => {
      settings.showHidden = showHidden.checked;
      saveSettings(settings);
      onChange();
    });
    showColumn.addEventListener('change', () => {
      settings.showHideColumn = showColumn.checked;
      saveSettings(settings);
      onChange();
    });
    resetRows.addEventListener('click', () => {
      settings.hiddenPcIds = {};
      saveSettings(settings);
      onChange();
    });
    resetGroups.addEventListener('click', () => {
      settings.hiddenGroups = {};
      saveSettings(settings);
      onChange();
    });

    box.append(groupLine, hideLine);
    updateVisibility();
    return box;
  }

  function applyGrouping(tbody, headerRow, dataRows, settings, refresh) {
    tbody.querySelectorAll('tr.htn-pc-group-row').forEach(row => row.remove());
    ensureHideColumn(headerRow, dataRows, settings, refresh);

    dataRows.forEach(row => {
      row.style.display = '';
      row.classList.remove('htn-pc-grouped-hidden', 'htn-pc-hidden-preview');
    });
    tbody.textContent = '';
    tbody.appendChild(headerRow);

    const rowInfos = dataRows.map(row => {
      const data = getRowData(row);
      const key = getGroupKey(row, settings, data);
      const pcKey = getPcKey(row, data);
      const groupHidden = settings.mode !== 'none' && Boolean(settings.hiddenGroups[groupStorageKey(settings.mode, key)]);
      const hiddenReason = getHiddenReason(row, data, settings, pcKey, groupHidden);
      return { row, data, key, pcKey, hiddenReason, hidden: Boolean(hiddenReason) };
    });

    const appendRow = (info) => {
      info.row.classList.toggle('htn-pc-hidden-preview', info.hidden);
      info.row.title = info.hidden ? `Ausgeblendet: ${info.hiddenReason}` : '';
      updateHideButton(info.row, info.data, settings, refresh, info.pcKey, info.hidden);
      tbody.appendChild(info.row);
    };

    if (settings.mode === 'none') {
      rowInfos.forEach(info => {
        if (!info.hidden || settings.showHidden) appendRow(info);
      });
      return;
    }

    const groups = new Map();
    rowInfos.forEach(info => {
      if (!groups.has(info.key)) groups.set(info.key, []);
      groups.get(info.key).push(info);
    });

    Array.from(groups.entries()).sort((a, b) => naturalCompare(a[0], b[0])).forEach(([key, infos]) => {
      const visibleInfos = infos.filter(info => !info.hidden || settings.showHidden);
      if (visibleInfos.length === 0) return;

      const storageKey = groupStorageKey(settings.mode, key);
      const groupIsHidden = Boolean(settings.hiddenGroups[storageKey]);
      const hiddenCount = infos.filter(info => info.hidden).length;

      const groupRow = document.createElement('tr');
      groupRow.className = 'htn-pc-group-row';
      groupRow.classList.toggle('htn-pc-hidden-preview', groupIsHidden);
      const cell = document.createElement('td');
      cell.colSpan = getHeaderColSpan(headerRow);

      const title = document.createElement('span');
      title.className = 'htn-pc-group-title';
      title.textContent = `${key} (${infos.length}${hiddenCount ? `, ${hiddenCount} ausgeblendet` : ''})`;

      const groupButton = document.createElement('button');
      groupButton.type = 'button';
      groupButton.className = 'htn-pc-group-hide-button';
      groupButton.textContent = groupIsHidden ? 'Gruppe einblenden' : 'Gruppe ausblenden';
      groupButton.addEventListener('click', (event) => {
        event.stopPropagation();
        if (settings.hiddenGroups[storageKey]) delete settings.hiddenGroups[storageKey];
        else settings.hiddenGroups[storageKey] = key;
        saveSettings(settings);
        refresh();
      });

      cell.append(title, groupButton);
      groupRow.appendChild(cell);
      tbody.appendChild(groupRow);

      const setCollapsed = (isCollapsed) => {
        visibleInfos.forEach(info => {
          info.row.style.display = isCollapsed ? 'none' : '';
          info.row.classList.toggle('htn-pc-grouped-hidden', isCollapsed);
        });
        groupRow.classList.toggle('htn-pc-collapsed', isCollapsed);
      };
      groupRow.addEventListener('click', () => setCollapsed(!groupRow.classList.contains('htn-pc-collapsed')));
      visibleInfos.forEach(appendRow);
      setCollapsed(Boolean(settings.collapsed));
    });
  }

  function ensureHideColumn(headerRow, dataRows, settings, refresh) {
    let headerCell = headerRow.querySelector('th.htn-pc-hide-column');
    if (settings.showHideColumn && !headerCell) {
      headerCell = document.createElement('th');
      headerCell.className = 'htn-pc-hide-column';
      headerCell.textContent = 'Ausblenden';
      headerRow.appendChild(headerCell);
    } else if (!settings.showHideColumn && headerCell) {
      headerCell.remove();
    }

    dataRows.forEach(row => {
      let cell = row.querySelector('td.htn-pc-hide-column');
      if (settings.showHideColumn && !cell) {
        cell = document.createElement('td');
        cell.className = 'htn-pc-hide-column';
        row.appendChild(cell);
      } else if (!settings.showHideColumn && cell) {
        cell.remove();
      }
      if (settings.showHideColumn && cell) updateHideButton(row, getRowData(row), settings, refresh);
    });
  }

  function updateHideButton(row, data, settings, refresh, explicitPcKey, isHidden) {
    const cell = row.querySelector('td.htn-pc-hide-column');
    if (!cell) return;
    const pcKey = explicitPcKey || getPcKey(row, data);
    const manuallyHidden = Boolean(settings.hiddenPcIds[pcKey]);
    const hidden = typeof isHidden === 'boolean' ? isHidden : manuallyHidden;
    cell.textContent = '';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = manuallyHidden ? 'einblenden' : 'ausblenden';
    button.title = manuallyHidden ? 'Diesen PC wieder anzeigen' : 'Diesen PC komplett aus der Liste ausblenden';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (settings.hiddenPcIds[pcKey]) delete settings.hiddenPcIds[pcKey];
      else settings.hiddenPcIds[pcKey] = data.name || pcKey;
      saveSettings(settings);
      if (typeof refresh === 'function') refresh();
    });
    cell.appendChild(button);
    cell.classList.toggle('htn-pc-hidden-preview', hidden);
  }

  function getHiddenReason(row, data, settings, pcKey, groupHidden) {
    if (settings.hiddenPcIds[pcKey]) return 'einzeln ausgeblendet';
    if (groupHidden) return 'Gruppe ausgeblendet';
    return getRuleHiddenReason(row, data, settings);
  }

  function getRuleHiddenReason(row, data, settings) {
    const mode = settings.hideRuleMode;
    const value = settings.hideRuleValue;
    switch (mode) {
      case 'none': return '';
      case 'name': return matchesText(data.name, value) ? 'Name-Regel' : '';
      case 'country': return matchesText(data.country, value) ? 'Land-Regel' : '';
      case 'ip': return matchesText(data.ip, value) ? 'IP-Regel' : '';
      case 'row': return matchesText(normalize(row.textContent), value) ? 'Zeilen-Regel' : '';
      case 'status': return matchesText(data.status, value) ? 'Status-Regel' : '';
      case 'pointsBelow': return data.points < asNumber(value) ? `Punkte < ${value}` : '';
      case 'pointsAbove': return data.points > asNumber(value) ? `Punkte > ${value}` : '';
      case 'creditsBelow': return data.credits < asNumber(value) ? `Geld < ${value}` : '';
      case 'creditsAbove': return data.credits > asNumber(value) ? `Geld > ${value}` : '';
      case 'attackPossible': return data.attackPossible ? 'Angriff möglich' : '';
      case 'attackNotPossible': return !data.attackPossible ? 'Angriff nicht möglich' : '';
      case 'hijackAvailable': return data.hijackAvailable ? 'Hijack verfügbar' : '';
      case 'hijackUnavailable': return !data.hijackAvailable ? 'Hijack nicht verfügbar' : '';
      case 'upgradeRunning': return data.upgradeCount > 0 ? 'Upgrade läuft' : '';
      case 'noUpgrade': return data.upgradeCount === 0 ? 'Kein Upgrade' : '';
      case 'statusOff': return !/^an$/i.test(data.status) ? 'Status nicht An' : '';
      default: return '';
    }
  }

  function getGroupKey(row, settings, data = getRowData(row)) {
    switch (settings.mode) {
      case 'country': return data.country || 'Ohne Land';
      case 'countrySubnet': return `${data.country || 'Ohne Land'} / ${data.subnet3 || 'Ohne Subnetz'}`;
      case 'subnet2': return data.subnet2 ? data.subnet2 + '.x.x' : 'Ohne Subnetz';
      case 'subnet': return data.subnet3 ? data.subnet3 + '.x' : 'Ohne Subnetz';
      case 'ipFirst': return data.ipParts[0] ? data.ipParts[0] + '.x.x.x' : 'Ohne IP';
      case 'ipLastRange25': return data.ipParts.length === 4 ? numberRange(Number(data.ipParts[3]), 25, 'letzter IP-Block') : 'Ohne IP';
      case 'status': return data.status || 'Ohne Status';
      case 'pointsExact': return `${formatNumber(data.points)} Punkte`;
      case 'points100': return numberRange(data.points, 100, 'Punkte');
      case 'points250': return numberRange(data.points, 250, 'Punkte');
      case 'points500': return numberRange(data.points, 500, 'Punkte');
      case 'points1000': return numberRange(data.points, 1000, 'Punkte');
      case 'credits25k': return numberRange(data.credits, 25000, 'Credits');
      case 'credits50k': return numberRange(data.credits, 50000, 'Credits');
      case 'credits100k': return numberRange(data.credits, 100000, 'Credits');
      case 'credits250k': return numberRange(data.credits, 250000, 'Credits');
      case 'upgrade': {
        if (data.upgradeText === '-') return 'Keine Upgrades';
        return data.upgradeCount > 0 ? `${data.upgradeCount} Upgrades laufen` : data.upgradeText || 'Ohne Upgrade-Status';
      }
      case 'upgradeCount': return data.upgradeCount === 0 ? '0 Upgrades' : `${data.upgradeCount} Upgrades`;
      case 'upgradeHour': return data.upgradeHour ? `bis ${data.upgradeHour} Uhr` : 'Ohne laufendes Upgrade';
      case 'attack': return data.attackPossible ? 'Angriff möglich' : 'Kein Angriff';
      case 'hijack': {
        if (data.hijackAvailable) return 'Hijack verfügbar';
        if (/nicht ausgebaut/i.test(data.hijackText)) return 'Hijack nicht ausgebaut';
        return data.hijackText || 'Ohne Hijack-Status';
      }
      case 'hijackLevel': return Number.isFinite(data.hijackLevel) ? `Level ${data.hijackLevel}` : 'Ohne Level';
      case 'hijackCombined': return `${data.hijackAvailable ? 'verfügbar' : 'nicht verfügbar'} / ${Number.isFinite(data.hijackLevel) ? `Level ${data.hijackLevel}` : 'ohne Level'}`;
      case 'os': return data.os || 'Ohne Betriebssystem';
      case 'namePrefix': return data.namePrefix || 'Sonstige Namen';
      case 'nameNumber10': return Number.isFinite(data.nameNumber) ? numberRange(data.nameNumber, 10, 'Namensnummer') : 'Ohne Namensnummer';
      case 'pcNumber10': return numberRange(data.number, 10, 'Listennummer');
      case 'custom': return customGroup(row, settings.customPattern);
      default: return 'Nicht gruppiert';
    }
  }

  function getRowData(row) {
    const cell = (selector) => row.querySelector(selector);
    const text = (selector) => normalize(cell(selector)?.textContent);
    const ipFull = text('td.ip');
    const ipMatch = ipFull.match(/\b(\d+)\.(\d+)\.(\d+)\.(\d+)\b/);
    const countryMatch = ipFull.match(/\(([^)]+)\)/);
    const name = text('td.name');
    const nameNumberMatch = name.match(/(\d+)/);
    const upgradeText = text('td.upgrade');
    const upgradeCountMatch = upgradeText.match(/^(\d+)\s+Upgrades?/i);
    const upgradeHourMatch = upgradeText.match(/bis\s+(\d{1,2}):/i);
    const hijackText = text('td.hijack');
    const hijackLevelMatch = hijackText.match(/Level\s+(\d+)/i);
    const osImg = row.querySelector('td.name + td img[title], td img[title]');

    return {
      number: asNumber(text('td.number')),
      name,
      namePrefix: (name.match(/^([^0-9\s_-]+)/) || [])[1] || '',
      nameNumber: nameNumberMatch ? Number(nameNumberMatch[1]) : NaN,
      os: osImg?.getAttribute('title') || '',
      ip: ipMatch ? ipMatch[0] : ipFull,
      ipParts: ipMatch ? ipMatch.slice(1) : [],
      subnet2: ipMatch ? `${ipMatch[1]}.${ipMatch[2]}` : '',
      subnet3: ipMatch ? `${ipMatch[1]}.${ipMatch[2]}.${ipMatch[3]}` : '',
      country: countryMatch ? countryMatch[1] : '',
      status: text('td.status'),
      points: asNumber(text('td.points')),
      credits: asNumber(text('td.credits')),
      upgradeText,
      upgradeCount: upgradeCountMatch ? Number(upgradeCountMatch[1]) : 0,
      upgradeHour: upgradeHourMatch ? upgradeHourMatch[1].padStart(2, '0') : '',
      attackText: text('td.attack'),
      attackPossible: /möglich/i.test(text('td.attack')) && !/nicht möglich/i.test(text('td.attack')),
      hijackText,
      hijackAvailable: /verfügbar/i.test(hijackText),
      hijackLevel: hijackLevelMatch ? Number(hijackLevelMatch[1]) : NaN
    };
  }

  function getPcKey(row, data = getRowData(row)) {
    const href = row.querySelector('td.name a[href*="pcid="]')?.getAttribute('href') || '';
    const pcid = (href.match(/[?&]pcid=(\d+)/) || [])[1];
    return pcid ? `pcid:${pcid}` : `name:${data.name}|ip:${data.ip}`;
  }

  function groupStorageKey(mode, key) {
    return `${mode}::${key}`;
  }

  function matchesText(text, pattern) {
    const source = normalize(text).toLowerCase();
    const needle = normalize(pattern);
    if (!needle) return false;
    try {
      return new RegExp(needle, 'i').test(text);
    } catch (_) {
      return source.includes(needle.toLowerCase());
    }
  }

  function customGroup(row, pattern) {
    const source = normalize(row.textContent);
    if (!pattern) return 'Kein Suchmuster';
    try {
      const re = new RegExp(pattern, 'i');
      const match = source.match(re);
      return match ? (match[1] || match[0]) : 'Kein Treffer';
    } catch (error) {
      return 'Ungültiges Suchmuster';
    }
  }

  function numberRange(value, step, suffix) {
    const safeValue = Number(value) || 0;
    const start = Math.floor(safeValue / step) * step;
    const end = start + step - 1;
    return `${formatNumber(start)} - ${formatNumber(end)} ${suffix}`;
  }

  function formatNumber(value) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function naturalCompare(a, b) {
    return String(a).localeCompare(String(b), 'de', { numeric: true, sensitivity: 'base' });
  }

  function getHeaderColSpan(headerRow) {
    return Array.from(headerRow.cells).reduce((sum, c) => sum + (c.colSpan || 1), 0) || 10;
  }

  function injectStyles() {
    if (document.getElementById('htn-pc-group-style')) return;
    const style = document.createElement('style');
    style.id = 'htn-pc-group-style';
    style.textContent = `
      #htn-pc-group-controls {
        margin: 8px 0 12px 80px;
        padding: 6px;
        border: 1px solid #777;
        background: rgba(255,255,255,0.08);
      }
      #htn-pc-group-controls .htn-pc-control-line {
        margin: 4px 0;
      }
      #htn-pc-group-controls select,
      #htn-pc-group-controls input[type="text"],
      #htn-pc-group-controls button {
        margin-left: 4px;
        margin-right: 8px;
      }
      #htn-pc-group-controls input[type="text"] {
        width: 250px;
        max-width: 35vw;
      }
      .htn-pc-checkbox-label {
        white-space: nowrap;
      }
      .htn-pc-group-hint {
        opacity: 0.8;
        font-size: 90%;
      }
      #computer-list tr.htn-pc-group-row td {
        cursor: pointer;
        font-weight: bold;
        padding: 5px 8px;
        border-top: 2px solid #777;
        border-bottom: 1px solid #777;
        background: rgba(128,128,128,0.25);
      }
      #computer-list tr.htn-pc-group-row.htn-pc-collapsed td::before { content: '+ '; }
      #computer-list tr.htn-pc-group-row:not(.htn-pc-collapsed) td::before { content: '- '; }
      #computer-list .htn-pc-group-hide-button {
        float: right;
        font-weight: normal;
      }
      #computer-list tr.htn-pc-hidden-preview td,
      #computer-list td.htn-pc-hidden-preview {
        opacity: 0.55;
        text-decoration: line-through;
      }
      #computer-list th.htn-pc-hide-column,
      #computer-list td.htn-pc-hide-column {
        text-align: center;
        white-space: nowrap;
      }
      #computer-list td.htn-pc-hide-column button,
      #computer-list .htn-pc-group-hide-button {
        cursor: pointer;
        padding: 1px 5px;
      }
    `;
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
