(function () {
  function initEventCalendar() {
    const button = document.querySelector('.event-calendar-btn');
    if (!button) {
      return;
    }

    const pad = (value) => String(value).padStart(2, '0');
    const toICSDate = (iso) => {
      const date = new Date(iso);
      return [
        date.getUTCFullYear(),
        pad(date.getUTCMonth() + 1),
        pad(date.getUTCDate())
      ].join('') + 'T' + [
        pad(date.getUTCHours()),
        pad(date.getUTCMinutes()),
        pad(date.getUTCSeconds())
      ].join('') + 'Z';
    };
    const escapeICS = (value) => (value || '')
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');

    button.addEventListener('click', () => {
      const title = button.dataset.title;
      const start = button.dataset.start;
      const end = button.dataset.end;
      const location = [button.dataset.location, button.dataset.address].filter(Boolean).join(', ');
      const description = [button.dataset.description, button.dataset.url].filter(Boolean).join('\n\n');
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'event';
      const nowStamp = toICSDate(new Date().toISOString());

      const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//RRROCA//Community Events//EN',
        'BEGIN:VEVENT',
        'UID:' + slug + '@rrroca.org',
        'DTSTAMP:' + nowStamp,
        'DTSTART:' + toICSDate(start),
        'DTEND:' + toICSDate(end),
        'SUMMARY:' + escapeICS(title),
        'LOCATION:' + escapeICS(location),
        'DESCRIPTION:' + escapeICS(description),
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = slug + '.ics';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEventCalendar);
  } else {
    initEventCalendar();
  }
})();
