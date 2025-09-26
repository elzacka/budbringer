/**
 * Robots.txt compliance checker for RSS feed fetching
 */

interface RobotsRules {
  allowed: boolean;
  crawlDelay?: number;
  disallowedPaths: string[];
  allowedPaths: string[];
}

const robotsCache = new Map<string, { rules: RobotsRules; expires: number }>();
const CACHE_DURATION = 3600000; // 1 hour cache
const USER_AGENT = 'Budbringer-Bot';

/**
 * Parse robots.txt content for our user agent
 */
function parseRobotsTxt(content: string, userAgent: string): RobotsRules {
  const lines = content.split('\n').map(line => line.trim());
  const rules: RobotsRules = {
    allowed: true,
    disallowedPaths: [],
    allowedPaths: []
  };

  let currentUserAgent = '';
  let isRelevantSection = false;

  for (const line of lines) {
    if (line.startsWith('#') || !line) continue;

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const directive = line.substring(0, colonIndex).toLowerCase().trim();
    const value = line.substring(colonIndex + 1).trim();

    if (directive === 'user-agent') {
      currentUserAgent = value.toLowerCase();
      isRelevantSection = currentUserAgent === '*' ||
                         currentUserAgent === userAgent.toLowerCase() ||
                         currentUserAgent.includes('bot');
    } else if (isRelevantSection) {
      switch (directive) {
        case 'disallow':
          if (value) {
            rules.disallowedPaths.push(value);
          }
          break;
        case 'allow':
          if (value) {
            rules.allowedPaths.push(value);
          }
          break;
        case 'crawl-delay':
          const delay = parseInt(value);
          if (!isNaN(delay)) {
            rules.crawlDelay = delay * 1000; // Convert to milliseconds
          }
          break;
      }
    }
  }

  return rules;
}

/**
 * Check if a path is allowed by robots.txt rules
 */
function isPathAllowed(path: string, rules: RobotsRules): boolean {
  // Check explicit allow rules first (more specific)
  for (const allowedPath of rules.allowedPaths) {
    if (path.startsWith(allowedPath)) {
      return true;
    }
  }

  // Then check disallow rules
  for (const disallowedPath of rules.disallowedPaths) {
    if (path.startsWith(disallowedPath)) {
      return false;
    }
  }

  // Default to allowed if no specific rules match
  return true;
}

/**
 * Fetch and parse robots.txt for a domain
 */
async function fetchRobotsTxt(baseUrl: string): Promise<RobotsRules> {
  try {
    const url = new URL(baseUrl);
    const robotsUrl = `${url.protocol}//${url.host}/robots.txt`;

    const response = await fetch(robotsUrl, {
      headers: {
        'User-Agent': `${USER_AGENT}/1.0 (+https://budbringer.no)`
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (!response.ok) {
      // If robots.txt doesn't exist, allow by default
      return {
        allowed: true,
        disallowedPaths: [],
        allowedPaths: []
      };
    }

    const content = await response.text();
    return parseRobotsTxt(content, USER_AGENT);

  } catch (error) {
    console.warn(`Could not fetch robots.txt for ${baseUrl}:`, error);
    // If we can't fetch robots.txt, allow by default (fail open)
    return {
      allowed: true,
      disallowedPaths: [],
      allowedPaths: []
    };
  }
}

/**
 * Check if we're allowed to fetch a URL according to robots.txt
 */
export async function isUrlAllowed(url: string): Promise<{ allowed: boolean; crawlDelay?: number }> {
  try {
    const urlObj = new URL(url);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    const path = urlObj.pathname;

    // Check cache first
    const cached = robotsCache.get(baseUrl);
    const now = Date.now();

    let rules: RobotsRules;

    if (cached && now < cached.expires) {
      rules = cached.rules;
    } else {
      // Fetch and cache robots.txt
      rules = await fetchRobotsTxt(baseUrl);
      robotsCache.set(baseUrl, {
        rules,
        expires: now + CACHE_DURATION
      });
    }

    const allowed = isPathAllowed(path, rules);

    return {
      allowed,
      crawlDelay: rules.crawlDelay
    };

  } catch (error) {
    console.warn(`Error checking robots.txt for ${url}:`, error);
    // Fail open - allow if we can't determine
    return { allowed: true };
  }
}

/**
 * Get the appropriate crawl delay for a domain
 */
export async function getCrawlDelay(url: string): Promise<number> {
  const result = await isUrlAllowed(url);
  return result.crawlDelay || 1000; // Default 1 second delay
}

/**
 * Clear the robots.txt cache (useful for testing)
 */
export function clearRobotsCache(): void {
  robotsCache.clear();
}