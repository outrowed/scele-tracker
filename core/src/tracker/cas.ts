import { CookieJar } from 'tough-cookie';
import { load } from 'cheerio';
import { XMLParser } from 'fast-xml-parser';
import { settings } from './config.js';
import { formatAcademicInfo, deriveProdi, deriveClassYear } from './student.js';

export function parseIdentity(xml: string) {
  if (xml.length > 100_000 || /<!DOCTYPE|<!ENTITY/i.test(xml))
    throw new Error('Invalid CAS response');
  const parsed = new XMLParser({ removeNSPrefix: true, parseTagValue: false }).parse(xml);
  const success = parsed?.serviceResponse?.authenticationSuccess;
  if (!success || typeof success.user !== 'string' || !success.user.trim())
    throw new Error('CAS authentication failed');
  const fullname = success.attributes?.nama || success.attributes?.cn || success.user;

  const npm = typeof success.attributes?.npm === 'string' ? success.attributes.npm : undefined;
  const kd_org = typeof success.attributes?.kd_org === 'string' ? success.attributes.kd_org : undefined;
  const jurusan = typeof success.attributes?.jurusan === 'string' ? success.attributes.jurusan : undefined;
  const prodiAttr = typeof success.attributes?.prodi === 'string' ? success.attributes.prodi : undefined;
  const angkatanAttr = typeof success.attributes?.angkatan === 'string' ? success.attributes.angkatan : undefined;

  const academicInfo = formatAcademicInfo({
    npm,
    kd_org,
    jurusan,
    prodi: prodiAttr,
    angkatan: angkatanAttr,
    username: success.user,
  });
  const prodi = deriveProdi(kd_org, jurusan, prodiAttr);
  const angkatan = angkatanAttr || deriveClassYear(npm) || deriveClassYear(success.user) || '2026';

  return {
    username: success.user,
    fullname: typeof fullname === 'string' ? fullname : success.user,
    npm,
    kd_org,
    prodi,
    angkatan,
    academicInfo,
  };
}

async function fetchWithJar(
  jar: CookieJar,
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('cookie', await jar.getCookieString(url));
  const response = await fetch(url, {
    ...init,
    headers,
    signal: init.signal || AbortSignal.timeout(15_000),
  });
  for (const setCookie of response.headers.getSetCookie()) {
    await jar.setCookie(setCookie, url);
  }
  return response;
}

/**
 * Authenticate against UI SSO CAS by programmatically submitting the login form.
 *
 * This follows the same HTML form submission a browser would perform:
 * 1. GET the CAS login page → extract hidden fields (lt, execution, _eventId) and JSESSIONID
 * 2. POST username + password with the hidden fields → intercept the redirect to extract the ticket
 * 3. Validate the service ticket via the standard CAS serviceValidate endpoint
 *
 * The password is used only for this transient exchange and is never stored.
 */
export async function casFormLogin(
  username: string,
  password: string,
): Promise<{ username: string; fullname: string }> {
  const jar = new CookieJar();
  const serviceUrl = `${settings.origin}/api/auth/cas/callback`;
  const loginUrl = `${settings.cas}/login?${new URLSearchParams({ service: serviceUrl })}`;

  // 1. Load CAS login page
  const pageResponse = await fetchWithJar(jar, loginUrl, { redirect: 'error' });
  if (!pageResponse.ok) throw new Error('CAS login page unavailable');

  const html = await pageResponse.text();
  if (html.length > 2_000_000) throw new Error('CAS response too large');
  const $ = load(html);
  const form = $('form#fm1');
  if (!form.length) throw new Error('CAS login form not found');

  const formAction = form.attr('action');
  const postUrl = formAction ? new URL(formAction, settings.cas).href : loginUrl;

  // Collect all hidden fields dynamically — resilient to field name changes
  const body = new URLSearchParams();
  body.set('username', username);
  body.set('password', password);
  form.find('input[type="hidden"]').each((_, el) => {
    const name = $(el).attr('name');
    const value = $(el).attr('value');
    if (name && value !== undefined) body.set(name, value);
  });

  // 2. Submit form; intercept redirect to extract service ticket
  const postResponse = await fetchWithJar(jar, postUrl, {
    method: 'POST',
    body,
    redirect: 'manual',
  });

  const location = postResponse.headers.get('location') || '';
  console.log(
    JSON.stringify({
      event: 'cas_post_response',
      status: postResponse.status,
      location,
      setCookies: postResponse.headers.getSetCookie(),
    }),
  );

  let ticket: string | null = null;
  try {
    const redirectUrl = new URL(location, settings.origin);
    ticket = redirectUrl.searchParams.get('ticket');
  } catch {
    // location is invalid or missing — falls through to the error below
  }

  // Fallback: if no ticket in redirect, visit loginUrl with cookies (as in sso-proxy)
  if (!ticket) {
    console.log(JSON.stringify({ event: 'cas_retry_with_cookie', loginUrl }));
    const retryResponse = await fetchWithJar(jar, loginUrl, {
      redirect: 'manual',
    });
    const retryLocation = retryResponse.headers.get('location') || '';
    console.log(
      JSON.stringify({
        event: 'cas_retry_response',
        status: retryResponse.status,
        location: retryLocation,
      }),
    );
    try {
      const redirectUrl = new URL(retryLocation, settings.origin);
      ticket = redirectUrl.searchParams.get('ticket');
    } catch {
      // ignore
    }
    if (!ticket && postResponse.status === 200) {
      const pageHtml = await postResponse.text();
      const $err = load(pageHtml);
      const errMsg = $err('.errors, .error, .alert, .has-error, #status, #msg')
        .text()
        .trim();
      console.log(JSON.stringify({ event: 'cas_form_error_text', errMsg }));
    }
  }

  if (!ticket) throw new Error('CAS authentication failed');

  // 3. Validate service ticket server-side (same as existing CAS callback)
  const validateUrl = `${settings.cas}/serviceValidate?${new URLSearchParams({ service: serviceUrl, ticket })}`;
  const validateResponse = await fetch(validateUrl, {
    signal: AbortSignal.timeout(15_000),
    redirect: 'error',
  });
  if (!validateResponse.ok) throw new Error('CAS ticket validation unavailable');
  return parseIdentity(await validateResponse.text());
}
