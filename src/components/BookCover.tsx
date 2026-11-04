import React, { useEffect, useState } from 'react';
import { Book } from 'lucide-react';

interface BookCoverProps {
  coverUrl: string | null | undefined;
  isbn?: string | null;
  title: string;
  className?: string;
  iconClassName?: string;
}

interface GoogleBooksResponse {
  items?: Array<{ volumeInfo?: { imageLinks?: { extraLarge?: string; large?: string; medium?: string; thumbnail?: string; smallThumbnail?: string } } }>;
}

interface OpenLibraryIsbnResponse {
  covers?: number[];
  cover?: number;
}

const MIN_BYTES = 2000;

function isbn13to10(isbn: string): string | null {
  if (isbn.length !== 13 || !isbn.startsWith('978')) return null;
  const core = isbn.slice(3, 12);
  const sum = [...core].reduce((s, d, k) => s + (10 - k) * +d, 0);
  const check = (11 - (sum % 11)) % 11;
  return core + (check === 10 ? 'X' : check);
}

async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
  try {
    const r = await fetch(url, { redirect: 'follow' });
    if (!r.ok) return null;
    const ct = r.headers.get('content-type') ?? '';
    if (!ct.startsWith('image/')) return null;
    const buf = new Uint8Array(await r.arrayBuffer());
    return buf.byteLength >= MIN_BYTES ? buf : null;
  } catch {
    return null;
  }
}

async function tryOpenLibraryCoverId(isbn: string): Promise<string | null> {
  try {
    const r = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
    if (!r.ok) return null;
    const data = (await r.json()) as OpenLibraryIsbnResponse;
    const coverId = data.covers?.find((c) => c > 0) ?? data.cover;
    if (!coverId) return null;
    const url = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
    const img = await fetchImageBytes(url);
    return img ? url : null;
  } catch {
    return null;
  }
}

async function tryGoogleBooks(isbn: string): Promise<string | null> {
  try {
    const r = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    if (!r.ok) return null;
    const data = (await r.json()) as GoogleBooksResponse;
    const links = data.items?.[0]?.volumeInfo?.imageLinks;
    const url = links?.extraLarge ?? links?.large ?? links?.medium ?? links?.thumbnail ?? links?.smallThumbnail;
    if (!url) return null;
    const httpsUrl = url.replace('http://', 'https://').replace('&edge=curl', '');
    const img = await fetchImageBytes(httpsUrl);
    return img ? httpsUrl : null;
  } catch {
    return null;
  }
}

async function tryDnb(isbn: string): Promise<string | null> {
  const url = `https://portal.dnb.de/opac/mvb/cover?isbn=${isbn}`;
  const img = await fetchImageBytes(url);
  return img ? url : null;
}

async function tryAmazon(isbn: string): Promise<string | null> {
  const i10 = isbn13to10(isbn);
  if (!i10) return null;
  const url = `https://images-na.ssl-images-amazon.com/images/P/${i10}.01.LZZZZZZZ.jpg`;
  const img = await fetchImageBytes(url);
  return img ? url : null;
}

async function findCoverUrl(isbn: string, existingUrl: string | null): Promise<string | null> {
  const clean = isbn.replace(/[^0-9X]/gi, '');
  if (clean.length < 10) return existingUrl ?? null;

  const sources = [tryOpenLibraryCoverId, tryGoogleBooks, tryDnb, tryAmazon];
  for (const src of sources) {
    const url = await src(clean).catch(() => null);
    if (url) return url;
  }
  return existingUrl ?? null;
}

export const BookCover: React.FC<BookCoverProps> = ({ coverUrl, isbn, title, className = '', iconClassName = '' }) => {
  const [displayUrl, setDisplayUrl] = useState<string | null | undefined>(coverUrl);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    setDisplayUrl(coverUrl);

    if (!isbn) return () => { cancelled = true; };
    const cleanIsbn = isbn.replace(/[^0-9X]/gi, '');
    if (cleanIsbn.length < 10) return () => { cancelled = true; };

    void findCoverUrl(cleanIsbn, coverUrl ?? null)
      .then((url) => {
        if (cancelled) return;
        if (url) setDisplayUrl(url);
        else setFailed(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => { cancelled = true; };
  }, [coverUrl, isbn]);

  if (!displayUrl || failed) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <Book className={iconClassName || 'w-16 h-16 text-gray-300'} />
      </div>
    );
  }

  return <img src={displayUrl} alt={title} className={className} onError={() => setFailed(true)} />;
};
