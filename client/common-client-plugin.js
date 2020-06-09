function register ({ registerHook, peertubeHelpers }) {

  registerHook({
    target: 'action:router.navigation-end',
    handler: () => checkDefaultSignin(peertubeHelpers)
  })

  document.querySelector('span.icon-menu').addEventListener('click', () => checkDefaultSignin(peertubeHelpers)) // listen on menu click
}

function hideDefaultSignin (){
  var loginButton = document.querySelector('a.login-button')
  if(loginButton == null) return // return if menu is hidden
  loginButton.style.visibility = "hidden" // hide login button
  document.querySelector('a.create-account-button').style.visibility = "hidden" // hide signup button
  
  var newJoinButton = document.querySelector('a.new-join-button')
  if( newJoinButton == null ){
    // create new external-login button
    newJoinButton = document.createElement('a')
    newJoinButton.setAttribute('href', '/plugins/auth-discourse/0.0.4/auth/discourse-auth') // needs to have the correct version here
    newJoinButton.className = 'new-join-button'
    newJoinButton.innerHTML = 'JOIN'
    newJoinButton.style.cssText = ' display: inline-block; border: none; font-weight: 600; font-size: 15px; height: 30px; line-height: 30px; border-radius: 3px; text-align: center; padding: 0 17px 0 13px; cursor: pointer; display: block; width: 100%; color: #fff; background-color: #fd7e14;'
    loginButton.parentNode.insertBefore(newJoinButton, loginButton)
  }
}

function checkDefaultSignin (peertubeHelpers){
  peertubeHelpers.getSettings().then(
    s => {
      if( !s ) return
      if( s['hide_default_signup'] ) hideDefaultSignin() 
    })
}

export {
  register
}