export function formatTimestamp(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  const sameDay =
    now.getDate() === date.getDate() &&
    now.getMonth() === date.getMonth() &&
    now.getFullYear() === date.getFullYear();

  const label = (value, unit) => `${value} ${unit}${value === 1 ? '' : 's'} ago`;

  const formatWithinDayGranular = () => {
    if (diffInSeconds < 60) {
      return label(diffInSeconds, 'second');
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return label(diffInMinutes, 'minute');
    }

    return label(Math.floor(diffInMinutes / 60), 'hour');
  };

  if (sameDay) {
    return formatWithinDayGranular();
  }

  // Different calendar days but still within a 24-hour window (e.g. late night → after midnight).
  if (diffInSeconds < 86400) {
    return formatWithinDayGranular();
  }

  const diffInDays = Math.floor(diffInSeconds / 86400);
  if (diffInDays < 30) {
    return label(diffInDays, 'day');
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return label(diffInMonths, 'month');
  }

  return label(Math.floor(diffInMonths / 12), 'year');
}

export function validateHyperlinks(text) {
  const matches = [...text.matchAll(/\[([^\]]*)\]\(([^)]*)\)/g)];

  for (const match of matches) {
    const label = match[1].trim();
    const url = match[2].trim();

    if (!label) {
      return 'Hyperlink text cannot be empty.';
    }

    if (!url) {
      return 'Hyperlink URL cannot be empty.';
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'Hyperlink URL must begin with http:// or https://.';
    }
  }

  return '';
}

export function renderTextWithLinks(text) {
  const nodes = [];
  const pattern = /\[([^\]]*)\]\(([^)]*)\)/g;
  let lastIndex = 0;
  let match = pattern.exec(text);
  let keyIndex = 0;

  while (match) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const label = match[1];
    const url = match[2];
    nodes.push(
      <a key={`link-${keyIndex}`} href={url} target="_blank" rel="noreferrer">
        {label}
      </a>,
    );

    lastIndex = match.index + match[0].length;
    keyIndex += 1;
    match = pattern.exec(text);
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.map((node, index) => {
    if (typeof node === 'string') {
      const pieces = node.split('\n');
      return pieces.map((piece, pieceIndex) => (
        <span key={`text-${index}-${pieceIndex}`}>
          {piece}
          {pieceIndex < pieces.length - 1 ? <br /> : null}
        </span>
      ));
    }

    return node;
  });
}

function stripMarkdownLinksForPreview(raw) {
  return raw.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
}

export function getPreviewText(text) {
  const plain = stripMarkdownLinksForPreview(text);
  if (plain.length <= 80) {
    return plain;
  }

  return `${plain.slice(0, 80)}...`;
}