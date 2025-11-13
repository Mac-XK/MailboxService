import { invoke } from '@tauri-apps/api/core'

export const GPTMAIL_DOMAINS = [
  "gravityengine.cc", "14thgainsborough.org.uk", "15thbattalionrelief.com", "14club.org.uk",
  "29thnewport.org.uk", "2ndwhartonscoutgroup.org.uk", "3littlemiracles.com", "aard.org.uk",
  "abrahampath.org.uk", "aiccministry.com", "allumhall.co.uk", "almiswelfare.org",
  "amyfalconer.co.uk", "avarthanas.org", "aylshamrotary.club", "bbfcharity.org",
  "birdsedgevillagehall.co.uk", "bletsoetownclosecharity.bio", "bodyofchristministries.co.uk",
  "bp-hall.co.uk", "brendansbridge.org.uk", "brentwoodmdc.org", "cade.org.uk", "caye.org.uk",
  "cccnoahsark.com", "cccvojc.org", "cementingfutures.org", "cephastrust.org", "chatgptuk.pp.ua",
  "christchurchandstgeorges.org", "christchurchsouthend.org.uk", "cketrust.org", "club106.org.uk",
  "cockertonmethodist.org.uk", "cok.org.uk", "counsellingit.org", "cumnorthampton.org",
  "cwetg.co.uk", "dormerhouseschool.co.uk", "dpmcharity.org", "eapn-england.org",
  "educationossett.co.uk", "egremonttrust.org.uk", "engagefordevelopment.org", "e-quiparts.org.uk",
  "f4jobseekers.org.uk", "flushingvillageclub.org.uk", "fordslane.org.uk", "freemails.pp.ua",
  "friendsofkms.org.uk", "gadshillplace.com", "goleudy.org.uk", "gospelassembly.org.uk",
  "gospelgeneration.org.uk", "gracesanctuary-rccg.co.uk", "greyhoundwalks.org.uk", "gyan-netra.com",
  "haslemerecfr.org.uk", "hfh4elderly.org", "hhe.org.uk", "hottchurch.org.uk", "huddsdeafcentre.org",
  "hvcrc.org", "ingrambreamishvalley.co.uk", "iqraacademy.org.uk", "iraniandsa.org",
  "kbishwanathuk.cc", "kempsonplayers.org", "lbatrust.co.uk", "leicscoopband.co.uk", "lflct.org.uk",
  "living-water.org.uk", "lovecambodia.co.uk", "lutonsymphony.com", "macclesfieldmvc.org.uk",
  "milnerinstitute.org", "mtdalmshouse.fitness", "musicatleamingtonhastings.co.uk", "neuaddowen.org.uk",
  "newdoorsproject.org", "newhoperelief.org", "newlifedorking.org.uk", "newlifefellowshipuk.com",
  "ngbotima.com", "nnrbc.org", "northboveymeadow.business", "ocgm.org.uk", "ofcinternational.org",
  "oughtibridgechapel.org.uk", "ozznx.com", "paulnormantrust.org", "pierre-angulaire.org",
  "pjm-trust.org", "pontfest.org.uk", "portsmouthchorus.org", "powysbarnowls.com",
  "ppedu.pp.ua", "rainbownews.org", "rawdhah.academy", "rccg-clf.org", "rccgvhr.org",
  "resthavencare.org.uk", "rhalmshouse.church", "rhydwilym.com", "riyo.org.uk", "rmtcweb.co.uk",
  "sanity-uk.org", "sawley-scouts.org.uk", "sbmen.org", "scrivenertrust.org", "sidneymichaelpoland.travel",
  "skmet.co.uk", "solwmi.org", "steptogetherdance.org.uk", "stmarysplaygroupbanbury.org",
  "stmichaelsflixton.co.uk", "svmc.org.uk", "tasmforvictory.com", "tatendatrust.org.uk",
  "theadmiraltrust.org.uk", "thestuartfeakinstrust.com", "thewonderbus.org",
  "thurleighchurchestate.church", "tlcappealeastkent.co.uk", "tradamis.org",
  "trees-surrey.org.uk", "vision15.co.uk", "vpachurch.org", "westraintonjubileehall.org.uk",
  "weymouthdramaclub.co.uk", "wofmission.org", "wohbc.org.uk", "wordlifecentre.org",
  "wsmptfa.org.uk", "wyldegreenurc.org.uk", "xxmailedu.dpdns.org", "yetga.co.uk", "zawauk.org",
  "zumuntahassociationuk.org", "blogger.nyc.mn", "bradingtowntrust.me", "education.nyc.mn",
  "fdacharity.me", "forum.nyc.mn", "gsoleyfoyle.me", "harrowschool.me", "honourable.me",
  "student.nyc.mn", "2ndleekscouts.co.uk", "2ndurmstonscoutgroup.org.uk", "30thbrighton.org.uk",
  "4thkenton.co.uk", "aberllefenni.co.uk", "advantageyoungpeople.com", "afgpuk.co.uk",
  "ahavaexperience.com", "alarafoundation.com", "aldermansteevens.me", "aldworthlodge.org.uk",
  "alhsalumni.org", "amingod.org", "aoac.org.uk", "apassionforafrica.com",
  "aslactongreatmoulton.co.uk", "baileybridge.org", "beautifulblessingsbeyondborders.org",
  "beevorband.co.uk", "berkshirephab.org", "bidefordroundtable.co.uk", "birminghamlife.org.uk",
  "bishwanathuk.cc", "blackboyspreschool.org.uk", "bowespreschool.co.uk", "bradingtowntrust.co.uk",
  "braishfield-pc.org", "breakthru-youth.co.uk", "bridgetonmainstreet.org",
  "buckinghampreschoolplaygroup.co.uk", "burscoughscoutgroup.co.uk", "cantercare.org",
  "cclondres.com", "charityrcao.org.uk", "chorltonhighschool.me", "christianartstrust.org.uk",
  "church180mcr.co.uk", "churchestate.org.uk", "churchhousemanaton.co.uk", "cibf.org.uk",
  "cityunitedacademy.me", "clanfieldpreschool.org", "corbyrise.com",
  "cornwallaerospaceeducationtrust.org", "crawshaypreschool.com", "cridlingstubbs.org.uk",
  "croxtonresthomes.me", "cubbingtonsilverband.com", "dawsoncountygunclub.org", "dialsouthend.org",
  "dmcelements.org", "dominion-chapel.org", "dunsvillecommunitycentre.co.uk", "eastcombe.org",
  "ecclesallpreschool.org.uk", "empa.org.uk", "epurcf.org", "felixstowemusicaltheatre.co.uk",
  "fighthunger.co.uk", "fightingzebras.org", "finchleychoral.info", "finchleychoral.org.uk",
  "findmeghana.org", "fmgt.org.uk", "forgetmenotstudio.org.uk", "fortonscouts.co.uk",
  "fosmcalne.org.uk", "frankhealeyfoundation.org", "freedomcentremereside.org",
  "friendsceredigionmuseum.com", "friendsofbram.com", "friendsofmeresworth.co.uk",
  "friendsofstnicholasgw.co.uk", "gemmarosefoundation.co.uk", "georgefletcher.org.uk",
  "georgeheddon.co.uk", "girlguidingmarchdistrict.org", "givetoeducation.org", "glawn.org.uk",
  "gotrak.org", "gracechurchcc.org.uk", "gsoleyfoyle.org.uk", "gururavidas.org.uk",
  "hampshireschools.org.uk", "handsofhelpinc.org", "happyheadshed.org", "harescombe.me",
  "harpendenhelpinghand.co.uk", "hayfield-civic-trust.org.uk", "healingheartmission.org",
  "heatherpreschool.co.uk", "heyshamcommunitypreschool.co.uk", "hmh.org.uk", "howardgiving.org",
  "huttonandhowick-wi.org.uk", "hyndmans.org.uk", "ickletonrelief.co.uk", "ikfoundation.org.uk",
  "innerwheelherefordwyevalley.org", "isaiahtrust.org.uk", "islandsportstrust.co.uk",
  "jamesjfattorini.rocks", "jamesthynnealmshouse.co.uk", "jjfcharitabletrust.co.uk",
  "kempstoncharities.band", "kempstoncharities.co.uk", "keswacharity.com", "kongochild.com",
  "lifecaretrust.org.uk", "lifetreechurch.co.uk", "lighthouseconnect.co.uk",
  "littlemissendenvillagehall.org", "littlemvh.org.uk", "lordfortescue.news", "lordfortescue.org.uk",
  "lostnow.org", "marchguidesassociation.org", "marchguidesassociation.org.uk",
  "markableytrust.org.uk", "markandvirginiarometty.org", "marygrangeruk.com",
  "mcaslan-family-trust.com", "medicichoir.org", "meef.uk", "middletoncheneyuc.uk",
  "millenniumharvest.org", "moorlandwaldorf.org", "mosswoodmissionhall.bio", "mstdc.org.uk",
  "mstp.co.uk", "mtdalmshouse.uk", "myfreedom.church", "nationalpolicecommunitytrust.org",
  "nctabernacle.org", "newsteadabbeypartnership.org", "noizonicfoundation.com",
  "nondet.org.uk", "oneummahorg.uk", "orangeandgrey.org.uk", "owfa.org.uk",
  "pandorasboxproductions.org", "parkertrust.org.uk", "penkridgesportsandrecreationcentre.org",
  "peperharowunitedcharities.me", "phccsouthend.co.uk", "phdf.co.uk", "pigletspreschool.org.uk",
  "pkcommunityassociation.co.uk", "placenet.org.uk", "prestige-leadership.org", "qlhub.org.uk",
  "rafawrekin-wellington.co.uk", "rccglivingspring.org.uk", "recreationgroundparish.me",
  "reverendneedham.co.uk", "rewardtrust.org.uk", "rhalmshouse.co.uk", "rhythm-uk.org",
  "rnyf.org", "rosemarytrust.org", "royalpriesthoodagc.org.uk", "rtrobinsbequest.org.uk",
  "rudhamlittleowls.co.uk", "sanauk.org", "sargeantmemorial.me", "sasanaramsiuk.org",
  "schoolsofcheshamcarnival.org.uk", "seasonofgrace.org", "selcc.org.uk", "sitwelltownlands.org.uk",
  "slyouthuk.org", "smpcharity.co.uk", "somervillepreschool.co.uk", "southeastessexanimal.uk",
  "specialneedscircle.co.uk", "stangroundcc.co.uk", "staplehurstunder5.co.uk", "steddfota.org",
  "stevenagechoral.org.uk", "stevenstrust.org", "stmaryswendover.org.uk",
  "stpaulsgrammaralumniusa.org", "streetlevel.org.uk", "sunnysideplaygroup.org.uk",
  "surbitonnewlifebaptist.com", "sussexotters.org.uk", "svps.org.uk", "swanseawomenscentre.co.uk",
  "sweynechoralsociety.org.uk", "sylvaniahall.co.uk", "sytchamptoncc.co.uk", "sytchampton.directory",
  "teamnewmexico.org", "telfordchineseschool.org.uk", "thameschamberorchestra.co.uk",
  "thedorsetcarershub.org", "thefullgospelhall.org", "thelifecentre.org.uk",
  "thomasblackerby.org.uk", "timbourkescholarshipfund.org", "tivertonhospitalleagueoffriends.co.uk",
  "trainthem2fish.co.uk", "transtanz.org", "tsdpt.co.uk", "tstrust.org.uk", "turveynonecclesiastical.com",
  "ukev.org", "ukmcs.org", "unitedcharitiesosm.org.uk", "valueineveryone.co.uk",
  "vernonbourne.uk", "vfwladiesauxin.org", "voicesforchangeinc.org", "waisfoundation.com",
  "wargravepreschool.com", "wargravepreschool.online", "wargravepreschool.uk", "wcmf.org.uk",
  "weldonpreschool.co.uk", "wessexlodge4093.org", "whirlygirlink.org", "wicfolhumanservices.org",
  "winantclayton.org.uk", "wmct.info", "wohbc.co.uk", "writtlescoutgroup.org", "wtjinkintrust.co.uk",
  "londonyouthsailing.org"
]

