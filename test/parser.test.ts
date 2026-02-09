import { describe, it, expect, beforeEach } from 'vitest';
import { FeedParser } from '../src/services/rss/parser';

const RSS_SAMPLE = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>W3Schools Home Page</title>
  <link>https://www.w3schools.com</link>
  <description>Free web building tutorials</description>
  <item>
    <title>RSS Tutorial</title>
    <link>https://www.w3schools.com/xml/xml_rss.asp</link>
    <description>New RSS tutorial on W3Schools</description>
    <pubDate>Thu, 27 Apr 2006 01:00:00 +0000</pubDate>
    <guid>https://www.w3schools.com/xml/xml_rss.asp</guid>
  </item>
  <item>
    <title>XML Tutorial</title>
    <link>https://www.w3schools.com/xml/default.asp</link>
    <description>New XML tutorial on W3Schools</description>
    <pubDate>Thu, 27 Apr 2006 02:00:00 +0000</pubDate>
    <guid>https://www.w3schools.com/xml/default.asp</guid>
  </item>
</channel>
</rss>`;

const ATOM_SAMPLE = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Example Feed</title>
  <link href="http://example.org/"/>
  <updated>2003-12-13T18:30:02Z</updated>
  <author>
    <name>John Doe</name>
  </author>
  <id>urn:uuid:60a76c80-d399-11d9-b93C-0003939e0af6</id>
  <entry>
    <title>Atom-Powered Robots Run Amok</title>
    <link href="http://example.org/2003/12/13/atom03"/>
    <id>urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a</id>
    <updated>2003-12-13T18:30:02Z</updated>
    <summary>Some text.</summary>
  </entry>
</feed>`;

describe('FeedParser', () => {
  let parser: FeedParser;

  beforeEach(() => {
    parser = new FeedParser();
  });

  it('should parse RSS 2.0 feed', () => {
    const result = parser.parse(RSS_SAMPLE);
    expect(result).toBeDefined();
    expect(result.rss.channel.title).toBe('W3Schools Home Page');
    expect(result.rss.channel.item).toHaveLength(2);
    expect(result.rss.channel.item[0].title).toBe('RSS Tutorial');
  });

  it('should parse Atom 1.0 feed', () => {
    const result = parser.parse(ATOM_SAMPLE);
    expect(result).toBeDefined();
    expect(result.feed.title).toBe('Example Feed');
    expect(result.feed.entry).toBeDefined();
    // fast-xml-parser parses single entry as object unless configured to array.
    // We should configure it to always array for repeatable access.
    // Or handle it in normalization.
    // Let's assume parser just returns raw object for now.
    // But strict array mode is safer.
  });

  it('should throw error on invalid XML', () => {
    expect(() => parser.parse('invalid xml')).toThrow();
  });
});
