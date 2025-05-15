import { ChatMessage } from '@/types/chat';

const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x\d+)?/g,
  ssn: /\b(?!000|666|9\d{2})([0-8]\d{2}|7([0-6]\d|7[012]))([-\s]?)(?!00)\d{2}\1(?!0000)\d{4}\b/g,
  creditCard: /\b(?:\d[ -]*?){13,19}\b/g,
  name: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g
};

function validateCreditCard(number: string): boolean {
  const digits = number.replace(/\D/g, '').split('').map(Number);
  const lastDigit = digits.pop()!;
  const sum = digits
    .reverse()
    .map((digit, index) => index % 2 === 0 ? digit * 2 : digit)
    .map(digit => digit > 9 ? digit - 9 : digit)
    .reduce((acc, digit) => acc + digit, 0);
  return (sum + lastDigit) % 10 === 0;
}

function validateSSN(ssn: string): boolean {
  const cleanSSN = ssn.replace(/\D/g, '');
  if (cleanSSN.length !== 9) return false;
  const [area, group, serial] = [
    cleanSSN.slice(0, 3),
    cleanSSN.slice(3, 5),
    cleanSSN.slice(5)
  ];
  if (area === '000' || area === '666' || area.startsWith('9')) return false;
  if (group === '00') return false;
  if (serial === '0000') return false;
  return true;
}

export function detectPII(text: string): { type: string; value: string; startIndex: number; endIndex: number }[] {
  const matches: { type: string; value: string; startIndex: number; endIndex: number }[] = [];

  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (type === 'creditCard' && !validateCreditCard(match[0])) continue;
      if (type === 'ssn' && !validateSSN(match[0])) continue;
      matches.push({
        type,
        value: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
  }

  return matches.sort((a, b) => a.startIndex - b.startIndex);
}

export function detectPIIInMessages(messages: ChatMessage[]): { type: string; value: string }[] {
  return messages.reduce((acc: { type: string; value: string }[], message) => {
    if (message.content) {
      acc.push(...detectPII(message.content).map(({ type, value }) => ({ type, value })));
    }
    return acc;
  }, []);
}

export function formatPIIReport(matches: { type: string; value: string }[]): string {
  if (matches.length === 0) return 'No PII detected in the document.';

  const groupedMatches = matches.reduce((acc, match) => {
    if (!acc[match.type]) acc[match.type] = [];
    acc[match.type].push(match.value);
    return acc;
  }, {} as Record<string, string[]>);

  const report = ['PII Detection Results:'];
  
  Object.entries(groupedMatches).forEach(([type, values]) => {
    const uniqueValues = [...new Set(values)];
    report.push(`\n${type}:`);
    uniqueValues.forEach(value => report.push(`- ${value}`));
  });

  return report.join('\n');
} 