const API_BASE_URL = 'https://mail.chatgpt.org.uk/api'

const DEFAULT_HEADERS = {
  Accept: 'application/json, text/plain, */*',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Referer: 'https://mail.chatgpt.org.uk/'
}

const buildHeaders = (extra = {}) => {
  const headers = { ...DEFAULT_HEADERS, ...extra }
  return Object.keys(headers).length > 0 ? headers : null
}

const parseDate = (value) => {
  if (!value) {
    return Math.floor(Date.now() / 1000)
  }

  const normalized = value.replace(' ', 'T')

  let date = new Date(normalized)
  if (Number.isNaN(date.getTime())) {
    date = new Date(`${normalized}Z`)
  }

  if (Number.isNaN(date.getTime())) {
    date = new Date(value)
  }

  if (Number.isNaN(date.getTime())) {
    return Math.floor(Date.now() / 1000)
  }

  return Math.floor(date.getTime() / 1000)
}

const parseAddress = (value) => {
  if (!value) {
    return { name: '', address: '' }
  }

  const trimmed = value.trim()

  const match = trimmed.match(/^(.+?)\s*<(.+?)>$/)
  if (match) {
    return {
      name: match[1].trim(),
      address: match[2].trim()
    }
  }

  const angleOnly = trimmed.match(/^<(.+?)>$/)
  if (angleOnly) {
    return {
      name: '',
      address: angleOnly[1].trim()
    }
  }

  return {
    name: '',
    address: trimmed
  }
}

