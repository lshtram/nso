import { XMLParser } from 'fast-xml-parser';

export class FeedParser {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      allowBooleanAttributes: true,
      parseTagValue: false, // Keep values as strings for safety
      trimValues: true,
      isArray: (name) => {
        return ['item', 'entry'].indexOf(name) !== -1;
      }
    });
  }

  parse(xml: string): any {
    try {
      const result = this.parser.parse(xml);
      if (!result || (Object.keys(result).length === 0 && xml.trim().length > 0)) {
         throw new Error('Empty result');
      }
      
      const keys = Object.keys(result);
      if (!keys.some(k => ['rss', 'feed', 'rdf:RDF'].includes(k))) {
        throw new Error('Invalid feed format: Missing root element (rss/feed/rdf:RDF)');
      }
      return result;
    } catch (error) {
      if (error instanceof Error) {
         throw error;
      }
      throw new Error(`XML Parsing failed: ${String(error)}`);
    }
  }
}
