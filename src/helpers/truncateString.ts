export const truncateString = (prefix: string, hashString: string) => {
  const prefixExists = hashString.startsWith(prefix);
  const returningPrefix = prefixExists ? prefix : '';
  const remainingHash = prefixExists ? hashString.slice(prefix.length) : hashString;

  let truncatedString = '';
  if (remainingHash.length > 11) {
    const first4 = remainingHash.slice(0, 4);
    const last4 = remainingHash.slice(-4);

    truncatedString = `${returningPrefix}${first4}...${last4}`;
  } else {
    truncatedString = `${returningPrefix}${remainingHash}`;
  }

  return truncatedString;
};