const request = async (path, { method = 'GET', body = null, headers = {} } = {}) => {
  const payload = {
    url: `${API_BASE_URL}${path}`,
    method,
    token: null,
    headers: buildHeaders(headers),
    body: body !== null ? (typeof body === 'string' ? body : JSON.stringify(body)) : null
  }

  const response = await invoke('fetch_api', payload)

  if (response.status >= 400) {
    let message = `HTTP ${response.status}`
    try {
      const parsed = JSON.parse(response.body)
      if (parsed?.error) {
        message = parsed.error
      }
    } catch (err) {
      if (response.body) {
        message = response.body
      }
    }
    throw new Error(message)
  }

  if (!response.body) {
    return null
  }

  try {
    return JSON.parse(response.body)
  } catch (err) {
    return response.body
  }
}

export async function generateEmail({ prefix, domain } = {}) {
  const hasCustom = Boolean(prefix || domain)
  const options = hasCustom
    ? {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          ...(prefix ? { prefix } : {}),
          ...(domain ? { domain } : {})
        }
      }
    : { method: 'GET' }

  const data = await request('/generate-email', options)
  if (!data?.email) {
    throw new Error(data?.error || '生成邮箱失败')
  }
  return data.email
}

export async function fetchEmails(email) {
  if (!email) {
    throw new Error('邮箱地址为空')
  }

  const data = await request(`/emails?email=${encodeURIComponent(email)}`)
  const emails = Array.isArray(data?.emails) ? data.emails : []
  return {
    count: data?.count ?? emails.length,
    emails
  }
}

export async function deleteEmail(id) {
  if (!id) {
    throw new Error('缺少邮件 ID')
  }
  await request(`/email/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function clearEmails(email) {
  if (!email) {
    throw new Error('邮箱地址为空')
  }
  await request(`/emails/clear?email=${encodeURIComponent(email)}`, { method: 'DELETE' })
}

export function normalizeEmail(mail, mailboxAddress) {
  if (!mail || typeof mail !== 'object') {
    return null
  }

  const createdAt = parseDate(mail.created_at)
  const from = parseAddress(mail.from_address || mail.from || '')
  const toAddress = parseAddress(mail.email_address || mailboxAddress || '')

  const html = mail.html_content || ''
  const textContent = mail.content || mail.text_content || ''

  return {
    id: String(mail.id ?? mail.uuid ?? `${createdAt}-${Math.random().toString(36).slice(2)}`),
    from,
    to: [toAddress],
    subject: mail.subject || '(无主题)',
    text: textContent,
    html,
    created_at: createdAt,
    seen: Boolean(mail.seen || mail.read),
    raw: mail
  }
}

export default {
  generateEmail,
  fetchEmails,
  deleteEmail,
  clearEmails,
  normalizeEmail
}
