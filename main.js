const crypto = require('crypto')
const querystring = require('querystring')

const store = {}

async function register ({
  registerExternalAuth,
  unregisterExternalAuth,
  registerSetting,
  settingsManager,
  peertubeHelpers,
  getRouter

}) {

  registerSetting({
    name: 'sso_secret',
    label: 'sso secret',
    type: 'input',
    private: true,
    default: ''
  })

  registerSetting({
    name: 'discourse_base_url',
    label: 'discourse base url',
    type: 'input',
    private: false,
    default: 'https://example.com'
  })

  const baseUrl = peertubeHelpers.config.getWebserverUrl()

  storeSettings(await settingsManager.getSettings([ 'sso_secret', 'discourse_base_url' ]))
  settingsManager.onSettingsChange(settings => {
    storeSettings(settings)
  })

  const result = registerExternalAuth({
    authName: 'discourse-auth',
    authDisplayName: () => 'JOIN',
    onAuthRequest: (req, res) => {
      // generate random nonce and compute hmac-sha256
      var hmac = crypto.createHmac('sha256', store.sso_secret)
      var randBytes = crypto.randomBytes(16)
      store.nonce = randBytes.toString('hex')
      // create payload with nonice and return url and nonce
      var return_url = baseUrl + '/plugins/auth-discourse/router/external-auth-callback'
      var payload = 'nonce=' + store.nonce + '&return_sso_url=' + return_url
      // create signature from payload with secret
      var payload_b64 = new Buffer(payload).toString('base64')
      hmac.update(payload_b64)
      var hex_sig = hmac.digest('hex')
      var urlenc_payload_b64 = encodeURIComponent(payload_b64)
      var redirectUrl = store.discourse_base_url + '/session/sso_provider?sso=' + urlenc_payload_b64 + '&sig=' + hex_sig
      res.redirect(redirectUrl)
    }
  })
  store.userAuthenticated = result.userAuthenticated

  const router = getRouter()
  router.use('/external-auth-callback', (req, res) => {
    // compute hmac signature from sso with secret and compare to sig
    var sso = req.query.sso
    var sig = req.query.sig
    var hmac = crypto.createHmac('sha256', store.sso_secret)
    var decoded_sso = decodeURIComponent(sso)
    hmac.update(decoded_sso)
    var hash = hmac.digest('hex')
    // exit if no match
    if(hash != sig){
      console.log('sig doesnt match')
      return res.sendStatus(401)
    }
    // decode the sso and compare the returned nonce
    var b = new Buffer(sso, 'base64')
    var embedded_query = b.toString('utf-8')
    var params = querystring.parse(embedded_query)
    // exit if no match
    if(params.nonce != store.nonce){
      console.log('nonce doesnt match')
      return res.sendStatus(401)
    }
    // if all checks pass then authenticate the user
    store.userAuthenticated({
      req,
      res,
      username: params.username,
      email: params.email,
      role: 2,
      displayName: params.username
    })
    return res.sendStatus(200)
  })

}

function storeSettings (settings) {
  if(settings.sso_secret) store.sso_secret = settings.sso_secret
  if(settings.discourse_base_url) store.discourse_base_url = settings.discourse_base_url
}

async function unregister () {
  return
}

module.exports = {
  register,
  unregister
}
