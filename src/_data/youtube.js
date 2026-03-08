require('dotenv').config();

const fs = require("fs");
const path = require("path");
const { readCache, readCacheIfFresh, writeCache, fetchWithTimeout } = require('./_apiCache');

const CACHE_TTL_HOURS = 6;
const site = require('./site.json');

const CACHE_KEY = 'youtube-playlists-v1';
const API_BASE = 'https://www.googleapis.com/youtube/v3';
const CMS_CONFIG_PATH = path.join(process.cwd(), "src", "_data", "youtube-config.json");

function readCmsYoutubeConfig() {
  if (!fs.existsSync(CMS_CONFIG_PATH)) {
    return {};
  }

  try {
    const raw = fs.readFileSync(CMS_CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw);
    const tickerLimit = Number(parsed?.tickerLimit);
    return {
      profileUrl: typeof parsed?.profileUrl === "string" ? parsed.profileUrl.trim() : "",
      channelId: typeof parsed?.channelId === "string" ? parsed.channelId.trim() : "",
      handle: typeof parsed?.handle === "string" ? parsed.handle.trim() : "",
      username: typeof parsed?.username === "string" ? parsed.username.trim() : "",
      channelQuery: typeof parsed?.channelQuery === "string" ? parsed.channelQuery.trim() : "",
      tickerLimit: Number.isFinite(tickerLimit) && tickerLimit > 0 ? tickerLimit : null
    };
  } catch (error) {
    console.warn(`YouTube: CMS config read failed: ${error.message}`);
    return {};
  }
}

function findYoutubeProfileUrl(cmsConfig = {}) {
  const links = Array.isArray(site?.sameAs) ? site.sameAs : [];
  return (
    process.env.YOUTUBE_PROFILE_URL ||
    cmsConfig.profileUrl ||
    links.find((link) => /youtube\.com|youtu\.be/i.test(link)) ||
    null
  );
}

function parseProfileHints(profileUrl) {
  if (!profileUrl) return {};

  try {
    const url = new URL(profileUrl);
    const path = url.pathname.replace(/^\/+|\/+$/g, '');
    const segments = path.split('/').filter(Boolean);

    if (!segments.length) return {};

    if (segments[0] === 'channel' && segments[1]) {
      return { channelId: segments[1] };
    }

    if (segments[0].startsWith('@')) {
      return { handle: segments[0].slice(1) };
    }

    if (segments[0] === 'user' && segments[1]) {
      return { username: segments[1] };
    }

    if (segments[0] === 'c' && segments[1]) {
      return { query: segments[1] };
    }

    // Legacy custom paths e.g. /jarilaru
    return { query: segments[0], username: segments[0] };
  } catch {
    return {};
  }
}

async function ytRequest(endpoint, params, apiKey) {
  const url = new URL(`${API_BASE}/${endpoint}`);
  Object.entries({ ...params, key: apiKey }).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, String(v));
    }
  });

  const response = await fetchWithTimeout(url.toString(), {}, 15000);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`YouTube API ${endpoint} failed (${response.status}): ${body.slice(0, 200)}`);
  }

  return response.json();
}

async function resolveChannelId(apiKey, hints, settings) {
  if (settings.channelId) {
    return settings.channelId;
  }

  if (hints.channelId) {
    return hints.channelId;
  }

  const handle = settings.handle || hints.handle;
  if (handle) {
    const byHandle = await ytRequest(
      'channels',
      { part: 'id', forHandle: handle, maxResults: 1 },
      apiKey
    );
    if (byHandle?.items?.[0]?.id) return byHandle.items[0].id;
  }

  const username = settings.username || hints.username;
  if (username) {
    const byUsername = await ytRequest(
      'channels',
      { part: 'id', forUsername: username, maxResults: 1 },
      apiKey
    );
    if (byUsername?.items?.[0]?.id) return byUsername.items[0].id;
  }

  const fallbackQuery = settings.channelQuery || hints.query || 'jarilaru';
  if (fallbackQuery) {
    const queryAsUsername = await ytRequest(
      'channels',
      { part: 'id', forUsername: fallbackQuery, maxResults: 1 },
      apiKey
    );
    if (queryAsUsername?.items?.[0]?.id) return queryAsUsername.items[0].id;
  }

  const bySearch = await ytRequest(
    'search',
    { part: 'snippet', type: 'channel', q: fallbackQuery, maxResults: 1 },
    apiKey
  );

  return bySearch?.items?.[0]?.snippet?.channelId || null;
}

function normalizeChannel(channel, profileUrl) {
  if (!channel) return null;

  const thumb =
    channel?.snippet?.thumbnails?.high?.url ||
    channel?.snippet?.thumbnails?.medium?.url ||
    channel?.snippet?.thumbnails?.default?.url ||
    null;

  return {
    id: channel.id,
    title: channel?.snippet?.title || 'YouTube-kanava',
    description: channel?.snippet?.description || '',
    thumbnail: thumb,
    url: profileUrl || `https://www.youtube.com/channel/${channel.id}`,
    customUrl: channel?.snippet?.customUrl || null,
    subscribers: Number(channel?.statistics?.subscriberCount || 0),
    videos: Number(channel?.statistics?.videoCount || 0)
  };
}

function normalizePlaylist(item) {
  const thumb =
    item?.snippet?.thumbnails?.high?.url ||
    item?.snippet?.thumbnails?.medium?.url ||
    item?.snippet?.thumbnails?.default?.url ||
    null;

  return {
    id: item.id,
    title: item?.snippet?.title || 'Nimetön soittolista',
    description: item?.snippet?.description || '',
    publishedAt: item?.snippet?.publishedAt || null,
    itemCount: Number(item?.contentDetails?.itemCount || 0),
    privacyStatus: item?.status?.privacyStatus || 'public',
    thumbnail: thumb,
    url: `https://www.youtube.com/playlist?list=${item.id}`
  };
}

async function fetchAllPlaylists(channelId, apiKey) {
  const playlists = [];
  let pageToken = '';

  do {
    const data = await ytRequest(
      'playlists',
      {
        part: 'snippet,contentDetails,status',
        channelId,
        maxResults: 50,
        pageToken
      },
      apiKey
    );

    const items = Array.isArray(data?.items) ? data.items : [];
    playlists.push(...items.map(normalizePlaylist));
    pageToken = data?.nextPageToken || '';
  } while (pageToken);

  return playlists;
}

module.exports = async function () {
  const cmsConfig = readCmsYoutubeConfig();

  const fresh = readCacheIfFresh(CACHE_KEY, CACHE_TTL_HOURS);
  if (fresh?.data) {
    console.log(`YouTube: käytetään tuoretta välimuistia (${fresh.savedAt}).`);
    return { ...fresh.data, source: 'cache', cacheSavedAt: fresh.savedAt };
  }

  const cached = readCache(CACHE_KEY);
  const cachedData = cached?.data || null;
  const settings = {
    channelId: process.env.YOUTUBE_CHANNEL_ID || cmsConfig.channelId || "",
    handle: process.env.YOUTUBE_HANDLE || cmsConfig.handle || "",
    username: process.env.YOUTUBE_USERNAME || cmsConfig.username || "",
    channelQuery: process.env.YOUTUBE_CHANNEL_QUERY || cmsConfig.channelQuery || ""
  };
  const profileUrl = findYoutubeProfileUrl(cmsConfig);
  const hints = parseProfileHints(profileUrl);
  const apiKey = process.env.YOUTUBE_API_KEY;
  const playlistTickerLimit = Number(process.env.YOUTUBE_PLAYLIST_TICKER_LIMIT || cmsConfig.tickerLimit || 12);

  if (!apiKey) {
    if (cachedData) {
      console.warn(`YouTube: YOUTUBE_API_KEY puuttuu, käytetään välimuistia (${cached.savedAt}).`);
      return { ...cachedData, source: 'cache', cacheSavedAt: cached.savedAt };
    }

    return {
      enabled: false,
      source: 'disabled',
      profileUrl,
      channel: null,
      playlists: [],
      tableRows: [],
      tickerRows: [],
      fetchedAt: new Date().toISOString(),
      error: 'YOUTUBE_API_KEY puuttuu'
    };
  }

  try {
    console.log('Haetaan YouTube-soittolistat...');

    const channelId = await resolveChannelId(apiKey, hints, settings);
    if (!channelId) {
      throw new Error('YouTube-kanavaa ei voitu tunnistaa');
    }

    const channelData = await ytRequest(
      'channels',
      { part: 'snippet,contentDetails,statistics', id: channelId, maxResults: 1 },
      apiKey
    );

    const channel = normalizeChannel(channelData?.items?.[0], profileUrl);
    const playlists = await fetchAllPlaylists(channelId, apiKey);

    playlists.sort((a, b) => {
      const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return bTime - aTime;
    });

    const tableRows = playlists;
    const tickerRows = playlists.slice(0, playlistTickerLimit);

    const result = {
      enabled: true,
      source: 'live',
      profileUrl: channel?.url || profileUrl,
      channel,
      playlists,
      tableRows,
      tickerRows,
      fetchedAt: new Date().toISOString()
    };

    writeCache(CACHE_KEY, result);
    console.log(`YouTube: löytyi ${playlists.length} soittolistaa.`);
    return result;
  } catch (error) {
    console.error('YouTube API haku epäonnistui:', error.message);

    if (cachedData) {
      console.warn(`YouTube: käytetään välimuistia (${cached.savedAt}).`);
      return {
        ...cachedData,
        source: 'cache',
        cacheSavedAt: cached.savedAt,
        error: error.message
      };
    }

    return {
      enabled: true,
      source: 'error',
      profileUrl,
      channel: null,
      playlists: [],
      tableRows: [],
      tickerRows: [],
      fetchedAt: new Date().toISOString(),
      error: error.message
    };
  }
};
